# Team CRUD Operations - Complete Implementation
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from uuid import uuid4
import logging
from ..auth import get_api_key, get_current_user_id
from ..database import get_db
from ..db_models import COLLECTIONS
from ..schemas.response import APIResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/teams", tags=["teams"], dependencies=[Depends(get_api_key)])

# ============================================================================
# REQUEST/RESPONSE MODELS
# ============================================================================

class TeamCreate(BaseModel):
    team_name: str = Field(..., min_length=1, max_length=100)
    project_title: str = Field(..., min_length=1, max_length=200)
    project_description: Optional[str] = Field(None, max_length=1000)
    hackathon_id: Optional[str] = None

class TeamUpdate(BaseModel):
    team_name: Optional[str] = Field(None, min_length=1, max_length=100)
    project_title: Optional[str] = Field(None, min_length=1, max_length=200)
    project_description: Optional[str] = Field(None, max_length=1000)

class TeamInvitationSend(BaseModel):
    team_id: str = Field(..., description="Team ID")
    invitee_email: str = Field(..., description="Email of person to invite")
    hackathon_name: Optional[str] = Field("HackaVerse", description="Hackathon name")

class TeamInvitationAccept(BaseModel):
    token: str = Field(..., description="Invitation token")

class TeamInvitationRespond(BaseModel):
    token: str = Field(..., description="Invitation token")
    action: str = Field(..., pattern="^(accept|decline)$", description="Accept or decline")

# ============================================================================
# LIST TEAMS (GET "" and GET /list)
# ============================================================================

@router.get("")
async def list_teams(user_id: str = Depends(get_current_user_id)):
    """
    List all teams for the current user (GET /teams)
    """
    logger.info(f"[LIST_TEAMS] Starting - user={user_id}")

    try:
        db = get_db()
        if db is None:
            logger.error("[LIST_TEAMS] Database unavailable")
            raise HTTPException(status_code=503, detail="Database unavailable")

        # Find teams the user belongs to
        team_docs = list(db[COLLECTIONS["user_teams"]].find({"user_id": user_id}))
        team_ids = [t.get("team_id") for t in team_docs if t.get("team_id")]

        if not team_ids:
            logger.info(f"[LIST_TEAMS] No teams found for user: {user_id}")
            return APIResponse(success=True, message="No teams found", data=[])

        cursor = db[COLLECTIONS["teams"]].find({"team_id": {"$in": team_ids}})
        teams = list(cursor)
        for t in teams:
            t["_id"] = str(t["_id"])

        logger.info(f"[LIST_TEAMS] Retrieved {len(teams)} teams for user: {user_id}")
        return APIResponse(success=True, message=f"Found {len(teams)} team(s)", data=teams)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[LIST_TEAMS] Error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to list teams")


@router.get("/list")
async def list_teams_alias(user_id: str = Depends(get_current_user_id)):
    """
    List all teams for the current user (GET /teams/list — alias)

    This is an alias for GET /teams, kept for backward compatibility
    with the frontend SyncContext.
    """
    return await list_teams(user_id=user_id)


# ============================================================================
# CREATE TEAM
# ============================================================================

@router.post("")
async def create_team(data: TeamCreate, user_id: str = Depends(get_current_user_id)):
    """
    Create a new team
    
    - **team_name**: Name of the team
    - **project_title**: Title of the project
    - **project_description**: Description of the project
    - **hackathon_id**: Optional hackathon ID
    """
    logger.info(f"[CREATE_TEAM] Starting - user={user_id}, team_name={data.team_name}")
    
    try:
        db = get_db()
        if db is None:
            logger.error("[CREATE_TEAM] Database unavailable")
            raise HTTPException(status_code=503, detail="Database unavailable")
        
        # Generate team ID
        team_id = f"team_{uuid4()}"
        
        # Create team document
        team = {
            "team_id": team_id,
            "team_name": data.team_name,
            "project_title": data.project_title,
            "project_description": data.project_description or "",
            "leader_id": user_id,
            "hackathon_id": data.hackathon_id,
            "members": [user_id],
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        # Insert team
        result = db[COLLECTIONS["teams"]].insert_one(team)
        logger.info(f"[CREATE_TEAM] Team created - id={team_id}")
        
        # Add creator as team member
        team_member = {
            "id": str(uuid4()),
            "team_id": team_id,
            "user_id": user_id,
            "role": "leader",
            "status": "active",
            "joined_at": datetime.utcnow().isoformat()
        }
        
        db[COLLECTIONS["team_members"]].insert_one(team_member)
        logger.info(f"[CREATE_TEAM] Team leader added - user={user_id}")
        
        # Add to user_teams mapping
        db[COLLECTIONS["user_teams"]].insert_one({
            "user_id": user_id,
            "team_id": team_id,
            "role": "leader",
            "joined_at": datetime.utcnow().isoformat()
        })
        
        logger.info(f"[CREATE_TEAM] Success - team_id={team_id}")
        
        return APIResponse(success=True, message="Team created successfully", data={
                "team_id": team_id,
                "team_name": data.team_name,
                "project_title": data.project_title,
                "leader_id": user_id,
                "created_at": team["created_at"]
            })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[CREATE_TEAM] Error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to create team")

# ============================================================================
# UPDATE TEAM
# ============================================================================

@router.patch("/{team_id}")
async def update_team(team_id: str, data: TeamUpdate, user_id: str = Depends(get_current_user_id)):
    """
    Update team details (team leader only)
    
    - **team_id**: Team ID
    - **team_name**: New team name
    - **project_title**: New project title
    - **project_description**: New project description
    """
    logger.info(f"[UPDATE_TEAM] Starting - team_id={team_id}, user={user_id}")
    
    try:
        db = get_db()
        if db is None:
            raise HTTPException(status_code=503, detail="Database unavailable")
        
        # Get team
        team = db[COLLECTIONS["teams"]].find_one({"team_id": team_id})
        if not team:
            logger.error(f"[UPDATE_TEAM] Team not found - team_id={team_id}")
            raise HTTPException(status_code=404, detail="Team not found")
        
        # Check authorization
        if team.get("leader_id") != user_id:
            logger.warning(f"[UPDATE_TEAM] Unauthorized - user={user_id} is not team leader")
            raise HTTPException(status_code=403, detail="Only team leader can update team")
        
        # Build update data
        update_data = {"updated_at": datetime.utcnow().isoformat()}
        
        if data.team_name:
            update_data["team_name"] = data.team_name
        if data.project_title:
            update_data["project_title"] = data.project_title
        if data.project_description is not None:
            update_data["project_description"] = data.project_description
        
        # Update team
        result = db[COLLECTIONS["teams"]].update_one(
            {"team_id": team_id},
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            logger.warning(f"[UPDATE_TEAM] No changes made")
            raise HTTPException(status_code=400, detail="No changes were made")
        
        logger.info(f"[UPDATE_TEAM] Success - team_id={team_id}")
        
        # Fetch updated team
        updated_team = db[COLLECTIONS["teams"]].find_one({"team_id": team_id})
        
        return APIResponse(success=True, message="Team updated successfully", data={
                "team_id": updated_team.get("team_id"),
                "team_name": updated_team.get("team_name"),
                "project_title": updated_team.get("project_title"),
                "project_description": updated_team.get("project_description"),
                "updated_at": updated_team.get("updated_at")
            })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[UPDATE_TEAM] Error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to update team")

# ============================================================================
# DELETE TEAM
# ============================================================================

@router.delete("/{team_id}")
async def delete_team(team_id: str, user_id: str = Depends(get_current_user_id)):
    """
    Delete a team (team leader only)
    
    - **team_id**: Team ID to delete
    """
    logger.info(f"[DELETE_TEAM] Starting - team_id={team_id}, user={user_id}")
    
    try:
        db = get_db()
        if db is None:
            raise HTTPException(status_code=503, detail="Database unavailable")
        
        # Get team
        team = db[COLLECTIONS["teams"]].find_one({"team_id": team_id})
        if not team:
            logger.error(f"[DELETE_TEAM] Team not found - team_id={team_id}")
            raise HTTPException(status_code=404, detail="Team not found")
        
        # Check authorization
        if team.get("leader_id") != user_id:
            logger.warning(f"[DELETE_TEAM] Unauthorized - user={user_id} is not team leader")
            raise HTTPException(status_code=403, detail="Only team leader can delete team")
        
        # Delete team
        db[COLLECTIONS["teams"]].delete_one({"team_id": team_id})
        
        # Delete team members
        db[COLLECTIONS["team_members"]].delete_many({"team_id": team_id})
        
        # Delete user_teams mappings
        db[COLLECTIONS["user_teams"]].delete_many({"team_id": team_id})
        
        # Delete team invitations
        db[COLLECTIONS["invitations"]].delete_many({"team_id": team_id})
        
        logger.info(f"[DELETE_TEAM] Success - team_id={team_id}")
        
        return APIResponse(success=True, message="Team deleted successfully", data={"team_id": team_id})
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[DELETE_TEAM] Error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to delete team")

# ============================================================================
# JOIN TEAM
# ============================================================================

@router.post("/{team_id}/join")
async def join_team(team_id: str, user_id: str = Depends(get_current_user_id)):
    """
    Join a team (user must be invited)
    
    - **team_id**: Team ID to join
    """
    logger.info(f"[JOIN_TEAM] Starting - team_id={team_id}, user={user_id}")
    
    try:
        db = get_db()
        if db is None:
            raise HTTPException(status_code=503, detail="Database unavailable")
        
        # Check if team exists
        team = db[COLLECTIONS["teams"]].find_one({"team_id": team_id})
        if not team:
            logger.error(f"[JOIN_TEAM] Team not found - team_id={team_id}")
            raise HTTPException(status_code=404, detail="Team not found")
        
        # Check if already a member
        existing = db[COLLECTIONS["user_teams"]].find_one({
            "user_id": user_id,
            "team_id": team_id
        })
        
        if existing:
            logger.warning(f"[JOIN_TEAM] User already member - user={user_id}, team={team_id}")
            raise HTTPException(status_code=400, detail="Already a team member")
        
        # Add to user_teams
        db[COLLECTIONS["user_teams"]].insert_one({
            "user_id": user_id,
            "team_id": team_id,
            "role": "member",
            "joined_at": datetime.utcnow().isoformat()
        })
        
        # Add to team_members
        db[COLLECTIONS["team_members"]].insert_one({
            "id": str(uuid4()),
            "team_id": team_id,
            "user_id": user_id,
            "role": "member",
            "status": "active",
            "joined_at": datetime.utcnow().isoformat()
        })
        
        # Update team members list
        db[COLLECTIONS["teams"]].update_one(
            {"team_id": team_id},
            {"$push": {"members": user_id}}
        )
        
        logger.info(f"[JOIN_TEAM] Success - user={user_id} joined team={team_id}")
        
        return APIResponse(success=True, message="Successfully joined team", data={
                "team_id": team_id,
                "team_name": team.get("team_name"),
                "user_id": user_id
            })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[JOIN_TEAM] Error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to join team")

# ============================================================================
# LEAVE TEAM
# ============================================================================

@router.post("/{team_id}/leave")
async def leave_team(team_id: str, user_id: str = Depends(get_current_user_id)):
    """
    Leave a team
    
    - **team_id**: Team ID to leave
    """
    logger.info(f"[LEAVE_TEAM] Starting - team_id={team_id}, user={user_id}")
    
    try:
        db = get_db()
        if db is None:
            raise HTTPException(status_code=503, detail="Database unavailable")
        
        # Check if team exists
        team = db[COLLECTIONS["teams"]].find_one({"team_id": team_id})
        if not team:
            logger.error(f"[LEAVE_TEAM] Team not found - team_id={team_id}")
            raise HTTPException(status_code=404, detail="Team not found")
        
        # Check if user is team leader
        if team.get("leader_id") == user_id:
            logger.warning(f"[LEAVE_TEAM] Team leader cannot leave - user={user_id}")
            raise HTTPException(status_code=400, detail="Team leader cannot leave team")
        
        # Remove from user_teams
        db[COLLECTIONS["user_teams"]].delete_one({
            "user_id": user_id,
            "team_id": team_id
        })
        
        # Remove from team_members
        db[COLLECTIONS["team_members"]].delete_one({
            "team_id": team_id,
            "user_id": user_id
        })
        
        # Update team members list
        db[COLLECTIONS["teams"]].update_one(
            {"team_id": team_id},
            {"$pull": {"members": user_id}}
        )
        
        logger.info(f"[LEAVE_TEAM] Success - user={user_id} left team={team_id}")
        
        return APIResponse(success=True, message="Successfully left team", data={"team_id": team_id})
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[LEAVE_TEAM] Error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to leave team")

# ============================================================================
# SEND TEAM INVITATION
# ============================================================================

@router.post("/invitations/send")
async def send_team_invitation(data: TeamInvitationSend, user_id: str = Depends(get_current_user_id)):
    """
    Send team invitation to a user
    
    - **team_id**: Team ID
    - **invitee_email**: Email of person to invite
    - **hackathon_name**: Name of hackathon
    """
    logger.info(f"[SEND_INVITATION] Starting - team_id={data.team_id}, invitee={data.invitee_email}")
    
    try:
        db = get_db()
        if db is None:
            raise HTTPException(status_code=503, detail="Database unavailable")
        
        # Get team
        team = db[COLLECTIONS["teams"]].find_one({"team_id": data.team_id})
        if not team:
            logger.error(f"[SEND_INVITATION] Team not found - team_id={data.team_id}")
            raise HTTPException(status_code=404, detail="Team not found")
        
        # Check authorization
        if team.get("leader_id") != user_id:
            logger.warning(f"[SEND_INVITATION] Unauthorized - user={user_id} is not team leader")
            raise HTTPException(status_code=403, detail="Only team leader can send invitations")
        
        # Check if already invited
        existing = db[COLLECTIONS["invitations"]].find_one({
            "team_id": data.team_id,
            "invitee_email": data.invitee_email,
            "status": "pending"
        })
        
        if existing:
            logger.warning(f"[SEND_INVITATION] Already invited - email={data.invitee_email}")
            raise HTTPException(status_code=400, detail="User already invited")
        
        # Generate invitation token
        import secrets
        token = secrets.token_urlsafe(32)
        
        # Create invitation
        invitation = {
            "id": str(uuid4()),
            "team_id": data.team_id,
            "team_name": team.get("team_name"),
            "invitee_email": data.invitee_email,
            "inviter_id": user_id,
            "hackathon_name": data.hackathon_name,
            "token": token,
            "status": "pending",
            "created_at": datetime.utcnow().isoformat(),
            "expires_at": (datetime.utcnow() + __import__('datetime').timedelta(days=7)).isoformat()
        }
        
        db[COLLECTIONS["invitations"]].insert_one(invitation)
        logger.info(f"[SEND_INVITATION] Success - token={token[:20]}...")
        
        return APIResponse(success=True, message="Invitation sent successfully", data={
                "team_id": data.team_id,
                "invitee_email": data.invitee_email,
                "token": token,
                "status": "pending"
            })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[SEND_INVITATION] Error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to send invitation")

# ============================================================================
# ACCEPT TEAM INVITATION
# ============================================================================

@router.post("/invitations/accept")
async def accept_team_invitation(data: TeamInvitationAccept):
    """
    Accept team invitation
    
    - **token**: Invitation token
    """
    logger.info(f"[ACCEPT_INVITATION] Starting - token={data.token[:20]}...")
    
    try:
        db = get_db()
        if db is None:
            raise HTTPException(status_code=503, detail="Database unavailable")
        
        # Find invitation
        invitation = db[COLLECTIONS["invitations"]].find_one({
            "token": data.token,
            "status": "pending"
        })
        
        if not invitation:
            logger.error(f"[ACCEPT_INVITATION] Invitation not found")
            raise HTTPException(status_code=404, detail="Invalid or expired invitation")
        
        # Check if expired
        from datetime import datetime as dt
        expires_at = dt.fromisoformat(invitation.get("expires_at", ""))
        if dt.utcnow() > expires_at:
            logger.warning(f"[ACCEPT_INVITATION] Invitation expired")
            raise HTTPException(status_code=400, detail="Invitation has expired")
        
        # Update invitation status
        db[COLLECTIONS["invitations"]].update_one(
            {"token": data.token},
            {"$set": {"status": "accepted", "accepted_at": datetime.utcnow().isoformat()}}
        )
        
        logger.info(f"[ACCEPT_INVITATION] Success - team_id={invitation['team_id']}")
        
        return APIResponse(success=True, message="Invitation accepted successfully", data={
                "team_id": invitation["team_id"],
                "team_name": invitation.get("team_name"),
                "invitee_email": invitation.get("invitee_email")
            })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[ACCEPT_INVITATION] Error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to accept invitation")

# ============================================================================
# GET INVITATION DETAILS
# ============================================================================

@router.get("/invitations/{token}")
async def get_invitation_details(token: str):
    """
    Get team invitation details
    
    - **token**: Invitation token
    """
    logger.info(f"[GET_INVITATION] Starting - token={token[:20]}...")
    
    try:
        db = get_db()
        if db is None:
            raise HTTPException(status_code=503, detail="Database unavailable")
        
        # Find invitation
        invitation = db[COLLECTIONS["invitations"]].find_one({
            "token": token,
            "status": "pending"
        })
        
        if not invitation:
            logger.error(f"[GET_INVITATION] Invitation not found")
            raise HTTPException(status_code=404, detail="Invalid or expired invitation")
        
        logger.info(f"[GET_INVITATION] Success")
        
        return APIResponse(success=True, message="Invitation details retrieved", data={
                "team_id": invitation.get("team_id"),
                "team_name": invitation.get("team_name"),
                "invitee_email": invitation.get("invitee_email"),
                "hackathon_name": invitation.get("hackathon_name"),
                "created_at": invitation.get("created_at"),
                "expires_at": invitation.get("expires_at")
            })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[GET_INVITATION] Error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to get invitation details")

# ============================================================================
# GET RECEIVED INVITATIONS
# ============================================================================

@router.get("/invitations/received")
async def get_received_invitations(user_id: str = Depends(get_current_user_id)):
    """
    Get invitations received by current user
    """
    logger.info(f"[GET_RECEIVED] Starting - user={user_id}")
    
    try:
        db = get_db()
        if db is None:
            raise HTTPException(status_code=503, detail="Database unavailable")
        
        # Get user email
        user = db[COLLECTIONS["users"]].find_one({"user_id": user_id})
        if not user:
            logger.error(f"[GET_RECEIVED] User not found - user_id={user_id}")
            raise HTTPException(status_code=404, detail="User not found")
        
        user_email = user.get("email")
        
        # Find invitations
        invitations = list(db[COLLECTIONS["invitations"]].find({
            "invitee_email": user_email,
            "status": "pending"
        }).sort("created_at", -1))
        
        logger.info(f"[GET_RECEIVED] Found {len(invitations)} invitations")
        
        return APIResponse(success=True, message=f"{len(invitations)} received invitations", data=[
                {
                    "id": inv.get("id"),
                    "team_id": inv.get("team_id"),
                    "team_name": inv.get("team_name"),
                    "token": inv.get("token"),
                    "created_at": inv.get("created_at"),
                    "expires_at": inv.get("expires_at")
                }
                for inv in invitations
            ])
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[GET_RECEIVED] Error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to get invitations")

# ============================================================================
# GET SENT INVITATIONS
# ============================================================================

@router.get("/invitations/sent")
async def get_sent_invitations(user_id: str = Depends(get_current_user_id)):
    """
    Get invitations sent by current user
    """
    logger.info(f"[GET_SENT] Starting - user={user_id}")
    
    try:
        db = get_db()
        if db is None:
            raise HTTPException(status_code=503, detail="Database unavailable")
        
        # Find invitations sent by user
        invitations = list(db[COLLECTIONS["invitations"]].find({
            "inviter_id": user_id
        }).sort("created_at", -1))
        
        logger.info(f"[GET_SENT] Found {len(invitations)} invitations")
        
        return APIResponse(success=True, message=f"{len(invitations)} sent invitations", data=[
                {
                    "id": inv.get("id"),
                    "team_id": inv.get("team_id"),
                    "team_name": inv.get("team_name"),
                    "invitee_email": inv.get("invitee_email"),
                    "status": inv.get("status"),
                    "created_at": inv.get("created_at")
                }
                for inv in invitations
            ])
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[GET_SENT] Error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to get invitations")

# ============================================================================
# RESPOND TO INVITATION
# ============================================================================

@router.post("/invitations/respond")
async def respond_to_invitation(data: TeamInvitationRespond, user_id: str = Depends(get_current_user_id)):
    """
    Respond to team invitation (accept or decline)
    
    - **token**: Invitation token
    - **action**: "accept" or "decline"
    """
    logger.info(f"[RESPOND_INVITATION] Starting - action={data.action}")
    
    try:
        db = get_db()
        if db is None:
            raise HTTPException(status_code=503, detail="Database unavailable")
        
        # Find invitation
        invitation = db[COLLECTIONS["invitations"]].find_one({
            "token": data.token,
            "status": "pending"
        })
        
        if not invitation:
            logger.error(f"[RESPOND_INVITATION] Invitation not found")
            raise HTTPException(status_code=404, detail="Invalid or expired invitation")
        
        if data.action == "accept":
            # Update invitation
            db[COLLECTIONS["invitations"]].update_one(
                {"token": data.token},
                {"$set": {"status": "accepted", "accepted_at": datetime.utcnow().isoformat()}}
            )
            
            logger.info(f"[RESPOND_INVITATION] Invitation accepted")
            
            return APIResponse(success=True, message="Invitation accepted", data={"team_id": invitation["team_id"]})
        
        elif data.action == "decline":
            # Update invitation
            db[COLLECTIONS["invitations"]].update_one(
                {"token": data.token},
                {"$set": {"status": "declined", "declined_at": datetime.utcnow().isoformat()}}
            )
            
            logger.info(f"[RESPOND_INVITATION] Invitation declined")
            
            return APIResponse(success=True, message="Invitation declined", data={"team_id": invitation["team_id"]})
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[RESPOND_INVITATION] Error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to respond to invitation")
