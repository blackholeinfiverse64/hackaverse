"""
Database models and schemas for HackaVerse
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, EmailStr

# User Models
class User(BaseModel):
    user_id: str
    email: EmailStr
    name: str
    role: str  # admin, participant, judge
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    profile_completion: int = 0
    skills: List[str] = []
    bio: Optional[str] = None

# Hackathon Models
class Hackathon(BaseModel):
    id: str
    name: str
    description: str
    start_date: str
    end_date: str
    min_team_size: int
    max_team_size: int
    status: str  # active, inactive, draft, completed
    participant_count: int = 0
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())

# Team Models
class Team(BaseModel):
    team_id: str
    hackathon_id: str
    team_name: str
    project_title: str
    leader_id: str
    members: List[str]
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())

# Invitation Models
class Invitation(BaseModel):
    id: str
    team_id: str
    team_name: str
    hackathon_id: str
    hackathon_name: str
    inviter_name: str
    invitee_email: EmailStr
    status: str  # pending, accepted, declined
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())

# Project Models
class Project(BaseModel):
    project_id: str
    team_id: str
    hackathon_id: str
    title: str
    description: str
    github_url: Optional[str] = None
    demo_url: Optional[str] = None
    status: str  # draft, in_progress, submitted
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now().isoformat())

# Submission Models
class Submission(BaseModel):
    submission_id: str
    team_id: str
    hackathon_id: str
    title: str
    description: str
    github_link: Optional[str] = None
    demo_link: Optional[str] = None
    submitted_by: Optional[str] = None
    submitted_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    status: str = 'submitted'  # submitted, scoring, passed, failed
    score: Optional[float] = None

# Judgment Models
class Judgment(BaseModel):
    judgment_id: str
    submission_hash: str
    team_id: str
    hackathon_id: str
    scores: dict
    total_score: float
    feedback: Optional[str] = None
    judge_type: str  # ai, manual
    judged_by: Optional[str] = None
    judged_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    version: int = 1

# Notification Models
class Notification(BaseModel):
    notification_id: str
    user_id: str
    title: str
    message: str
    type: str  # hackathon_joined, invitation_received, invitation_accepted, project_submitted, judge_reviewed
    read: bool = False
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    related_id: Optional[str] = None  # hackathon_id, team_id, etc.

# Collection names
COLLECTIONS = {
    "users": "users",
    "sessions": "sessions",
    "hackathons": "hackathons",
    "teams": "teams",
    "invitations": "invitations",
    "submissions": "submissions",
    "judgments": "judgments",
    "hackathon_participants": "hackathon_participants",
    "user_teams": "user_teams",
    "notifications": "notifications",
    "announcements": "announcements",
    "activities": "activities",
    "team_members": "team_members",
    "files": "files",
    "provenance_logs": "provenance_logs",
    "rewards": "rewards",
    "webhooks": "webhooks",
    "judges": "judges",
    "judge_invitations": "judge_invitations",
    "judge_assignments": "judge_assignments",
}
