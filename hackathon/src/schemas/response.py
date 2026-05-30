from pydantic import BaseModel, Field
from typing import Optional, Any, Dict, TYPE_CHECKING

from ..observability.trace_context import get_current_trace_id, get_trace_id_from_request

if TYPE_CHECKING:
    from starlette.requests import Request


def _resolve_trace_id() -> str:
    """Use the active request trace_id when middleware has set context."""
    return get_current_trace_id()


class APIResponse(BaseModel):
    """Canonical response envelope for all HackaVerse API endpoints.

    Every response carries a trace_id for end-to-end observability.
    TANTRA uses trace_id to correlate events across ecosystem boundaries.

    Success responses:
        {"success": true, "message": "...", "data": {...}, "trace_id": "hv-..."}

    Error responses:
        {"success": false, "message": "...", "data": null,
         "trace_id": "hv-...", "error_code": "VALIDATION_ERROR"}
    """
    success: bool
    message: str
    data: Optional[Any] = None
    trace_id: str = Field(default_factory=_resolve_trace_id)
    error_code: Optional[str] = None

    @classmethod
    def from_request(
        cls,
        request: "Request",
        *,
        success: bool,
        message: str,
        data: Optional[Any] = None,
        error_code: Optional[str] = None,
    ) -> "APIResponse":
        """Build a response envelope bound to the current request trace."""
        return cls(
            success=success,
            message=message,
            data=data,
            trace_id=get_trace_id_from_request(request),
            error_code=error_code,
        )


class PaginatedAPIResponse(APIResponse):
    """APIResponse with pagination metadata for list endpoints."""
    pagination: Optional[Dict[str, Any]] = None


class JudgingResult(BaseModel):
    """Deterministic judging output schema — strict contract for TANTRA."""
    submission_hash: str
    team_id: str
    total_score: float
    scores: Dict[str, float]  # e.g. {"clarity": 8.5, "innovation": 7.0}
    confidence: float = Field(ge=0.0, le=1.0)
    judge_type: str  # "ai" or "manual"
    feedback: Optional[str] = None
    version: int = 1
    trace_id: str = Field(default_factory=_resolve_trace_id)
    provenance_hash: Optional[str] = None  # hash from provenance chain