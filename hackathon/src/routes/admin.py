# src/routes/admin.py
from fastapi import APIRouter, Depends, HTTPException
from ..models import RewardRequest, RewardResponse, LogRequest, TeamRegistration
from ..bucket_connector import relay_to_bucket
from ..reward import RewardSystem
from ..replay_protection import check_replay
from datetime import datetime
from ..logger import ksml_logger
from ..auth import get_api_key
from ..schemas.response import APIResponse
from ..utils.email_validator import validate_email_or_raise
from ..utils.rate_limiter import invitation_limiter
from ..utils.activity_logger import log_activity
import secrets
import logging

router = APIRouter(prefix="/admin", tags=["admin"])
logger = logging.getLogger(__name__)

@router.get("/dashboard", summary="Get admin dashboard data", dependencies=[Depends(get_api_key)])
async def get_dashboard():
    """
    Get dashboard data for admin panel including KPIs and recent activities.
    Fetches real-time data from MongoDB collections.
    """
    logger.info("[AdminDashboard] Fetching dashboard data from MongoDB")
    
    try:
        from ..database import get_db
        db = get_db()
        
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
    except Exception as e:
        logger.error(f"[AdminDashboard] Critical error fetching dashboard data: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch dashboard data: {str(e)}")

# DEPRECATED: Judge invitation endpoint moved to /judge/invitations/send
# The old endpoint stored tokens incorrectly with status="invited" instead of "pending"
# and didn't include expires_at field. Use the correct endpoint in judge_invitations.py

@router.post("/reward", response_model=RewardResponse, summary="Apply reward to a request", dependencies=[Depends(get_api_key)])
async def reward_endpoint(request: RewardRequest):
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
        # Apply reward logic
        reward_system = RewardSystem()
        reward_value, feedback = reward_system.calculate_reward(f"Request {request.request_id}", request.outcome, tenant_id=request.tenant_id, event_id=request.event_id)

        # Log the reward calculation using KSML
        ksml_logger.log_reward_calculation(request.request_id, request.outcome, reward_value, tenant_id=request.tenant_id, event_id=request.event_id)

        return RewardResponse(reward_value=reward_value, feedback=feedback)
    except Exception as e:
        logger.error(f"Error calculating reward: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")




