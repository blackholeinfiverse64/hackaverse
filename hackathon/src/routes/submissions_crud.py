# Submission CRUD Operations - Complete Implementation
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from uuid import uuid4
import logging
from ..auth import get_api_key, get_current_user_id
from ..database import get_db
from ..db_models import COLLECTIONS
from ..schemas.response import APIResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/submissions", tags=["submissions"], dependencies=[Depends(get_api_key)])

# ============================================================================
# REQUEST/RESPONSE MODELS
# ============================================================================

class SubmissionCreate(BaseModel):
    team_id: str = Field(..., description="Team ID")
    project_title: str = Field(..., min_length=1, max_length=200)
    submission_text: str = Field(..., min_length=1, description="Project submission content")
    hackathon_id: Optional[str] = None
    description: Optional[str] = Field(None, max_length=1000)

class SubmissionUpdate(BaseModel):
    project_title: Optional[str] = Field(None, min_length=1, max_length=200)
    submission_text: Optional[str] = Field(None, min_length=1)
    description: Optional[str] = Field(None, max_length=1000)

# ============================================================================
# CREATE SUBMISSION
# ============================================================================

@router.post("")
async def create_submission(data: SubmissionCreate, user_id: str = Depends(get_current_user_id)):
    """
    Create a new submission
    
    - **team_id**: Team ID
    - **project_title**: Title of the project
    - **submission_text**: Project submission content
    - **hackathon_id**: Optional hackathon ID
    - **description**: Optional project description
    """
    logger.info(f"[CREATE_SUBMISSION] Starting - team_id={data.team_id}, user={user_id}")
    
    try:
        db = get_db()
        if db is None:
            logger.error("[CREATE_SUBMISSION] Database unavailable")
            raise HTTPException(status_code=503, detail="Database unavailable")
        
        # Verify user is team member
        team_member = db[COLLECTIONS["user_teams"]].find_one({
            "user_id": user_id,
            "team_id": data.team_id
        })
        
        if not team_member:
            logger.warning(f"[CREATE_SUBMISSION] User not team member - user={user_id}, team={data.team_id}")
            raise HTTPException(status_code=403, detail="You are not a member of this team")
        
        # Verify team exists
        team = db[COLLECTIONS["teams"]].find_one({"team_id": data.team_id})
        if not team:
            logger.error(f"[CREATE_SUBMISSION] Team not found - team_id={data.team_id}")
            raise HTTPException(status_code=404, detail="Team not found")
        
        # Generate submission ID
        submission_id = f"submission_{uuid4()}"
        
        # Create submission document
        submission = {
            "submission_id": submission_id,
            "team_id": data.team_id,
            "project_title": data.project_title,
            "submission_text": data.submission_text,
            "description": data.description or "",
            "hackathon_id": data.hackathon_id,
            "submitted_by": user_id,
            "status": "submitted",
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        # Insert submission
        result = db[COLLECTIONS["submissions"]].insert_one(submission)
        logger.info(f"[CREATE_SUBMISSION] Submission created - id={submission_id}")

        # ── TANTRA: Emit submission.created event ──
        try:
            from .webhooks import dispatch_event
            await dispatch_event("submission.created", {
                "submission_id": submission_id,
                "team_id": data.team_id,
                "project_title": data.project_title,
                "submitted_by": user_id,
            })
        except Exception:
            pass  # Non-blocking

        return APIResponse(
            success=True,
            message="Submission created successfully",
            data={
                "submission_id": submission_id,
                "team_id": data.team_id,
                "project_title": data.project_title,
                "status": "submitted",
                "created_at": submission["created_at"]
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[CREATE_SUBMISSION] Error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to create submission")

# ============================================================================
# UPDATE SUBMISSION
# ============================================================================

@router.patch("/{submission_id}")
async def update_submission(submission_id: str, data: SubmissionUpdate, user_id: str = Depends(get_current_user_id)):
    """
    Update a submission (team member only)
    
    - **submission_id**: Submission ID
    - **project_title**: New project title
    - **submission_text**: New submission content
    - **description**: New description
    """
    logger.info(f"[UPDATE_SUBMISSION] Starting - submission_id={submission_id}, user={user_id}")
    
    try:
        db = get_db()
        if db is None:
            raise HTTPException(status_code=503, detail="Database unavailable")
        
        # Get submission
        submission = db[COLLECTIONS["submissions"]].find_one({"submission_id": submission_id})
        if not submission:
            logger.error(f"[UPDATE_SUBMISSION] Submission not found - submission_id={submission_id}")
            raise HTTPException(status_code=404, detail="Submission not found")
        
        # Verify user is team member
        team_member = db[COLLECTIONS["user_teams"]].find_one({
            "user_id": user_id,
            "team_id": submission.get("team_id")
        })
        
        if not team_member:
            logger.warning(f"[UPDATE_SUBMISSION] User not team member - user={user_id}")
            raise HTTPException(status_code=403, detail="You are not a member of this team")
        
        # Build update data
        update_data = {"updated_at": datetime.utcnow().isoformat()}
        
        if data.project_title:
            update_data["project_title"] = data.project_title
        if data.submission_text:
            update_data["submission_text"] = data.submission_text
        if data.description is not None:
            update_data["description"] = data.description
        
        # Update submission
        result = db[COLLECTIONS["submissions"]].update_one(
            {"submission_id": submission_id},
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            logger.warning(f"[UPDATE_SUBMISSION] No changes made")
            raise HTTPException(status_code=400, detail="No changes were made")
        
        logger.info(f"[UPDATE_SUBMISSION] Success - submission_id={submission_id}")
        
        # Fetch updated submission
        updated_submission = db[COLLECTIONS["submissions"]].find_one({"submission_id": submission_id})
        
        return APIResponse(success=True, message="Submission updated successfully", data={
                "submission_id": updated_submission.get("submission_id"),
                "project_title": updated_submission.get("project_title"),
                "status": updated_submission.get("status"),
                "updated_at": updated_submission.get("updated_at")
            })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[UPDATE_SUBMISSION] Error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to update submission")
