# src/routes/auth_routes.py
from fastapi import APIRouter, HTTPException, Depends, status, Header, Request
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime, timedelta
import logging
import secrets
import hashlib
import bcrypt
import jwt as pyjwt
from ..database import get_db
from ..auth import get_current_user_id
from ..db_models import COLLECTIONS
from ..schemas.response import APIResponse
import os

logger = logging.getLogger(__name__)

logger.debug("Auth routes loaded")

router = APIRouter(tags=["auth"])

# ============================================================================
# SCHEMAS
# ============================================================================

class LoginRequest(BaseModel):
    email: EmailStr = Field(..., description="User email")
    password: str = Field(..., min_length=6, description="User password")

class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr = Field(..., description="User email")
    password: str = Field(..., min_length=6, description="Password (min 6 chars)")
    # SECURITY: Role is always forced to 'participant' on registration.
    # Admin/judge roles can ONLY be assigned by an existing admin.
    role: Optional[str] = Field(default="participant")

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "bearer"
    user: dict

# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

# JWT secret — MUST be set in production via env var
JWT_SECRET = os.getenv("JWT_SECRET", "hackaverse-dev-secret-change-me")
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_HOURS = int(os.getenv("JWT_EXPIRY_HOURS", "24"))

# SECURITY: Warn if using default JWT secret
if JWT_SECRET == "hackaverse-dev-secret-change-me":
    _env_mode = os.getenv("ENV", "development").lower()
    if _env_mode == "production":
        logger.critical("[SECURITY] JWT_SECRET is using DEFAULT VALUE in PRODUCTION! Set JWT_SECRET in .env immediately!")
    else:
        logger.warning("[SECURITY] JWT_SECRET is using default value — acceptable for local dev only")


def hash_password(password: str) -> str:
    """Hash password using bcrypt (salted automatically)."""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def _is_bcrypt_hash(h: str) -> bool:
    """Check whether a stored hash looks like a bcrypt hash."""
    return h.startswith("$2b$") or h.startswith("$2a$")


def verify_password(stored_hash: str, password: str) -> bool:
    """Verify password against stored hash.

    Supports both legacy SHA-256 hashes (for backward compat) and bcrypt.
    """
    if _is_bcrypt_hash(stored_hash):
        return bcrypt.checkpw(password.encode("utf-8"), stored_hash.encode("utf-8"))
    # Legacy SHA-256 path
    return hashlib.sha256(password.encode()).hexdigest() == stored_hash


def _rehash_if_legacy(stored_hash: str, password: str, db, user_id: str):
    """If the user still has a legacy SHA-256 hash, silently upgrade to bcrypt."""
    if not _is_bcrypt_hash(stored_hash):
        new_hash = hash_password(password)
        try:
            db[COLLECTIONS["users"]].update_one(
                {"user_id": user_id},
                {"$set": {"password_hash": new_hash}}
            )
            logger.info(f"[AUTH] Password hash upgraded to bcrypt for user {user_id}")
        except Exception as exc:
            logger.warning(f"[AUTH] Could not upgrade hash for {user_id}: {exc}")


def generate_token(length: int = 32) -> str:
    """Generate a random token"""
    return secrets.token_urlsafe(length)


def create_jwt_token(user_id: str, email: str) -> str:
    """Create a proper JWT token signed with HMAC-SHA256."""
    now = datetime.utcnow()
    payload = {
        "user_id": user_id,
        "email": email,
        "iat": now,
        "exp": now + timedelta(hours=JWT_EXPIRY_HOURS),
    }
    return pyjwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def get_user_response(user_doc: dict) -> dict:
    """Format user document for response"""
    return {
        "id": str(user_doc.get("_id", "")),
        "user_id": user_doc.get("user_id", ""),
        "email": user_doc.get("email", ""),
        "name": user_doc.get("name", ""),
        "role": user_doc.get("role", "participant"),
        "profile_completion": user_doc.get("profile_completion", 0),
        "team_id": user_doc.get("team_id", None),
        "created_at": user_doc.get("created_at", datetime.now().isoformat())
    }

# ============================================================================
# AUTH ENDPOINTS
# ============================================================================

@router.post("/register", summary="Register a new user")
async def register(request: RegisterRequest, raw_request: Request):
    """Register a new user account."""
    # Rate limit: 10 attempts per 5 minutes per IP
    from ..utils.rate_limiter_public import check_auth_rate_limit
    check_auth_rate_limit(raw_request)
    try:
        db = get_db()
        if db is None:
            logger.warning(f"[REGISTER] Database unavailable - using in-memory storage for {request.email}")
            user_id = f"user_{datetime.now().timestamp()}"
            access_token = create_jwt_token(user_id, request.email)
            refresh_token = generate_token(32)
            
            user_data = {
                "user_id": user_id,
                "email": request.email,
                "name": request.name,
                "role": "participant",  # SECURITY: Always force participant on registration
                "_id": user_id,
                "created_at": datetime.now().isoformat()
            }
            
            return APIResponse(
                success=True,
                message="User registered successfully (in-memory)",
                data={
                    "access_token": access_token,
                    "refresh_token": refresh_token,
                    "token_type": "bearer",
                    "user": get_user_response(user_data)
                }
            )
        
        # Check if user already exists
        existing_user = db[COLLECTIONS["users"]].find_one({"email": request.email})
        if existing_user:
            raise HTTPException(status_code=400, detail="User with this email already exists")
        
        # Create new user
        user_id = f"user_{datetime.now().timestamp()}"
        password_hash = hash_password(request.password)
        
        user_data = {
            "user_id": user_id,
            "email": request.email,
            "name": request.name,
            "role": "participant",  # SECURITY: Always force participant on registration
            "password_hash": password_hash,
            "profile_completion": 0,
            "skills": [],
            "bio": None,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        
        result = db[COLLECTIONS["users"]].insert_one(user_data)
        
        # Generate tokens
        access_token = create_jwt_token(user_id, request.email)
        refresh_token = generate_token(32)
        
        # Store refresh token
        db[COLLECTIONS["sessions"]].insert_one({
            "user_id": user_id,
            "refresh_token": refresh_token,
            "created_at": datetime.now().isoformat(),
            "expires_at": (datetime.now() + timedelta(days=7)).isoformat()
        })
        
        user_data["_id"] = str(result.inserted_id)
        
        logger.info(f"User registered: {request.email} (user_id: {user_id})")
        logger.debug(f"[REGISTER] Access token generated: {access_token[:20]}...")
        
        return APIResponse(
            success=True,
            message="User registered successfully",
            data={
                "access_token": access_token,
                "refresh_token": refresh_token,
                "token_type": "bearer",
                "user": get_user_response(user_data)
            }
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        raise HTTPException(status_code=500, detail="Registration failed")


@router.post("/login", summary="Login user")
async def login(request: LoginRequest, raw_request: Request):
    """Login with email and password."""
    # Rate limit: 10 attempts per 5 minutes per IP
    from ..utils.rate_limiter_public import check_auth_rate_limit
    check_auth_rate_limit(raw_request)
    try:
        db = get_db()
        if db is None:
            raise HTTPException(status_code=503, detail="Database unavailable")
        
        # Find user by email
        user = db[COLLECTIONS["users"]].find_one({"email": request.email})
        if not user:
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Verify password
        if not verify_password(user.get("password_hash", ""), request.password):
            raise HTTPException(status_code=401, detail="Invalid email or password")

        # Extract user_id BEFORE using it (was P0 crash bug — used before assignment)
        user_id = user.get("user_id", "")

        # Silently upgrade legacy SHA-256 hash to bcrypt on successful login
        _rehash_if_legacy(user.get("password_hash", ""), request.password, db, user_id)

        # Generate tokens
        access_token = create_jwt_token(user_id, request.email)
        refresh_token = generate_token(32)
        
        # Store refresh token
        db[COLLECTIONS["sessions"]].insert_one({
            "user_id": user_id,
            "refresh_token": refresh_token,
            "created_at": datetime.now().isoformat(),
            "expires_at": (datetime.now() + timedelta(days=7)).isoformat()
        })
        
        logger.info(f"User logged in: {request.email} (user_id: {user_id})")
        logger.debug(f"[LOGIN] Access token generated: {access_token[:20]}...")
        
        return APIResponse(
            success=True,
            message="Login successful",
            data={
                "access_token": access_token,
                "refresh_token": refresh_token,
                "token_type": "bearer",
                "user": get_user_response(user)
            }
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(status_code=500, detail="Login failed")

@router.post("/refresh", summary="Refresh access token", response_model=TokenResponse)
async def refresh_token(request: RefreshTokenRequest):
    """
    Refresh access token using refresh token
    
    - **refresh_token**: Valid refresh token from login/register
    """
    try:
        db = get_db()
        if db is None:
            raise HTTPException(status_code=503, detail="Database unavailable")
        
        # Find session with refresh token
        session = db[COLLECTIONS["sessions"]].find_one({
            "refresh_token": request.refresh_token
        })
        
        if not session:
            raise HTTPException(status_code=401, detail="Invalid refresh token")
        
        # Check if token is expired
        expires_at = datetime.fromisoformat(session.get("expires_at", datetime.now().isoformat()))
        if datetime.now() > expires_at:
            raise HTTPException(status_code=401, detail="Refresh token expired")
        
        # Get user
        user = db[COLLECTIONS["users"]].find_one({"user_id": session["user_id"]})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        # Generate new access token
        access_token = create_jwt_token(user.get("user_id", ""), user.get("email", ""))
        new_refresh_token = generate_token(32)
        
        # Update session
        db[COLLECTIONS["sessions"]].update_one(
            {"_id": session["_id"]},
            {"$set": {"refresh_token": new_refresh_token}}
        )
        
        logger.info(f"Token refreshed for user: {user.get('email')}")
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=new_refresh_token,
            user=get_user_response(user)
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Token refresh error: {str(e)}")
        raise HTTPException(status_code=500, detail="Token refresh failed")

@router.post("/logout", summary="Logout user")
async def logout(body: RefreshTokenRequest):
    """
    Logout user by invalidating refresh token
    
    - **refresh_token**: Refresh token to invalidate
    """
    try:
        refresh_token = body.refresh_token
        db = get_db()
        if db is not None:
            result = db[COLLECTIONS["sessions"]].delete_one({
                "refresh_token": refresh_token
            })
            
            if result.deleted_count > 0:
                logger.info("User logged out")
        
        return APIResponse(
            success=True,
            message="Logged out successfully",
            data=None
        )
    
    except Exception as e:
        logger.error(f"Logout error: {str(e)}")
        return APIResponse(
            success=False,
            message="Logout failed",
            data=None
        )

@router.get("/me", summary="Get current user", dependencies=[])
async def get_current_user(authorization: str = Header(None)):
    """
    Get current authenticated user (requires Bearer token in Authorization header)
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authorization header required")
    
    # Extract user_id from token
    user_id = get_current_user_id(authorization)
    
    # Fetch user from database
    db = get_db()
    if db is None:
        # For development/testing, return basic user info from token
        logger.warning("[GET_ME] Database unavailable, returning token-based user info")
        return APIResponse(
            success=True,
            message="User retrieved successfully (DB unavailable)",
            data={
                "user_id": user_id,
                "email": "user@example.com",
                "name": "Test User",
                "role": "participant"
            }
        )
    
    user = db[COLLECTIONS["users"]].find_one({"user_id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return APIResponse(
        success=True,
        message="User retrieved successfully",
        data=get_user_response(user)
    )
