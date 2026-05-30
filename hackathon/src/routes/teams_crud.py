from fastapi import APIRouter, HTTPException, Depends
from typing import List
import logging
from ..auth import get_api_key, get_current_user_id
from ..database import get_db
from ..db_models import COLLECTIONS
from ..schemas.response import APIResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/teams", tags=["teams_crud"], dependencies=[Depends(get_api_key)])

@router.get("")
async def get_all_teams(user_id: str = Depends(get_current_user_id)):
    """Get all teams for current user"""
    db = get_db()
    
    if db is None:
        logger.error(f"[TEAMS] Database unavailable for get_all_teams - user: {user_id}")
        raise HTTPException(status_code=503, detail="Database unavailable")
    
    try:
        team_docs = list(db[COLLECTIONS["user_teams"]].find({"user_id": user_id}))
        team_ids = [t.get("team_id") for t in team_docs if t.get("team_id")]
        
        if not team_ids:
            logger.info(f"[TEAMS] No teams found for user: {user_id}")
            return APIResponse(success=True, message="No database", data=[])
        
        cursor = db[COLLECTIONS["teams"]].find({"team_id": {"$in": team_ids}})
        teams = list(cursor)
        for t in teams:
            t["_id"] = str(t["_id"])
        
        logger.info(f"[TEAMS] Retrieved {len(teams)} teams for user: {user_id}")
        return APIResponse(success=True, message=f"Found {len(teams)} team(s)", data=teams)
    except Exception as e:
        logger.error(f"[TEAMS] Error retrieving teams: {str(e)}")
        raise HTTPException(status_code=500, detail="Error retrieving teams")

@router.get("/{team_id}")
async def get_team_by_id(team_id: str, user_id: str = Depends(get_current_user_id)):
    """Get team by ID (user must be team member)"""
    db = get_db()
    
    if db is None:
        logger.error(f"[TEAMS] Database unavailable for get_team_by_id - team: {team_id}")
        raise HTTPException(status_code=503, detail="Database unavailable")
    
    try:
        membership = db[COLLECTIONS["user_teams"]].find_one({"user_id": user_id, "team_id": team_id})
        if not membership:
            logger.warning(f"[TEAMS] Access denied - user {user_id} not member of team {team_id}")
            raise HTTPException(status_code=403, detail="Access denied")
        
        team = db[COLLECTIONS["teams"]].find_one({"team_id": team_id})
        if team:
            logger.info(f"[TEAMS] Retrieved team {team_id} for user {user_id}")
            return APIResponse(success=True, message="Team retrieved", data={**team, "_id": str(team["_id"])})
        
        logger.error(f"[TEAMS] Team not found: {team_id}")
        raise HTTPException(status_code=404, detail="Team not found")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[TEAMS] Error retrieving team: {str(e)}")
        raise HTTPException(status_code=500, detail="Error retrieving team")
