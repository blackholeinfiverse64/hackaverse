from fastapi import APIRouter, HTTPException, Depends
from typing import List
import logging
from ..auth import get_api_key, get_current_user_id
from ..database import get_db
from ..db_models import COLLECTIONS
from ..schemas.response import APIResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/submissions", tags=["submissions"], dependencies=[Depends(get_api_key)])

@router.get("")
async def get_all_submissions(user_id: str = Depends(get_current_user_id)):
    """Get all submissions for user's teams"""
    db = get_db()
    submissions = []
    
    if db is not None:
        team_docs = list(db[COLLECTIONS["user_teams"]].find({"user_id": user_id}))
        team_ids = [t.get("team_id") for t in team_docs if t.get("team_id")]
        
        if not team_ids:
            return APIResponse(success=True, message="No database", data=[])
        
        cursor = db[COLLECTIONS["submissions"]].find({"team_id": {"$in": team_ids}})
        submissions = list(cursor)
        for s in submissions:
            s["_id"] = str(s["_id"])
    
    return APIResponse(success=True, message=f"Found {len(submissions)} submission(s)", data=submissions)

@router.get("/{submission_id}")
async def get_submission_by_id(submission_id: str, user_id: str = Depends(get_current_user_id)):
    """Get submission by ID (user must have access)"""
    db = get_db()
    
    if db is not None:
        submission = db[COLLECTIONS["submissions"]].find_one({"submission_id": submission_id})
        if submission:
            team_id = submission.get("team_id")
            allowed = db[COLLECTIONS["user_teams"]].find_one({"user_id": user_id, "team_id": team_id})
            if not allowed:
                raise HTTPException(status_code=403, detail="Access denied")
            return APIResponse(success=True, message="Submission retrieved", data={**submission, "_id": str(submission["_id"])})
    
    raise HTTPException(status_code=404, detail="Submission not found")

@router.get("/team/{team_id}")
async def get_submissions_by_team(team_id: str, user_id: str = Depends(get_current_user_id)):
    """Get submissions by team ID (user must be team member)"""
    db = get_db()
    submissions = []
    
    if db is not None:
        membership = db[COLLECTIONS["user_teams"]].find_one({"user_id": user_id, "team_id": team_id})
        if not membership:
            raise HTTPException(status_code=403, detail="Access denied")
        
        cursor = db[COLLECTIONS["submissions"]].find({"team_id": team_id})
        submissions = list(cursor)
        for s in submissions:
            s["_id"] = str(s["_id"])
    
    return APIResponse(success=True, message=f"Found {len(submissions)} submission(s)", data=submissions)
