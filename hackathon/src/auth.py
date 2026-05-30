from fastapi import Depends, HTTPException, Header
from fastapi.security import APIKeyHeader
from starlette.status import HTTP_401_UNAUTHORIZED
import os
import json
import base64
import logging

try:
    import jwt as pyjwt
    _HAS_PYJWT = True
except ImportError:
    _HAS_PYJWT = False

logger = logging.getLogger(__name__)

# API Key authentication
API_KEY_NAME = "X-API-Key"
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)

# JWT settings (must mirror auth_routes.py)
JWT_SECRET = os.getenv("JWT_SECRET", "hackaverse-dev-secret-change-me")
JWT_ALGORITHM = "HS256"


def get_current_user_id(authorization: str = Header(None)) -> str:
    """Extract and verify user_id from a JWT bearer token.

    Supports:
      1. Proper PyJWT-signed tokens (preferred).
      2. Legacy base64 tokens (backward compat — will be removed).
    """
    if not authorization:
        logger.warning("[AUTH] Missing Authorization header")
        raise HTTPException(status_code=HTTP_401_UNAUTHORIZED, detail="Missing Authorization header")
    if not authorization.startswith("Bearer "):
        logger.warning(f"[AUTH] Invalid Authorization format: {authorization[:20]}...")
        raise HTTPException(status_code=HTTP_401_UNAUTHORIZED, detail="Invalid Authorization format")

    token = authorization.split(" ", 1)[1]
    logger.debug(f"[AUTH] Token received: {token[:20]}...")

    # ---------- Try proper JWT verification first ----------
    if _HAS_PYJWT:
        try:
            payload = pyjwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            user_id = payload.get("user_id")
            if not user_id:
                raise HTTPException(status_code=HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
            logger.info(f"[AUTH] JWT verified for user: {user_id}")
            return user_id
        except pyjwt.ExpiredSignatureError:
            raise HTTPException(status_code=HTTP_401_UNAUTHORIZED, detail="Token has expired")
        except pyjwt.InvalidTokenError as e:
            logger.warning(f"[AUTH] JWT verification failed: {e}")
            raise HTTPException(status_code=HTTP_401_UNAUTHORIZED, detail="Invalid or tampered token")
    else:
        logger.error("[AUTH] PyJWT not installed — cannot verify tokens")
        raise HTTPException(status_code=HTTP_401_UNAUTHORIZED, detail="Authentication unavailable")
async def get_api_key(api_key_header: str = Depends(api_key_header)):
    """Validate API key for protected endpoints."""
    expected_key = os.getenv("API_KEY", "default_key")
    # SECURITY: Block default key in production
    if expected_key == "default_key" and os.getenv("ENV", "development").lower() == "production":
        logger.critical("[SECURITY] API_KEY is 'default_key' in PRODUCTION! Set API_KEY in .env!")
        raise HTTPException(status_code=500, detail="Server misconfiguration")
    if api_key_header == expected_key:
        return api_key_header
    else:
        logger.warning(f"[API_KEY] Invalid API key provided")
        raise HTTPException(
            status_code=HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing API Key",
        )