"""
Judge Invitation System - Backend Routes
Handles judge invitations, acceptance, and account creation
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime, timedelta
import secrets
import logging
from pymongo.errors import DuplicateKeyError
from ..auth import get_api_key
from ..database import get_db
from ..db_models import COLLECTIONS
from ..services.email_service import send_judge_invitation_email
from ..schemas.response import APIResponse
from ..routes.auth_routes import (
    hash_password,
    create_jwt_token,
    generate_token,
    get_user_response,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/judge", tags=["judge-invitations"])

# ============================================================================
# REQUEST/RESPONSE MODELS
# ============================================================================

class SendJudgeInvitationRequest(BaseModel):
    email: EmailStr
    hackathon_id: str = None
    hackathon_name: str = "HackaVerse"

class AcceptJudgeInvitationRequest(BaseModel):
    token: str
    name: str = Field(..., min_length=2, max_length=100)
    password: str = Field(..., min_length=6, description="Password for judge login (min 6 chars)")

class JudgeInvitationResponse(BaseModel):
    success: bool
    message: str
    data: dict = None

# ============================================================================
# SEND JUDGE INVITATION ENDPOINT
# ============================================================================

@router.post("/invitations/send", dependencies=[Depends(get_api_key)])
async def send_judge_invitation(data: SendJudgeInvitationRequest):
    """
    Send invitation to a judge with email notification
    
    - **email**: Judge's email address
    - **hackathon_id**: Optional hackathon ID
    - **hackathon_name**: Name of the hackathon
    """
    logger.info(f"[SEND_JUDGE_INVITATION] Starting - email={data.email}")
    
    try:
        db = get_db()
        if db is None:
            logger.error("[SEND_JUDGE_INVITATION] Database unavailable")
            raise HTTPException(status_code=503, detail="Database unavailable")
        
        # Check if judge already invited
        existing = db.judge_invitations.find_one({
            "email": data.email,
            "status": "pending"
        })
        
        if existing:
            logger.warning(f"[SEND_JUDGE_INVITATION] Judge already invited: {data.email}")
            raise HTTPException(status_code=400, detail="Judge already invited")
        
        # Generate secure token
        token = secrets.token_urlsafe(32)
        if not token:
            logger.error("[SEND_JUDGE_INVITATION] Failed to generate token")
            raise HTTPException(status_code=500, detail="Failed to generate invitation token")
        
        logger.info(f"[SEND_JUDGE_INVITATION] Generated token: {token[:20]}...")
        
        # Create invitation document
        invitation_id = f"judge_inv_{datetime.utcnow().timestamp()}"
        invitation = {
            "id": invitation_id,
            "email": data.email,
            "hackathon_id": data.hackathon_id,
            "hackathon_name": data.hackathon_name,
            "status": "pending",
            "token": token,
            "created_at": datetime.utcnow(),
            "expires_at": datetime.utcnow() + timedelta(days=7)
        }
        
        # CRITICAL: Store invitation in database FIRST, before sending email
        logger.info("[SEND_JUDGE_INVITATION] Storing invitation in database...")
        try:
            result = db.judge_invitations.insert_one(invitation)
            logger.info(f"[SEND_JUDGE_INVITATION] Invitation stored successfully: {result.inserted_id}")
            
            # Verify it was actually stored
            verify = db.judge_invitations.find_one({"token": token})
            if not verify:
                logger.error("[SEND_JUDGE_INVITATION] CRITICAL: Token stored but not found on verification!")
                raise HTTPException(status_code=500, detail="Database storage verification failed")
            
            logger.info(f"[SEND_JUDGE_INVITATION] Verification successful - token exists in database")
            
        except DuplicateKeyError as e:
            logger.error(f"[SEND_JUDGE_INVITATION] Duplicate invitation: {e}")
            raise HTTPException(status_code=400, detail="Judge already invited")
        except Exception as e:
            logger.error(f"[SEND_JUDGE_INVITATION] Database error: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail="Failed to create invitation")
        
        # Send email notification AFTER database storage is verified
        logger.info("[SEND_JUDGE_INVITATION] Sending email notification...")
        try:
            email_sent = send_judge_invitation_email(
                invitee_email=data.email,
                hackathon_name=data.hackathon_name,
                token=token
            )
            logger.info(f"[SEND_JUDGE_INVITATION] Email sent: {email_sent}")
        except Exception as e:
            logger.warning(f"[SEND_JUDGE_INVITATION] Email failed (non-blocking): {e}")
            # Don't fail the invitation if email fails - token is already in database
        
        logger.info(f"[SEND_JUDGE_INVITATION] Success - invitation sent to {data.email}")
        logger.info(f"[SEND_JUDGE_INVITATION] Token: {token[:20]}...")
        
        return APIResponse(
            success=True,
            message="Judge invitation sent successfully",
            data={
                "email": data.email,
                "token": token,
                "status": "pending",
                "expires_at": invitation["expires_at"].isoformat()
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[SEND_JUDGE_INVITATION] Unexpected error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to send invitation")

# ============================================================================
# GET JUDGE INVITATION DETAILS ENDPOINT
# ============================================================================

@router.get("/invitations/{token}")
async def get_judge_invitation_details(token: str):
    """
    Get judge invitation details by token for frontend display
    
    - **token**: Invitation token from email link
    """
    logger.info(f"[GET_JUDGE_INVITATION] Starting - token={token[:20]}...")
    logger.debug(f"[GET_JUDGE_INVITATION] Token length: {len(token)}")
    
    try:
        db = get_db()
        if db is None:
            logger.error("[GET_JUDGE_INVITATION] Database unavailable")
            raise HTTPException(status_code=503, detail="Database unavailable")
        
        logger.debug("[GET_JUDGE_INVITATION] Querying judge_invitations collection")
        invitation = db.judge_invitations.find_one({
            "token": token,
            "status": "pending"
        })
        
        if not invitation:
            logger.warning(f"[GET_JUDGE_INVITATION] Invitation not found: {token[:20]}...")
            raise HTTPException(status_code=404, detail="Invalid or expired invitation")
        
        # Check if expired
        if invitation.get("expires_at") and invitation["expires_at"] < datetime.utcnow():
            logger.warning(f"[GET_JUDGE_INVITATION] Invitation expired: {invitation.get('expires_at')}")
            raise HTTPException(status_code=400, detail="Invitation has expired")
        
        logger.info(f"[GET_JUDGE_INVITATION] Success - returning invitation details")
        
        return APIResponse(
            success=True,
            message="Invitation details retrieved",
            data={
                "email": invitation.get("email", ""),
                "hackathon_name": invitation.get("hackathon_name", ""),
                "created_at": invitation.get("created_at"),
                "expires_at": invitation.get("expires_at")
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[GET_JUDGE_INVITATION] Unexpected error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to get invitation details")

# ============================================================================
# ACCEPT JUDGE INVITATION ENDPOINT
# ============================================================================

@router.post("/invitations/accept")
async def accept_judge_invitation(data: AcceptJudgeInvitationRequest):
    """
    Accept judge invitation and create judge account
    
    - **token**: Invitation token from email
    - **name**: Judge's full name
    """
    logger.info(f"[ACCEPT_JUDGE_INVITATION] Starting - token={data.token[:20]}...")
    logger.info(f"[ACCEPT_JUDGE_INVITATION] Token length: {len(data.token)}")
    logger.info(f"[ACCEPT_JUDGE_INVITATION] Judge name: {data.name}")
    
    try:
        db = get_db()
        if db is None:
            logger.error("[ACCEPT_JUDGE_INVITATION] Database unavailable")
            raise HTTPException(status_code=503, detail="Database unavailable")
        
        # Find invitation by token
        logger.debug("[ACCEPT_JUDGE_INVITATION] Querying judge_invitations collection")
        logger.debug(f"[ACCEPT_JUDGE_INVITATION] Query: token={data.token[:20]}..., status=pending")
        
        invitation = db.judge_invitations.find_one({
            "token": data.token,
            "status": "pending"
        })
        
        if not invitation:
            logger.warning(f"[ACCEPT_JUDGE_INVITATION] Invitation not found with token={data.token[:20]}...")
            
            # Debug: Check if token exists without status filter
            debug_invite = db.judge_invitations.find_one({"token": data.token})
            if debug_invite:
                logger.warning(f"[ACCEPT_JUDGE_INVITATION] Token EXISTS but status={debug_invite.get('status')}")
            else:
                logger.warning(f"[ACCEPT_JUDGE_INVITATION] Token DOES NOT EXIST in database")
                all_count = db.judge_invitations.count_documents({})
                logger.warning(f"[ACCEPT_JUDGE_INVITATION] Total invitations in DB: {all_count}")
            
            raise HTTPException(status_code=404, detail="Invalid or expired invitation")
        
        logger.info(f"[ACCEPT_JUDGE_INVITATION] Found invitation - email={invitation['email']}")
        
        # Check if invitation has expired
        expires_at = invitation.get("expires_at")
        if expires_at and expires_at < datetime.utcnow():
            logger.warning(f"[ACCEPT_JUDGE_INVITATION] Invitation expired: {expires_at}")
            raise HTTPException(status_code=400, detail="Invitation has expired")
        
        logger.debug("[ACCEPT_JUDGE_INVITATION] Invitation is valid and not expired")
        
        # Update invitation status to accepted
        logger.debug("[ACCEPT_JUDGE_INVITATION] Updating invitation status")
        try:
            update_result = db.judge_invitations.update_one(
                {"token": data.token},
                {
                    "$set": {
                        "status": "accepted",
                        "accepted_at": datetime.utcnow(),
                        "judge_name": data.name
                    }
                }
            )
            
            if update_result.matched_count == 0:
                logger.error("[ACCEPT_JUDGE_INVITATION] Failed to update invitation")
                raise HTTPException(status_code=500, detail="Failed to update invitation")
            
            logger.info(f"[ACCEPT_JUDGE_INVITATION] Invitation status updated")
        except Exception as e:
            logger.error(f"[ACCEPT_JUDGE_INVITATION] Update failed: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail="Failed to update invitation status")
        
        # Create or update judge user with login credentials
        logger.debug("[ACCEPT_JUDGE_INVITATION] Creating/updating judge user")
        email = invitation["email"]
        existing_user = db[COLLECTIONS["users"]].find_one({"email": email})
        user_id = existing_user.get("user_id") if existing_user else f"user_{datetime.utcnow().timestamp()}"
        password_hash = hash_password(data.password)
        now = datetime.utcnow()

        user_doc = {
            "user_id": user_id,
            "email": email,
            "name": data.name,
            "role": "judge",
            "password_hash": password_hash,
            "status": "active",
            "profile_completion": existing_user.get("profile_completion", 0) if existing_user else 0,
            "updated_at": now.isoformat(),
        }
        if existing_user:
            db[COLLECTIONS["users"]].update_one({"email": email}, {"$set": user_doc})
        else:
            user_doc["created_at"] = now.isoformat()
            user_doc["skills"] = []
            db[COLLECTIONS["users"]].insert_one(user_doc)

        judge_doc = {
            "user_id": user_id,
            "email": email,
            "name": data.name,
            "role": "judge",
            "hackathon_id": invitation.get("hackathon_id"),
            "hackathon_name": invitation.get("hackathon_name"),
            "status": "active",
            "updated_at": now,
        }
        existing_judge = db[COLLECTIONS["judges"]].find_one({"email": email})
        if existing_judge:
            db[COLLECTIONS["judges"]].update_one(
                {"email": email},
                {"$set": judge_doc},
            )
        else:
            judge_doc["created_at"] = now
            db[COLLECTIONS["judges"]].insert_one(judge_doc)

        access_token = create_jwt_token(user_id, email)
        refresh_token = generate_token(32)
        db[COLLECTIONS["sessions"]].insert_one({
            "user_id": user_id,
            "refresh_token": refresh_token,
            "created_at": now.isoformat(),
            "expires_at": (now + timedelta(days=7)).isoformat(),
        })

        user_record = db[COLLECTIONS["users"]].find_one({"user_id": user_id})
        logger.info(f"[ACCEPT_JUDGE_INVITATION] Success - judge {email} accepted invitation")

        return APIResponse(
            success=True,
            message="Successfully accepted judge invitation!",
            data={
                "access_token": access_token,
                "refresh_token": refresh_token,
                "token_type": "bearer",
                "user": get_user_response(user_record),
                "judge_id": user_id,
                "email": email,
                "name": data.name,
                "hackathon_name": invitation.get("hackathon_name", ""),
                "status": "active",
            },
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[ACCEPT_JUDGE_INVITATION] Unexpected error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to accept invitation")

# ============================================================================
# GET JUDGE PROFILE ENDPOINT
# ============================================================================

@router.get("/profile/{judge_email}")
async def get_judge_profile(judge_email: str):
    """
    Get judge profile information
    
    - **judge_email**: Judge's email address
    """
    logger.info(f"[GET_JUDGE_PROFILE] Starting - email={judge_email}")
    
    try:
        db = get_db()
        if db is None:
            logger.error("[GET_JUDGE_PROFILE] Database unavailable")
            raise HTTPException(status_code=503, detail="Database unavailable")
        
        judge = db[COLLECTIONS["judges"]].find_one({"email": judge_email})
        
        if not judge:
            logger.warning(f"[GET_JUDGE_PROFILE] Judge not found: {judge_email}")
            raise HTTPException(status_code=404, detail="Judge not found")
        
        logger.info(f"[GET_JUDGE_PROFILE] Success - returning judge profile")
        
        return APIResponse(
            success=True,
            message="Judge profile retrieved",
            data={
                "id": judge.get("id"),
                "email": judge.get("email"),
                "name": judge.get("name"),
                "role": judge.get("role"),
                "hackathon_name": judge.get("hackathon_name"),
                "status": judge.get("status"),
                "created_at": judge.get("created_at")
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[GET_JUDGE_PROFILE] Unexpected error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to get judge profile")

# ============================================================================
# GET ALL JUDGES ENDPOINT (Admin)
# ============================================================================

@router.get("/list", dependencies=[Depends(get_api_key)])
async def get_all_judges():
    """
    Get list of all judges (Admin only)
    """
    logger.info("[GET_ALL_JUDGES] Starting")
    
    try:
        db = get_db()
        if db is None:
            logger.error("[GET_ALL_JUDGES] Database unavailable")
            raise HTTPException(status_code=503, detail="Database unavailable")
        
        judges = list(db[COLLECTIONS["judges"]].find({}))
        
        judges_data = []
        for judge in judges:
            judges_data.append({
                "id": judge.get("user_id") or judge.get("id"),
                "user_id": judge.get("user_id"),
                "email": judge.get("email"),
                "name": judge.get("name"),
                "hackathon_name": judge.get("hackathon_name"),
                "status": judge.get("status"),
                "created_at": judge.get("created_at")
            })
        
        logger.info(f"[GET_ALL_JUDGES] Success - found {len(judges_data)} judges")
        
        return APIResponse(
            success=True,
            message=f"Retrieved {len(judges_data)} judges",
            data=judges_data
        )
        
    except Exception as e:
        logger.error(f"[GET_ALL_JUDGES] Unexpected error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to get judges list")
