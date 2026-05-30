# All schema classes in one place to avoid circular imports
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class AgentRequest(BaseModel):
    team_id: str = Field(..., examples=["team_42"])
    prompt: str = Field(..., examples=["How to build a REST API?"])
    metadata: Optional[Dict[str, Any]] = None
    tenant_id: str = "default"
    event_id: str = "default_event"
    workspace_id: Optional[str] = None

class AgentResponse(BaseModel):
    processed_input: str
    action: str
    result: str
    reward: float
    core_response: Optional[dict] = None

class RewardRequest(BaseModel):
    team_id: str
    score: float
    feedback: Optional[str] = None
    tenant_id: str = "default"
    event_id: str = "default_event"
    workspace_id: Optional[str] = None

class RewardResponse(BaseModel):
    success: bool
    message: str
    data: Optional[dict] = None

class LogResponse(BaseModel):
    timestamp: str
    message: str
    level: str

class LogRequest(BaseModel):
    message: str
    level: str = "INFO"

class TeamRegistration(BaseModel):
    team_name: str
    project_name: str
    members: list

class JudgeRequest(BaseModel):
    submission_text: str
    team_id: Optional[str] = None
    tenant_id: str = "default"
    event_id: str = "default_event"
    workspace_id: Optional[str] = None
    request_id: Optional[str] = None
    
    class Config:
        extra = "ignore"  # Ignore extra fields instead of raising errors

class JudgeResponse(BaseModel):
    clarity: float
    quality: float
    innovation: float
    total_score: float
    confidence: float
    trace: str
    team_id: Optional[str] = None
    fallback: Optional[bool] = None

class BatchSubmissionItem(BaseModel):
    submission_text: str
    team_id: Optional[str] = None
    request_id: Optional[str] = None

class BatchJudgeRequest(BaseModel):
    submissions: List[BatchSubmissionItem]
    tenant_id: str = "default"
    event_id: str = "default_event"
    workspace_id: Optional[str] = None

__all__ = [
    "AgentRequest", "AgentResponse", 
    "RewardRequest", "RewardResponse",
    "LogRequest", "LogResponse", 
    "TeamRegistration", 
    "JudgeRequest", "JudgeResponse",
    "BatchJudgeRequest", "BatchSubmissionItem"
]
