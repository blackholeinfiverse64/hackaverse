# src/observability/trace_context.py
"""
Request-scoped trace context for deterministic propagation.

The TraceIdMiddleware sets both request.state.trace_id and a ContextVar so
APIResponse instances automatically inherit the active request trace without
each route passing trace_id explicitly.
"""

from __future__ import annotations

import re
import uuid
from contextvars import ContextVar, Token
from typing import Optional

from starlette.requests import Request

TRACE_ID_HEADER = "X-Request-Id"
TRACE_PARENT_HEADER = "X-Trace-Parent"
TRACE_ID_PATTERN = re.compile(r"^hv-[0-9a-f]{16}$")
UNKNOWN_TRACE_ID = "hv-unknown"

_trace_id_ctx: ContextVar[str] = ContextVar("trace_id", default=UNKNOWN_TRACE_ID)


def generate_trace_id() -> str:
    """Generate a canonical HackaVerse trace identifier."""
    return f"hv-{uuid.uuid4().hex[:16]}"


def set_trace_id(trace_id: str) -> Token:
    """Bind trace_id to the current async context."""
    return _trace_id_ctx.set(trace_id)


def reset_trace_id(token: Token) -> None:
    """Restore the previous trace context after request completion."""
    _trace_id_ctx.reset(token)


def get_current_trace_id() -> str:
    """Return the trace_id for the active request context."""
    return _trace_id_ctx.get()


def get_trace_id_from_request(request: Optional[Request]) -> str:
    """Resolve trace_id from request.state, falling back to context or unknown."""
    if request is not None:
        state_trace = getattr(getattr(request, "state", None), "trace_id", None)
        if state_trace:
            return state_trace
    current = get_current_trace_id()
    if current != UNKNOWN_TRACE_ID:
        return current
    return UNKNOWN_TRACE_ID


def get_parent_trace_id_from_request(request: Request) -> Optional[str]:
    """Return upstream parent trace id when provided by caller."""
    parent = getattr(getattr(request, "state", None), "parent_trace_id", None)
    if parent:
        return parent
    return request.headers.get(TRACE_PARENT_HEADER.lower()) or request.headers.get(
        TRACE_PARENT_HEADER
    )
