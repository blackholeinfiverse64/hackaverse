# Team Members Management Routes
# - Accept invitation with member details (name, bio)
# - Update member information
# - Update team details (for team leader)

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime, timedelta
from uuid import uuid4
import secrets
import logging
from pymongo.errors import DuplicateKeyError
from ..auth import get_api_key
from ..database import get_db
from ..db_models import COLLECTIONS
from ..schemas.response import APIResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/teams", tags=["team-members"])

# ============================================================================
# REQUEST/RESPONSE MODELS
# ============================================================================

class AcceptInvitationWithNameRequest(BaseModel):
    """Accept invitation and provide member details"""
    token: str = Field(..., description="Invitation token")
    member_name: str = Field(..., min_length=2, max_length=100, description="Full name of the member")
    member_bio: Optional[str] = Field(None, max_length=500, description="Short bio")

class UpdateTeamMemberRequest(BaseModel):
    """Update team member information"""
    team_id: str = Field(..., description="Team ID")
    user_email: str = Field(..., description="Member email")
    member_name: str = Field(..., min_length=2, max_length=100)
    member_bio: Optional[str] = Field(None, max_length=500)
    role: Optional[str] = Field("member", pattern="^(leader|member|co-leader)$")

class UpdateTeamDetailsRequest(BaseModel):
    """Update team details - only team leader can do this"""
    team_id: str = Field(..., description="Team ID")
    team_name: Optional[str] = Field(None, min_length=1, max_length=100)
    project_title: Optional[str] = Field(None, min_length=1, max_length=200)
    project_description: Optional[str] = Field(None, max_length=1000)
    leader_id: str = Field(..., description="Current user ID (must be team leader)")

class TeamDetailsResponse(BaseModel):
    """Team details response"""
    team_id: str
    team_name: str
    project_title: str
    project_description: Optional[str]
    leader_id: str
    members: list
    created_at: str
    updated_at: Optional[str]

# ============================================================================
# ACCEPT INVITATION WITH MEMBER DETAILS
# ============================================================================

@router.post("/invitations/accept-with-details", tags=["invitations"])
async def accept_invitation_with_member_details(data: AcceptInvitationWithNameRequest):
    """
    Accept team invitation and collect member details (name, bio)
    
    This endpoint:
    1. Validates the invitation token
    2. Checks if invitation is expired
    3. Updates invitation status to 'accepted'
    4. Adds member with name and bio to team_members collection
    5. Returns success response
    
    Request body:
    - token: Invitation token from email
    - member_name: Full name of the person joining
    - member_bio: Optional short bio
    """
    logger.info(f"[ACCEPT_WITH_DETAILS] Starting - token={data.token[:20]}..., name={data.member_name}")
    
    try:
        db = get_db()
        if db is None:
            logger.error("[ACCEPT_WITH_DETAILS] Database unavailable")
            raise HTTPException(status_code=503, detail="Database unavailable")
        
        # Step 1: Find invitation by token
        logger.debug(f"[ACCEPT_WITH_DETAILS] Looking for invitation token")
        invitation = db[COLLECTIONS["invitations"]].find_one({
            "token": data.token,
            "status": "pending"
        })
        
        if not invitation:
            logger.warning(f"[ACCEPT_WITH_DETAILS] Invitation not found for token: {data.token[:20]}...")
            raise HTTPException(status_code=404, detail="Invalid or expired invitation")
        
        logger.info(f"[ACCEPT_WITH_DETAILS] Found invitation - team_id={invitation['team_id']}")
        
        # Step 2: Check if invitation has expired
        expires_at = invitation.get("expires_at")
        if isinstance(expires_at, str):
            try:
                expires_at = datetime.fromisoformat(expires_at)
            except Exception:
                logger.warning(f"[ACCEPT_WITH_DETAILS] expires_at field not parseable as datetime: {expires_at}")
                expires_at = None

        if expires_at and expires_at < datetime.utcnow():
            logger.warning(f"[ACCEPT_WITH_DETAILS] Invitation expired: {expires_at}")
            raise HTTPException(status_code=400, detail="Invitation has expired")
        
        logger.debug("[ACCEPT_WITH_DETAILS] Invitation is valid and not expired")
        
        # Step 3: Update invitation status
        logger.debug("[ACCEPT_WITH_DETAILS] Updating invitation status to 'accepted'")
        db[COLLECTIONS["invitations"]].update_one(
            {"token": data.token},
            {
                "$set": {
                    "status": "accepted",
                    "accepted_at": datetime.utcnow(),
                    "member_name": data.member_name  # Store the member name with invitation
                }
            }
        )
        
        logger.info("[ACCEPT_WITH_DETAILS] Invitation status updated")
        
        # Step 4: Add member to team_members with all details
        logger.debug("[ACCEPT_WITH_DETAILS] Creating team member record with name")
        team_member = {
            "id": str(uuid4()),
            "team_id": invitation["team_id"],
            "user_email": invitation["invitee_email"],
            "member_name": data.member_name,  # ✅ STORING MEMBER NAME HERE
            "member_bio": data.member_bio or "",
            "role": "member",
            "status": "active",
            "joined_at": datetime.utcnow()
        }
        
        # Check if already a member
        existing_member = db[COLLECTIONS["team_members"]].find_one({
            "team_id": invitation["team_id"],
            "user_email": invitation["invitee_email"]
        })
        
        if not existing_member:
            try:
                insert_result = db[COLLECTIONS["team_members"]].insert_one(team_member)
                logger.info(f"[ACCEPT_WITH_DETAILS] Team member added - id={insert_result.inserted_id}, name={data.member_name}")
            except DuplicateKeyError:
                logger.warning(f"[ACCEPT_WITH_DETAILS] Team member already exists, updating...")
                # Update existing member with name info
                db[COLLECTIONS["team_members"]].update_one(
                    {
                        "team_id": invitation["team_id"],
                        "user_email": invitation["invitee_email"]
                    },
                    {
                        "$set": {
                            "member_name": data.member_name,
                            "member_bio": data.member_bio or "",
                            "updated_at": datetime.utcnow()
                        }
                    }
                )
            except Exception as e:
                logger.error(f"[ACCEPT_WITH_DETAILS] Failed to add team member: {e}", exc_info=True)
                raise HTTPException(status_code=500, detail="Failed to add team member")
        else:
            logger.info("[ACCEPT_WITH_DETAILS] User already a team member, updating with name...")
            # Update existing member with name info
            db[COLLECTIONS["team_members"]].update_one(
                {
                    "team_id": invitation["team_id"],
                    "user_email": invitation["invitee_email"]
                },
                {
                    "$set": {
                        "member_name": data.member_name,
                        "member_bio": data.member_bio or "",
                        "updated_at": datetime.utcnow()
                    }
                }
            )
        
        # Step 5: Return success response
        logger.info(f"[ACCEPT_WITH_DETAILS] Success - {data.member_name} ({invitation['invitee_email']}) joined team {invitation['team_id']}")
        
        return APIResponse(success=True, message=f"Welcome {data.member_name}! You have successfully joined the team!", data={
            "team_id": invitation["team_id"],
            "team_name": invitation.get("team_name", ""),
            "hackathon_name": invitation.get("hackathon_name", ""),
            "member_name": data.member_name
        })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[ACCEPT_WITH_DETAILS] Unexpected error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to accept invitation: {str(e)}")

# ============================================================================
# UPDATE TEAM MEMBER DETAILS
# ============================================================================

@router.put("/members/update", dependencies=[Depends(get_api_key)])
async def update_team_member(data: UpdateTeamMemberRequest):
    """
    Update team member information
    
    Can be called by:
    - Team leader
    - The member themselves
    
    Updates:
    - member_name
    - member_bio
    - role
    """
    logger.info(f"[UPDATE_MEMBER] Updating member {data.user_email} in team {data.team_id}")
    
    try:
        db = get_db()
        if db is None:
            raise HTTPException(status_code=503, detail="Database unavailable")
        
        # Verify team exists
        team = db[COLLECTIONS["teams"]].find_one({"team_id": data.team_id})
        if not team:
            logger.error(f"[UPDATE_MEMBER] Team not found: {data.team_id}")
            raise HTTPException(status_code=404, detail="Team not found")
        
        # Verify team leader authorization
        if team.get("leader_id") != data.leader_id:
            logger.warning(f"[UPDATE_MEMBER] Unauthorized - user {data.leader_id} is not team leader")
            raise HTTPException(status_code=403, detail="Only team leader can update member details")
        
        # Find team member
        member = db[COLLECTIONS["team_members"]].find_one({
            "team_id": data.team_id,
            "user_email": data.user_email
        })
        
        if not member:
            logger.error(f"[UPDATE_MEMBER] Team member not found: {data.user_email}")
            raise HTTPException(status_code=404, detail="Team member not found")
        
        # Update member
        update_data = {
            "updated_at": datetime.utcnow()
        }
        
        if data.member_name:
            update_data["member_name"] = data.member_name
        if data.member_bio is not None:
            update_data["member_bio"] = data.member_bio
        if data.role:
            update_data["role"] = data.role
        
        db[COLLECTIONS["team_members"]].update_one(
            {
                "team_id": data.team_id,
                "user_email": data.user_email
            },
            {"$set": update_data}
        )
        
        logger.info(f"[UPDATE_MEMBER] Member updated successfully: {data.user_email}")
        
        return APIResponse(success=True, message="Team member updated successfully", data={
                "team_id": data.team_id,
                "user_email": data.user_email,
                "member_name": data.member_name,
                "role": data.role,
                "updated_at": datetime.utcnow().isoformat()
            })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[UPDATE_MEMBER] Error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to update team member")

# ============================================================================
# UPDATE TEAM DETAILS (TEAM LEADER ONLY)
# ============================================================================

@router.put("/update-details", dependencies=[Depends(get_api_key)])
async def update_team_details(data: UpdateTeamDetailsRequest):
    """
    Update team details - Only team leader can call this
    
    Can update:
    - team_name
    - project_title
    - project_description
    
    Authorization:
    - leader_id must match team.leader_id
    """
    logger.info(f"[UPDATE_TEAM] Updating team {data.team_id} by leader {data.leader_id}")
    
    try:
        db = get_db()
        if db is None:
            raise HTTPException(status_code=503, detail="Database unavailable")
        
        # Find team
        team = db[COLLECTIONS["teams"]].find_one({"team_id": data.team_id})
        if not team:
            logger.error(f"[UPDATE_TEAM] Team not found: {data.team_id}")
            raise HTTPException(status_code=404, detail="Team not found")
        
        # Verify authorization - only team leader can edit
        if team.get("leader_id") != data.leader_id:
            logger.warning(f"[UPDATE_TEAM] Unauthorized - user {data.leader_id} is not team leader")
            raise HTTPException(status_code=403, detail="Only team leader can update team details")
        
        # Build update data
        update_data = {
            "updated_at": datetime.utcnow().isoformat()
        }
        
        if data.team_name:
            logger.debug(f"[UPDATE_TEAM] Updating team_name from '{team.get('team_name')}' to '{data.team_name}'")
            update_data["team_name"] = data.team_name
        
        if data.project_title:
            logger.debug(f"[UPDATE_TEAM] Updating project_title from '{team.get('project_title')}' to '{data.project_title}'")
            update_data["project_title"] = data.project_title
        
        if data.project_description is not None:
            logger.debug(f"[UPDATE_TEAM] Updating project_description")
            update_data["project_description"] = data.project_description
        
        # Update team
        result = db[COLLECTIONS["teams"]].update_one(
            {"team_id": data.team_id},
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            logger.warning(f"[UPDATE_TEAM] No changes made to team")
            raise HTTPException(status_code=400, detail="No changes were made")
        
        logger.info(f"[UPDATE_TEAM] Team updated successfully - modified_count={result.modified_count}")
        
        # Fetch updated team
        updated_team = db[COLLECTIONS["teams"]].find_one({"team_id": data.team_id})
        
        return APIResponse(success=True, message="Team details updated successfully", data={
                "team_id": updated_team.get("team_id"),
                "team_name": updated_team.get("team_name"),
                "project_title": updated_team.get("project_title"),
                "project_description": updated_team.get("project_description", ""),
                "leader_id": updated_team.get("leader_id"),
                "members": updated_team.get("members", []),
                "updated_at": updated_team.get("updated_at", datetime.utcnow().isoformat())
            })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[UPDATE_TEAM] Error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to update team details")

# ============================================================================
# GET TEAM DETAILS (PUBLIC)
# ============================================================================

@router.get("/{team_id}/details")
async def get_team_details(team_id: str):
    """Get team details including members"""
    logger.info(f"[GET_TEAM_DETAILS] Fetching details for team {team_id}")
    
    try:
        db = get_db()
        if db is None:
            raise HTTPException(status_code=503, detail="Database unavailable")
        
        # Get team
        team = db[COLLECTIONS["teams"]].find_one({"team_id": team_id})
        if not team:
            logger.error(f"[GET_TEAM_DETAILS] Team not found: {team_id}")
            raise HTTPException(status_code=404, detail="Team not found")
        
        # Get team members
        members = list(db[COLLECTIONS["team_members"]].find({"team_id": team_id}))
        
        # Convert ObjectIds to strings for JSON serialization
        for member in members:
            member["_id"] = str(member.get("_id", ""))
        
        logger.info(f"[GET_TEAM_DETAILS] Found team with {len(members)} members")
        
        return APIResponse(success=True, message=f"Team details with {len(members)} members", data={
                "team_id": team.get("team_id"),
                "team_name": team.get("team_name"),
                "project_title": team.get("project_title"),
                "project_description": team.get("project_description", ""),
                "leader_id": team.get("leader_id"),
                "hackathon_id": team.get("hackathon_id"),
                "members": members,
                "created_at": team.get("created_at", ""),
                "updated_at": team.get("updated_at", "")
            })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[GET_TEAM_DETAILS] Error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to fetch team details")

# ============================================================================
# GET TEAM MEMBERS
# ============================================================================

@router.get("/{team_id}/members")
async def get_team_members(team_id: str):
    """Get all members of a team"""
    logger.info(f"[GET_MEMBERS] Fetching members for team {team_id}")
    
    try:
        db = get_db()
        if db is None:
            raise HTTPException(status_code=503, detail="Database unavailable")
        
        # Verify team exists
        team = db[COLLECTIONS["teams"]].find_one({"team_id": team_id})
        if not team:
            logger.error(f"[GET_MEMBERS] Team not found: {team_id}")
            raise HTTPException(status_code=404, detail="Team not found")
        
        # Get members
        members = list(db[COLLECTIONS["team_members"]].find({"team_id": team_id}))
        
        # Convert ObjectIds to strings
        for member in members:
            member["_id"] = str(member.get("_id", ""))
        
        logger.info(f"[GET_MEMBERS] Found {len(members)} members")
        
        return APIResponse(success=True, message=f"{len(members)} team members", data=members)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[GET_MEMBERS] Error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to fetch team members")
