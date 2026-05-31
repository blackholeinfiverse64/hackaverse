# src/routes/admin.py
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from uuid import uuid4
from ..models import RewardResponse
from ..reward import RewardSystem
from ..replay_protection import check_replay
from datetime import datetime
from ..logger import ksml_logger
from ..auth import get_api_key, get_current_user_id
from ..database import get_db
from ..db_models import COLLECTIONS
from ..schemas.response import APIResponse
from ..utils.email_validator import validate_email_or_raise
import logging

router = APIRouter(prefix="/admin", tags=["admin"])
registration_router = APIRouter(tags=["registration"])
logger = logging.getLogger(__name__)

def _require_admin(db, user_id: str) -> None:
    """Require that the caller is an authenticated admin user."""
    if db is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
    user = db[COLLECTIONS["users"]].find_one({"user_id": user_id})
    if not user or user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")


class AdminRewardRequest(BaseModel):
    request_id: str
    outcome: str
    tenant_id: str = "default"
    event_id: str = "default_event"


class InviteParticipantRequest(BaseModel):
    email: EmailStr
    hackathonId: str = Field(..., min_length=1)


class AdminTeamRegistrationRequest(BaseModel):
    team_name: str = Field(..., min_length=1)
    project_title: str = Field(..., min_length=1)
    members: List[str] = Field(default_factory=list)
    hackathon_id: Optional[str] = None
    tenant_id: str = "default"
    event_id: str = "default_event"

@router.get("/dashboard", summary="Get admin dashboard data", dependencies=[Depends(get_api_key)])
async def get_dashboard(user_id: str = Depends(get_current_user_id)):
    """
    Get dashboard data for admin panel including KPIs and recent activities.
    Fetches real-time data from MongoDB collections.
    """
    logger.info("[AdminDashboard] Fetching dashboard data from MongoDB")
    
    try:
        from ..database import get_db
        db = get_db()
        _require_admin(db, user_id)
        
        # Initialize default values
        total_participants = 0
        active_projects = 0
        submissions_count = 0
        active_teams = 0
        recent_activities = []
        
        if db is not None:
            try:
                # Count teams
                active_teams = db.teams.count_documents({})
                logger.info(f"[AdminDashboard] Teams count: {active_teams}")
                
                # Count submissions (projects are deprecated)
                submissions_count = db.submissions.count_documents({})
                active_projects = submissions_count
                logger.info(f"[AdminDashboard] Submissions count: {submissions_count}")
                
                # Count all users (not filtered by role - all users are participants)
                total_participants = db.users.count_documents({})
                logger.info(f"[AdminDashboard] Total participants (all users): {total_participants}")
                
                # Get recent activities
                if hasattr(db, 'activities'):
                    activities_cursor = db.activities.find({}).sort("timestamp", -1).limit(10)
                    recent_activities = [
                        {
                            "id": str(activity.get("_id", "")),
                            "title": activity.get("title", ""),
                            "description": activity.get("description", ""),
                            "actor_name": activity.get("actor_name", "System"),
                            "activity_type": activity.get("activity_type", ""),
                            "timestamp": activity.get("timestamp", datetime.now().isoformat()),
                            "created_at": activity.get("created_at", datetime.now().isoformat())
                        }
                        for activity in activities_cursor
                    ]
                    logger.info(f"[AdminDashboard] Recent activities count: {len(recent_activities)}")
                
                logger.info("[AdminDashboard] Successfully fetched all dashboard data")
                
            except Exception as e:
                logger.error(f"[AdminDashboard] Error fetching from database: {str(e)}", exc_info=True)
                raise
        
        return APIResponse(
            success=True,
            message="Dashboard data retrieved successfully",
            data={
                "totalParticipants": total_participants,
                "activeProjects": active_projects,
                "submissions": submissions_count,
                "activeTeams": active_teams,
                "deltas": {
                    "participants": "+0",
                    "projects": "+0",
                    "submissions": "+0",
                    "teams": "+0"
                },
                "recentActivities": recent_activities
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[AdminDashboard] Critical error fetching dashboard data: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch dashboard data: {str(e)}")

# DEPRECATED: Judge invitation endpoint moved to /judge/invitations/send
# The old endpoint stored tokens incorrectly with status="invited" instead of "pending"
# and didn't include expires_at field. Use the correct endpoint in judge_invitations.py

@router.get("/participants", summary="List all users for admin", dependencies=[Depends(get_api_key)])
async def list_participants(user_id: str = Depends(get_current_user_id)):
    """Return all registered users with role metadata."""
    db = get_db()
    _require_admin(db, user_id)

    users = list(db[COLLECTIONS["users"]].find({}))
    participants = []
    for u in users:
        participants.append({
            "id": u.get("user_id") or str(u.get("_id", "")),
            "user_id": u.get("user_id"),
            "name": u.get("name", "Unknown"),
            "email": u.get("email", ""),
            "role": u.get("role", "participant"),
            "created_at": u.get("created_at"),
        })

    return APIResponse(
        success=True,
        message=f"Retrieved {len(participants)} users",
        data=participants,
    )


@router.get("/submissions", summary="List all submissions for admin", dependencies=[Depends(get_api_key)])
async def list_all_submissions(user_id: str = Depends(get_current_user_id)):
    """Return every submission (admin view, not scoped to caller teams)."""
    db = get_db()
    _require_admin(db, user_id)

    raw = list(db[COLLECTIONS["submissions"]].find({}).sort("submitted_at", -1).limit(500))
    submissions = []
    for item in raw:
        item["_id"] = str(item["_id"])
        item["submission_id"] = item.get("submission_id") or str(item["_id"])
        submissions.append(item)

    return APIResponse(
        success=True,
        message=f"Retrieved {len(submissions)} submissions",
        data=submissions,
    )


@router.get("/teams", summary="List all teams for admin", dependencies=[Depends(get_api_key)])
async def list_all_teams(user_id: str = Depends(get_current_user_id)):
    """Return every team document."""
    db = get_db()
    _require_admin(db, user_id)

    teams = list(db[COLLECTIONS["teams"]].find({}))
    for t in teams:
        t["_id"] = str(t["_id"])

    return APIResponse(success=True, message=f"Retrieved {len(teams)} teams", data=teams)


@router.post("/invite-participant", summary="Invite a participant to a hackathon", dependencies=[Depends(get_api_key)])
async def invite_participant(
    body: InviteParticipantRequest,
    user_id: str = Depends(get_current_user_id),
):
    """Notify an existing user or record a pending hackathon invitation by email."""
    validate_email_or_raise(body.email)
    db = get_db()
    _require_admin(db, user_id)

    hackathon = db[COLLECTIONS["hackathons"]].find_one({"id": body.hackathonId})
    if not hackathon:
        hackathon = db[COLLECTIONS["hackathons"]].find_one({"hackathon_id": body.hackathonId})

    hackathon_name = (
        (hackathon or {}).get("name")
        or (hackathon or {}).get("title")
        or "HackaVerse"
    )

    target = db[COLLECTIONS["users"]].find_one({"email": body.email.lower()})
    notification = {
        "notification_id": f"notif_{uuid4()}",
        "user_id": target.get("user_id") if target else None,
        "email": body.email.lower(),
        "title": f"Invitation to {hackathon_name}",
        "message": f"You have been invited to join {hackathon_name}.",
        "type": "hackathon_invitation",
        "read": False,
        "created_at": datetime.utcnow().isoformat(),
        "related_id": body.hackathonId,
        "hackathon_id": body.hackathonId,
        "invited_by": user_id,
    }
    db[COLLECTIONS["notifications"]].insert_one(notification)

    if target:
        existing = db[COLLECTIONS["hackathon_participants"]].find_one({
            "user_id": target["user_id"],
            "hackathon_id": body.hackathonId,
        })
        if not existing:
            db[COLLECTIONS["hackathon_participants"]].insert_one({
                "user_id": target["user_id"],
                "hackathon_id": body.hackathonId,
                "status": "invited",
                "joined_at": datetime.utcnow().isoformat(),
                "team_id": None,
            })

    return APIResponse(
        success=True,
        message="Invitation sent",
        data={"email": body.email, "hackathon_id": body.hackathonId},
    )


@router.post("/register-team", summary="Admin registers a team", dependencies=[Depends(get_api_key)])
async def admin_register_team(
    body: AdminTeamRegistrationRequest,
    user_id: str = Depends(get_current_user_id),
):
    """Create a team on behalf of participants (admin registration flow)."""
    db = get_db()
    _require_admin(db, user_id)

    team_id = f"team_{uuid4()}"
    member_ids = [user_id]
    for email in body.members:
        email = email.strip().lower()
        if not email:
            continue
        u = db[COLLECTIONS["users"]].find_one({"email": email})
        if u and u.get("user_id") not in member_ids:
            member_ids.append(u["user_id"])

    team = {
        "team_id": team_id,
        "team_name": body.team_name,
        "project_title": body.project_title,
        "project_description": "",
        "leader_id": user_id,
        "hackathon_id": body.hackathon_id,
        "members": member_ids,
        "tenant_id": body.tenant_id,
        "event_id": body.event_id,
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
    }
    db[COLLECTIONS["teams"]].insert_one(team)

    for mid in member_ids:
        db[COLLECTIONS["user_teams"]].insert_one({
            "user_id": mid,
            "team_id": team_id,
            "role": "leader" if mid == user_id else "member",
            "joined_at": datetime.utcnow().isoformat(),
        })
        db[COLLECTIONS["team_members"]].insert_one({
            "id": str(uuid4()),
            "team_id": team_id,
            "user_id": mid,
            "role": "leader" if mid == user_id else "member",
            "status": "active",
            "joined_at": datetime.utcnow().isoformat(),
        })

    return APIResponse(
        success=True,
        message="Team registered successfully",
        data={"team_id": team_id, "team_name": body.team_name},
    )


@registration_router.post("/registration", summary="Alias for admin team registration", dependencies=[Depends(get_api_key)])
async def registration_alias(
    body: AdminTeamRegistrationRequest,
    user_id: str = Depends(get_current_user_id),
):
    """Backward-compatible path used by the frontend TeamRegistration form."""
    return await admin_register_team(body=body, user_id=user_id)


@router.post("/reward", response_model=RewardResponse, summary="Apply reward to a request", dependencies=[Depends(get_api_key)])
async def reward_endpoint(request: AdminRewardRequest, user_id: str = Depends(get_current_user_id)):
    """
    Calculate and apply rewards based on request outcome.
    
    - **request_id**: ID of the request to apply reward to (used for replay protection)
    - **outcome**: Outcome of the request (success, failure, etc.)
    """
    # Check for replay (scoped by tenant_id + event_id)
    is_new, error_message = check_replay(
        request_id=request.request_id,
        tenant_id=request.tenant_id or "default",
        event_id=request.event_id or "default_event"
    )
    
    if not is_new:
        logger.warning(f"Replay detected for reward request_id '{request.request_id}' (tenant: {request.tenant_id}, event: {request.event_id})")
        raise HTTPException(
            status_code=409,
            detail={
                "success": False,
                "message": error_message,
                "data": {"request_id": request.request_id}
            }
        )
    
    try:
        db = get_db()
        _require_admin(db, user_id)
        # Apply reward logic
        reward_system = RewardSystem()
        reward_value, feedback = reward_system.calculate_reward(f"Request {request.request_id}", request.outcome, tenant_id=request.tenant_id, event_id=request.event_id)

        # Log the reward calculation using KSML
        ksml_logger.log_reward_calculation(request.request_id, request.outcome, reward_value, tenant_id=request.tenant_id, event_id=request.event_id)

        return RewardResponse(
            success=True,
            message=feedback,
            data={"reward_value": reward_value, "feedback": feedback, "request_id": request.request_id},
        )
    except Exception as e:
        logger.error(f"Error calculating reward: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")




