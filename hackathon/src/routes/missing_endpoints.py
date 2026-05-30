# Additional Missing Endpoints - Complete Implementation
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
import logging
from ..auth import get_api_key
from ..database import get_db
from ..db_models import COLLECTIONS
from ..schemas.response import APIResponse

logger = logging.getLogger(__name__)

# ============================================================================
# REWARD ENDPOINTS
# ============================================================================

reward_router = APIRouter(prefix="/reward", tags=["reward"])

@reward_router.get("")
async def get_rewards(api_key: str = Depends(get_api_key)):
    """
    Get all rewards (admin endpoint)
    """
    logger.info("[GET_REWARDS] Starting")
    
    try:
        db = get_db()
        if db is None:
            logger.error("[GET_REWARDS] Database unavailable")
            raise HTTPException(status_code=503, detail="Database unavailable")
        
        # Get rewards from database
        rewards = list(db[COLLECTIONS.get("rewards", "rewards")].find({}))
        
        # Convert ObjectIds to strings
        for reward in rewards:
            reward["_id"] = str(reward.get("_id", ""))
        
        logger.info(f"[GET_REWARDS] Success - found {len(rewards)} rewards")
        
        return APIResponse(success=True, message=f"{len(rewards)} rewards", data=rewards)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[GET_REWARDS] Error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to get rewards")

# ============================================================================
# LEADERBOARD ENDPOINTS
# ============================================================================

leaderboard_router = APIRouter(prefix="/leaderboard", tags=["leaderboard"])

@leaderboard_router.get("/{hackathon_id}")
async def get_leaderboard(hackathon_id: str, limit: int = 50, api_key: str = Depends(get_api_key)):
    """
    Get leaderboard for a hackathon (public endpoint)
    
    - **hackathon_id**: Hackathon ID
    - **limit**: Maximum number of results (default: 50)
    """
    logger.info(f"[GET_LEADERBOARD] Starting - hackathon_id={hackathon_id}")
    
    try:
        db = get_db()
        if db is None:
            logger.error("[GET_LEADERBOARD] Database unavailable")
            raise HTTPException(status_code=503, detail="Database unavailable")
        
        # Limit max results
        limit = min(limit, 100)
        
        # Get judgments for this hackathon
        judgments = list(db[COLLECTIONS["judgments"]].find({
            "hackathon_id": hackathon_id
        }).sort("total_score", -1).limit(limit))
        
        # Build leaderboard
        leaderboard = []
        for rank, judgment in enumerate(judgments, start=1):
            leaderboard.append({
                "rank": rank,
                "team_id": judgment.get("team_id", "unknown"),
                "total_score": judgment.get("total_score", 0),
                "clarity": judgment.get("clarity", 0),
                "quality": judgment.get("quality", 0),
                "innovation": judgment.get("innovation", 0),
                "confidence": judgment.get("confidence", 0.5)
            })
        
        logger.info(f"[GET_LEADERBOARD] Success - {len(leaderboard)} teams")
        
        return APIResponse(success=True, message=f"{len(leaderboard)} teams", data=leaderboard)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[GET_LEADERBOARD] Error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to get leaderboard")

# ============================================================================
# JUDGING SCORES ENDPOINTS
# ============================================================================

judging_router = APIRouter(prefix="/judging", tags=["judging"])

@judging_router.get("/scores/{project_id}")
async def get_judging_scores(project_id: str):
    """
    Get judging scores for a project
    
    - **project_id**: Project/Submission ID
    """
    logger.info(f"[GET_SCORES] Starting - project_id={project_id}")
    
    try:
        db = get_db()
        if db is None:
            logger.error("[GET_SCORES] Database unavailable")
            raise HTTPException(status_code=503, detail="Database unavailable")
        
        # Get judgments for this project
        judgments = list(db[COLLECTIONS["judgments"]].find({
            "submission_hash": project_id
        }).sort("timestamp", -1))
        
        if not judgments:
            logger.warning(f"[GET_SCORES] No judgments found - project_id={project_id}")
            return APIResponse(success=True, message="No judgments found", data=[])
        
        # Build scores response
        scores = []
        for judgment in judgments:
            scores.append({
                "version": judgment.get("version", 1),
                "total_score": judgment.get("total_score", 0),
                "clarity": judgment.get("clarity", 0),
                "quality": judgment.get("quality", 0),
                "innovation": judgment.get("innovation", 0),
                "confidence": judgment.get("confidence", 0.5),
                "timestamp": judgment.get("timestamp")
            })
        
        logger.info(f"[GET_SCORES] Success - {len(scores)} scores")
        
        return APIResponse(success=True, message=f"{len(scores)} scores", data=scores)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[GET_SCORES] Error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to get scores")

# ============================================================================
# HACKATHON ENDPOINTS — REMOVED
# ============================================================================
# Hackathon CRUD is now fully handled by routes/hackathons.py
# (GET/POST/PATCH/DELETE on /api/hackathons).
# The duplicate hackathon_router that was here caused route conflicts
# and has been intentionally removed.

