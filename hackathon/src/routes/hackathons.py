from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
import logging
from ..auth import get_api_key, get_current_user_id
from ..database import get_db
from ..db_models import COLLECTIONS
from ..schemas.response import APIResponse

logger = logging.getLogger(__name__)

public_router = APIRouter(prefix="/hackathons", tags=["hackathons"])
router = APIRouter(prefix="/hackathons", tags=["hackathons"], dependencies=[Depends(get_api_key)])

class HackathonCreate(BaseModel):
    name: str = Field(..., min_length=1)
    description: str = Field(..., min_length=1)
    start_date: str
    end_date: str
    min_team_size: int = Field(ge=1)
    max_team_size: int = Field(ge=1)
    status: Optional[str] = "active"
    track: Optional[str] = "Open Innovation"

class HackathonUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    min_team_size: Optional[int] = Field(None, ge=1)
    max_team_size: Optional[int] = Field(None, ge=1)
    status: Optional[str] = Field(None, pattern="^(active|inactive|draft|completed)$")

class HackathonJoinRequest(BaseModel):
    hackathon_id: str = Field(..., description="Hackathon ID to join")

# Public endpoints FIRST (no auth)
@public_router.get("/active")
async def get_active_hackathons(page: int = 1, limit: int = 20):
    """Get all active hackathons (Public - no auth required)
    
    - **page**: Page number (default: 1)
    - **limit**: Items per page (default: 20, max: 100)
    """
    db = get_db()
    
    if db is None:
        logger.error("[HACKATHONS] Database unavailable for get_active_hackathons")
        raise HTTPException(status_code=503, detail="Database unavailable")
    
    try:
        limit = min(max(limit, 1), 100)
        page = max(page, 1)
        skip = (page - 1) * limit

        query = {"status": "active"}
        total = db[COLLECTIONS["hackathons"]].count_documents(query)
        cursor = db[COLLECTIONS["hackathons"]].find(query).skip(skip).limit(limit)
        hackathons = list(cursor)
        for h in hackathons:
            h["_id"] = str(h["_id"])
        
        logger.info(f"[HACKATHONS] Retrieved {len(hackathons)} active hackathons (page {page})")
        return APIResponse(success=True, message=f"{len(hackathons)} active hackathons", data={
            "items": hackathons,
            "pagination": {
                "page": page, "limit": limit, "total": total,
                "total_pages": max(1, -(-total // limit)),
                "has_next": page * limit < total, "has_prev": page > 1,
            }
        })
    except Exception as e:
        logger.error(f"[HACKATHONS] Error retrieving active hackathons: {str(e)}")
        raise HTTPException(status_code=500, detail="Error retrieving hackathons")

@public_router.post("/join")
async def join_hackathon(data: HackathonJoinRequest, user_id: str = Depends(get_current_user_id)):
    """Join a hackathon (authenticated users only)
    
    - **hackathon_id**: ID of the hackathon to join
    
    This endpoint marks the user as interested in the hackathon.
    To fully participate, the user must also create or join a team.
    """
    logger.info(f"[JOIN_HACKATHON] Starting - hackathon_id={data.hackathon_id}, user_id={user_id}")
    
    try:
        db = get_db()
        if db is None:
            logger.error("[JOIN_HACKATHON] Database unavailable")
            raise HTTPException(status_code=503, detail="Database unavailable")
        
        # Check if hackathon exists
        hackathon = db[COLLECTIONS["hackathons"]].find_one({"hackathon_id": data.hackathon_id})
        if not hackathon:
            hackathon = db[COLLECTIONS["hackathons"]].find_one({"id": data.hackathon_id})
        
        if not hackathon:
            logger.error(f"[JOIN_HACKATHON] Hackathon not found - id={data.hackathon_id}")
            raise HTTPException(status_code=404, detail="Hackathon not found")
        
        # Get user
        user = db[COLLECTIONS["users"]].find_one({"user_id": user_id})
        if not user:
            logger.error(f"[JOIN_HACKATHON] User not found - user_id={user_id}")
            raise HTTPException(status_code=404, detail="User not found")
        
        # Check if user already joined this hackathon
        existing = db[COLLECTIONS["hackathon_participants"]].find_one({
            "hackathon_id": data.hackathon_id,
            "user_id": user_id
        })
        
        if existing:
            logger.info(f"[JOIN_HACKATHON] User already joined - user_id={user_id}, hackathon_id={data.hackathon_id}")
            return APIResponse(
                success=True, 
                message="You have already joined this hackathon",
                data={
                    "hackathon_id": data.hackathon_id,
                    "user_id": user_id,
                    "joined_at": existing.get("joined_at")
                }
            )
        
        # Record user joining the hackathon
        participant_record = {
            "hackathon_id": data.hackathon_id,
            "user_id": user_id,
            "email": user.get("email"),
            "name": user.get("name"),
            "joined_at": datetime.utcnow().isoformat(),
            "team_id": None,  # Will be set when user creates/joins a team
            "status": "interested"  # interested, in_team, submitted
        }
        
        db[COLLECTIONS["hackathon_participants"]].insert_one(participant_record)
        
        # Update hackathon participant count
        db[COLLECTIONS["hackathons"]].update_one(
            {"hackathon_id": data.hackathon_id},
            {"$inc": {"participant_count": 1}}
        )
        
        logger.info(f"[JOIN_HACKATHON] Success - user {user_id} joined hackathon {data.hackathon_id}")
        
        return APIResponse(
            success=True,
            message="Successfully joined hackathon! Now create or join a team to participate.",
            data={
                "hackathon_id": data.hackathon_id,
                "user_id": user_id,
                "name": user.get("name"),
                "email": user.get("email"),
                "joined_at": participant_record["joined_at"],
                "next_step": "Create or join a team to participate"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[JOIN_HACKATHON] Error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to join hackathon")

@router.get("")
async def get_all_hackathons(page: int = 1, limit: int = 50):
    """Get all hackathons (authenticated — admin/management view)

    - **page**: Page number (default: 1)
    - **limit**: Items per page (default: 50, max: 100)
    """
    db = get_db()

    if db is None:
        logger.error("[HACKATHONS] Database unavailable for get_all_hackathons")
        raise HTTPException(status_code=503, detail="Database unavailable")

    try:
        limit = min(max(limit, 1), 100)
        page = max(page, 1)
        skip = (page - 1) * limit

        total = db[COLLECTIONS["hackathons"]].count_documents({})
        cursor = db[COLLECTIONS["hackathons"]].find({}).skip(skip).limit(limit)
        hackathons = list(cursor)
        for h in hackathons:
            h["_id"] = str(h["_id"])

        logger.info(f"[HACKATHONS] Retrieved {len(hackathons)} hackathons (page {page})")
        return APIResponse(success=True, message=f"{len(hackathons)} hackathons", data=hackathons)
    except Exception as e:
        logger.error(f"[HACKATHONS] Error retrieving hackathons: {str(e)}")
        raise HTTPException(status_code=500, detail="Error retrieving hackathons")


@router.post("")
async def create_hackathon(data: HackathonCreate):
    """
    Create a new hackathon (admin only)
    
    - **name**: Hackathon name
    - **description**: Description
    - **start_date**: Start date
    - **end_date**: End date
    - **min_team_size**: Minimum team size
    - **max_team_size**: Maximum team size
    """
    logger.info(f"[CREATE_HACKATHON] Starting - name={data.name}")
    
    try:
        db = get_db()
        if db is None:
            logger.error("[CREATE_HACKATHON] Database unavailable")
            raise HTTPException(status_code=503, detail="Database unavailable")
        
        from uuid import uuid4
        hackathon_id = f"hackathon_{uuid4()}"
        
        hackathon = {
            "id": hackathon_id,
            "hackathon_id": hackathon_id,
            "name": data.name,
            "description": data.description,
            "start_date": data.start_date,
            "end_date": data.end_date,
            "min_team_size": data.min_team_size,
            "max_team_size": data.max_team_size,
            "status": data.status or "active",
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        result = db[COLLECTIONS["hackathons"]].insert_one(hackathon)
        
        logger.info(f"[CREATE_HACKATHON] Success - id={hackathon_id}")
        
        return APIResponse(success=True, message="Hackathon created successfully", data={
                "hackathon_id": hackathon_id,
                "name": data.name,
                "status": data.status or "active",
                "created_at": hackathon["created_at"]
            })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[CREATE_HACKATHON] Error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to create hackathon")

@router.patch("/{hackathon_id}")
async def update_hackathon(hackathon_id: str, data: HackathonUpdate):
    """
    Update hackathon details (admin only)
    
    - **hackathon_id**: Hackathon ID
    - **name**: New name
    - **description**: New description
    - **status**: New status
    """
    logger.info(f"[UPDATE_HACKATHON] Starting - hackathon_id={hackathon_id}")
    
    try:
        db = get_db()
        if db is None:
            logger.error("[UPDATE_HACKATHON] Database unavailable")
            raise HTTPException(status_code=503, detail="Database unavailable")
        
        # Get hackathon
        hackathon = db[COLLECTIONS["hackathons"]].find_one({"hackathon_id": hackathon_id})
        if not hackathon:
            logger.error(f"[UPDATE_HACKATHON] Hackathon not found - id={hackathon_id}")
            raise HTTPException(status_code=404, detail="Hackathon not found")
        
        # Build update data
        update_data = {"updated_at": datetime.utcnow().isoformat()}
        
        if data.name:
            update_data["name"] = data.name
        if data.description:
            update_data["description"] = data.description
        if data.start_date:
            update_data["start_date"] = data.start_date
        if data.end_date:
            update_data["end_date"] = data.end_date
        if data.status:
            update_data["status"] = data.status
        
        # Update hackathon
        result = db[COLLECTIONS["hackathons"]].update_one(
            {"hackathon_id": hackathon_id},
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            logger.warning(f"[UPDATE_HACKATHON] No changes made")
            raise HTTPException(status_code=400, detail="No changes were made")
        
        logger.info(f"[UPDATE_HACKATHON] Success - id={hackathon_id}")
        
        return APIResponse(success=True, message="Hackathon updated successfully", data={"hackathon_id": hackathon_id})
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[UPDATE_HACKATHON] Error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to update hackathon")

@router.delete("/{hackathon_id}")
async def delete_hackathon(hackathon_id: str):
    """
    Delete hackathon (admin only)
    
    - **hackathon_id**: Hackathon ID to delete
    """
    logger.info(f"[DELETE_HACKATHON] Starting - hackathon_id={hackathon_id}")
    
    try:
        db = get_db()
        if db is None:
            logger.error("[DELETE_HACKATHON] Database unavailable")
            raise HTTPException(status_code=503, detail="Database unavailable")
        
        # Check if hackathon exists
        hackathon = db[COLLECTIONS["hackathons"]].find_one({"hackathon_id": hackathon_id})
        if not hackathon:
            logger.error(f"[DELETE_HACKATHON] Hackathon not found - id={hackathon_id}")
            raise HTTPException(status_code=404, detail="Hackathon not found")
        
        # Delete hackathon
        result = db[COLLECTIONS["hackathons"]].delete_one({"hackathon_id": hackathon_id})
        
        if result.deleted_count == 0:
            logger.error(f"[DELETE_HACKATHON] Failed to delete hackathon - id={hackathon_id}")
            raise HTTPException(status_code=500, detail="Failed to delete hackathon")
        
        logger.info(f"[DELETE_HACKATHON] Success - id={hackathon_id}")
        
        return APIResponse(success=True, message="Hackathon deleted successfully", data={"hackathon_id": hackathon_id})
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[DELETE_HACKATHON] Error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to delete hackathon")


