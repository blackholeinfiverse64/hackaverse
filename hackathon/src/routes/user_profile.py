# User Profile Endpoints - Complete Implementation
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
import logging
from ..auth import get_api_key, get_current_user_id
from ..database import get_db
from ..db_models import COLLECTIONS
from ..schemas.response import APIResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/user", tags=["user"], dependencies=[Depends(get_api_key)])

# ============================================================================
# REQUEST/RESPONSE MODELS
# ============================================================================

class UserProfileUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    bio: Optional[str] = Field(None, max_length=500)
    skills: Optional[List[str]] = None
    avatar_url: Optional[str] = None
    location: Optional[str] = Field(None, max_length=100)
    social_links: Optional[dict] = None

# ============================================================================
# GET USER PROFILE
# ============================================================================

@router.get("/profile")
async def get_user_profile(user_id: str = Depends(get_current_user_id)):
    """
    Get current user's profile
    """
    logger.info(f"[GET_PROFILE] Starting - user={user_id}")
    
    try:
        db = get_db()
        if db is None:
            logger.error("[GET_PROFILE] Database unavailable")
            raise HTTPException(status_code=503, detail="Database unavailable")
        
        # Get user
        user = db[COLLECTIONS["users"]].find_one({"user_id": user_id})
        if not user:
            logger.error(f"[GET_PROFILE] User not found - user_id={user_id}")
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get user's teams
        user_teams = list(db[COLLECTIONS["user_teams"]].find({"user_id": user_id}))
        team_ids = [t.get("team_id") for t in user_teams]
        
        logger.info(f"[GET_PROFILE] Success - user={user_id}")
        
        return APIResponse(success=True, message="Profile retrieved", data={
                "user_id": user.get("user_id"),
                "email": user.get("email"),
                "name": user.get("name"),
                "role": user.get("role", "participant"),
                "bio": user.get("bio", ""),
                "skills": user.get("skills", []),
                "avatar_url": user.get("avatar_url"),
                "location": user.get("location", ""),
                "social_links": user.get("social_links", {}),
                "profile_completion": user.get("profile_completion", 0),
                "team_ids": team_ids,
                "created_at": user.get("created_at"),
                "updated_at": user.get("updated_at")
            })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[GET_PROFILE] Error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to get profile")

# ============================================================================
# UPDATE USER PROFILE
# ============================================================================

@router.patch("/profile")
async def update_user_profile(data: UserProfileUpdate, user_id: str = Depends(get_current_user_id)):
    """
    Update current user's profile
    
    - **name**: Full name
    - **bio**: Short biography
    - **skills**: List of skills
    - **avatar_url**: Avatar image URL
    - **location**: User location
    - **social_links**: Social media links
    """
    logger.info(f"[UPDATE_PROFILE] Starting - user={user_id}")
    
    try:
        db = get_db()
        if db is None:
            raise HTTPException(status_code=503, detail="Database unavailable")
        
        # Get user
        user = db[COLLECTIONS["users"]].find_one({"user_id": user_id})
        if not user:
            logger.error(f"[UPDATE_PROFILE] User not found - user_id={user_id}")
            raise HTTPException(status_code=404, detail="User not found")
        
        # Build update data
        update_data = {"updated_at": datetime.utcnow().isoformat()}
        
        if data.name:
            update_data["name"] = data.name
        if data.bio is not None:
            update_data["bio"] = data.bio
        if data.skills is not None:
            update_data["skills"] = data.skills
        if data.avatar_url:
            update_data["avatar_url"] = data.avatar_url
        if data.location:
            update_data["location"] = data.location
        if data.social_links is not None:
            update_data["social_links"] = data.social_links
        
        # Calculate profile completion
        profile_fields = ["name", "bio", "skills", "avatar_url", "location"]
        completed_fields = sum(1 for field in profile_fields if update_data.get(field))
        profile_completion = int((completed_fields / len(profile_fields)) * 100)
        update_data["profile_completion"] = profile_completion
        
        # Update user
        result = db[COLLECTIONS["users"]].update_one(
            {"user_id": user_id},
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            logger.warning(f"[UPDATE_PROFILE] No changes made")
            raise HTTPException(status_code=400, detail="No changes were made")
        
        logger.info(f"[UPDATE_PROFILE] Success - user={user_id}")
        
        # Fetch updated user
        updated_user = db[COLLECTIONS["users"]].find_one({"user_id": user_id})
        
        return APIResponse(success=True, message="Profile updated successfully", data={
                "user_id": updated_user.get("user_id"),
                "name": updated_user.get("name"),
                "bio": updated_user.get("bio"),
                "skills": updated_user.get("skills"),
                "avatar_url": updated_user.get("avatar_url"),
                "location": updated_user.get("location"),
                "profile_completion": updated_user.get("profile_completion"),
                "updated_at": updated_user.get("updated_at")
            })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[UPDATE_PROFILE] Error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to update profile")

# ============================================================================
# GET USER STATS
# ============================================================================

@router.get("/stats")
async def get_user_stats(user_id: str = Depends(get_current_user_id)):
    """
    Get user statistics (teams, submissions, scores)
    """
    logger.info(f"[GET_STATS] Starting - user={user_id}")
    
    try:
        db = get_db()
        if db is None:
            logger.error("[GET_STATS] Database unavailable")
            raise HTTPException(status_code=503, detail="Database unavailable")
        
        # Get user
        user = db[COLLECTIONS["users"]].find_one({"user_id": user_id})
        if not user:
            logger.error(f"[GET_STATS] User not found - user_id={user_id}")
            raise HTTPException(status_code=404, detail="User not found")
        
        # Count teams
        teams_count = db[COLLECTIONS["user_teams"]].count_documents({"user_id": user_id})
        
        # Get team IDs
        user_teams = list(db[COLLECTIONS["user_teams"]].find({"user_id": user_id}))
        team_ids = [t.get("team_id") for t in user_teams]
        
        # Count submissions
        submissions_count = 0
        if team_ids:
            submissions_count = db[COLLECTIONS["submissions"]].count_documents({
                "team_id": {"$in": team_ids}
            })
        
        # Get average score
        average_score = 0
        if team_ids:
            judgments = list(db[COLLECTIONS["judgments"]].find({
                "team_id": {"$in": team_ids}
            }))
            if judgments:
                total_score = sum(j.get("total_score", 0) for j in judgments)
                average_score = round(total_score / len(judgments), 2)
        
        # Count hackathons participated
        hackathons_count = 0
        if team_ids:
            teams = list(db[COLLECTIONS["teams"]].find({"team_id": {"$in": team_ids}}))
            hackathons_count = len(set(t.get("hackathon_id") for t in teams if t.get("hackathon_id")))
        
        logger.info(f"[GET_STATS] Success - user={user_id}")
        
        return APIResponse(success=True, message="User stats retrieved", data={
                "user_id": user_id,
                "teams_count": teams_count,
                "submissions_count": submissions_count,
                "average_score": average_score,
                "hackathons_participated": hackathons_count,
                "profile_completion": user.get("profile_completion", 0),
                "role": user.get("role", "participant")
            })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[GET_STATS] Error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to get user stats")
