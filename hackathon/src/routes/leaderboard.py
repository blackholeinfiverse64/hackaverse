from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime
import logging
from ..auth import get_api_key, get_current_user_id
from ..database import get_db
from ..db_models import COLLECTIONS
from ..schemas.response import APIResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/hackathons", tags=["leaderboard"], dependencies=[Depends(get_api_key)])

@router.get("/{hackathon_id}/leaderboard")
async def get_leaderboard(hackathon_id: str, user_id: str = Depends(get_current_user_id)):
    """Get leaderboard for a hackathon (authenticated)"""
    try:
        db = get_db()
        if db is None:
            raise HTTPException(status_code=503, detail="Database unavailable")
        
        projects = list(
            db[COLLECTIONS["submissions"]].find({"hackathon_id": hackathon_id})
        )
        
        leaderboard = []
        
        for idx, project in enumerate(projects):
            project_id = project.get("submission_id", "")
            
            scores = list(
                db[COLLECTIONS.get("project_scores", "project_scores")]
                .find({"project_id": project_id})
            )
            
            if scores:
                avg_score = sum(s.get("total_score", 0) for s in scores) / len(scores)
            else:
                avg_score = 0
            
            leaderboard.append({
                "rank": idx + 1,
                "team_id": project.get("team_id", ""),
                "project_title": project.get("project_title", ""),
                "score": round(avg_score, 2),
                "submission_id": project_id,
                "judge_count": len(scores)
            })
        
        leaderboard.sort(key=lambda x: x["score"], reverse=True)
        
        for idx, item in enumerate(leaderboard):
            item["rank"] = idx + 1
        
        logger.info(f"Leaderboard generated for hackathon {hackathon_id} by user {user_id}")
        
        return APIResponse(success=True, message=f"Leaderboard with {len(leaderboard)} entries", data=leaderboard)
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating leaderboard: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate leaderboard")

@router.get("/{hackathon_id}/leaderboard/public")
async def get_public_leaderboard(hackathon_id: str):
    """Get public leaderboard (no auth required)"""
    try:
        db = get_db()
        if db is None:
            return APIResponse(success=True, message="No data", data=[])
        
        projects = list(
            db[COLLECTIONS["submissions"]].find({"hackathon_id": hackathon_id})
        )
        
        leaderboard = []
        
        for idx, project in enumerate(projects):
            project_id = project.get("submission_id", "")
            scores = list(
                db[COLLECTIONS.get("project_scores", "project_scores")]
                .find({"project_id": project_id})
            )
            
            if scores:
                avg_score = sum(s.get("total_score", 0) for s in scores) / len(scores)
            else:
                avg_score = 0
            
            leaderboard.append({
                "rank": idx + 1,
                "team_id": project.get("team_id", ""),
                "project_title": project.get("project_title", ""),
                "score": round(avg_score, 2)
            })
        
        leaderboard.sort(key=lambda x: x["score"], reverse=True)
        
        for idx, item in enumerate(leaderboard):
            item["rank"] = idx + 1
        
        return APIResponse(success=True, message=f"Leaderboard with {len(leaderboard)} entries", data=leaderboard)
    
    except Exception as e:
        logger.error(f"Error fetching public leaderboard: {str(e)}")
        return APIResponse(success=True, message="No data", data=[])
