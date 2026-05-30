# src/observability/__init__.py
"""HackaVerse observability package — correlation logging, tracing & error codes."""

from .correlation_logger import CorrelationLogger
from .error_codes import ErrorCode
from .trace_context import (
    TRACE_ID_HEADER,
    TRACE_PARENT_HEADER,
    TRACE_ID_PATTERN,
    UNKNOWN_TRACE_ID,
    generate_trace_id,
    get_current_trace_id,
    get_parent_trace_id_from_request,
    get_trace_id_from_request,
)
from .trace_middleware import TraceIdMiddleware

__all__ = [
    "CorrelationLogger",
    "ErrorCode",
    "TRACE_ID_HEADER",
    "TRACE_PARENT_HEADER",
    "TRACE_ID_PATTERN",
    "UNKNOWN_TRACE_ID",
    "TraceIdMiddleware",
    "generate_trace_id",
    "get_current_trace_id",
    "get_parent_trace_id_from_request",
    "get_trace_id_from_request",
]
