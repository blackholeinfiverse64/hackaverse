"""
Deterministic Error Contract System for HackaVerse
=====================================================
All errors return a consistent, replay-safe APIResponse envelope with:
  - success: false
  - message: human-readable description
  - data: null or structured error details
  - trace_id: request correlation ID
  - error_code: machine-parseable canonical code

Handles:
  - HTTPException (from routes / middleware)
  - RequestValidationError (Pydantic / FastAPI input validation)
  - Generic Exception (unexpected failures)
"""

from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from ..schemas.response import APIResponse
from ..observability.error_codes import ErrorCode
import logging

logger = logging.getLogger(__name__)


from ..observability.trace_context import get_trace_id_from_request


def _status_to_error_code(status_code: int) -> str:
    """Map HTTP status codes to canonical error codes."""
    mapping = {
        400: ErrorCode.INVALID_INPUT,
        401: ErrorCode.AUTH_INVALID_TOKEN,
        403: ErrorCode.RESOURCE_FORBIDDEN,
        404: ErrorCode.RESOURCE_NOT_FOUND,
        409: ErrorCode.RESOURCE_CONFLICT,
        422: ErrorCode.VALIDATION_ERROR,
        429: ErrorCode.RATE_LIMITED,
        503: ErrorCode.SERVICE_UNAVAILABLE,
    }
    return mapping.get(status_code, ErrorCode.INTERNAL_ERROR)


async def http_exception_handler(request: Request, exc: HTTPException):
    """Handle HTTPException with deterministic error contract."""
    trace_id = get_trace_id_from_request(request)
    error_code = _status_to_error_code(exc.status_code)

    # Use detail as message if it's a string, otherwise extract
    if isinstance(exc.detail, str):
        message = exc.detail
        data = None
    elif isinstance(exc.detail, dict):
        message = exc.detail.get("message", str(exc.detail))
        data = exc.detail
    else:
        message = str(exc.detail)
        data = None

    logger.warning(
        f"[HTTP {exc.status_code}] {error_code} | trace={trace_id} | "
        f"path={request.url.path} | {message}"
    )

    return JSONResponse(
        status_code=exc.status_code,
        content=APIResponse(
            success=False,
            message=message,
            data=data,
            trace_id=trace_id,
            error_code=error_code,
        ).model_dump(),
    )


async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle Pydantic validation errors with clear, replay-safe messages."""
    trace_id = get_trace_id_from_request(request)
    errors = exc.errors()

    # Format validation errors into user-friendly messages
    formatted_errors = []
    for error in errors:
        field = ".".join(str(loc) for loc in error.get("loc", []))
        msg = str(error.get("msg", "Unknown error")).encode("ascii", "ignore").decode("ascii")
        error_type = error.get("type", "")

        if "missing" in error_type or "required" in error_type:
            formatted_errors.append(f"Field '{field}' is required but was not provided")
        elif "type_error" in error_type:
            formatted_errors.append(f"Field '{field}' has an invalid type: {msg}")
        elif "value_error" in error_type:
            formatted_errors.append(f"Field '{field}' validation failed: {msg}")
        else:
            formatted_errors.append(f"Field '{field}': {msg}")

    error_message = "; ".join(formatted_errors) if formatted_errors else "Validation failed"

    logger.warning(
        f"[HTTP 422] VALIDATION_ERROR | trace={trace_id} | "
        f"path={request.url.path} | {error_message}"
    )

    return JSONResponse(
        status_code=422,
        content=APIResponse(
            success=False,
            message=error_message,
            data={"errors": formatted_errors} if formatted_errors else None,
            trace_id=trace_id,
            error_code=ErrorCode.VALIDATION_ERROR,
        ).model_dump(),
    )


async def generic_exception_handler(request: Request, exc: Exception):
    """Handle unhandled exceptions — never expose stack traces to clients."""
    trace_id = get_trace_id_from_request(request)
    # Sanitize message for client
    safe_msg = str(exc).encode("ascii", "ignore").decode("ascii")

    logger.error(
        f"[HTTP 500] INTERNAL_ERROR | trace={trace_id} | "
        f"path={request.url.path} | {safe_msg}",
        exc_info=True,
    )

    return JSONResponse(
        status_code=500,
        content=APIResponse(
            success=False,
            message="Internal server error",
            data=None,
            trace_id=trace_id,
            error_code=ErrorCode.INTERNAL_ERROR,
        ).model_dump(),
    )