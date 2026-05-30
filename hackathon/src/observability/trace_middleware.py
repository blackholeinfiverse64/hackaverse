# src/observability/trace_middleware.py
"""
Trace propagation middleware — attaches trace_id to every HTTP request/response.
"""

from __future__ import annotations

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from .correlation_logger import CorrelationLogger
from .trace_context import (
    TRACE_ID_HEADER,
    TRACE_PARENT_HEADER,
    generate_trace_id,
    reset_trace_id,
    set_trace_id,
)


class TraceIdMiddleware(BaseHTTPMiddleware):
    """Inject a unique trace_id into every request/response.

    The trace_id is:
    - Generated per request as 'hv-<hex16>'
    - Stored on request.state.trace_id for downstream use
    - Bound to a ContextVar for APIResponse default propagation
    - Returned in X-Request-Id response header
    - Logged with full request lifecycle (start + completion)

    Trace propagation:
    - Accepts optional X-Trace-Parent header from upstream callers
    - Stores parent_trace_id on request.state for lineage reconstruction
    - Never reuses client-supplied IDs (generates own trace_id for safety)
    """

    _QUIET_PATHS = {
        "/",
        "/health",
        "/docs",
        "/redoc",
        "/openapi.json",
        "/csrf-token",
        "/system/ready",
        "/system/health",
    }

    @staticmethod
    def _clean_path(path: str) -> str:
        if path.startswith("/api/v1"):
            return path[7:] or "/"
        return path

    async def dispatch(self, request: Request, call_next) -> Response:
        trace_id = generate_trace_id()
        token = set_trace_id(trace_id)

        request.state.trace_id = trace_id
        parent_trace = request.headers.get("x-trace-parent") or request.headers.get(
            TRACE_PARENT_HEADER
        )
        request.state.parent_trace_id = parent_trace or None

        if not hasattr(request.state, "user_id"):
            request.state.user_id = "anonymous"

        clean_path = self._clean_path(request.url.path)
        should_log = clean_path not in self._QUIET_PATHS
        clog = CorrelationLogger.from_request(request) if should_log else None

        if clog:
            clog.request_started()

        try:
            response = await call_next(request)
        except Exception:
            if clog:
                clog.request_failed(500, "INTERNAL_ERROR", "Unhandled exception")
            raise
        finally:
            reset_trace_id(token)

        response.headers[TRACE_ID_HEADER] = trace_id

        if clog:
            clog.request_completed(response.status_code)

        return response
