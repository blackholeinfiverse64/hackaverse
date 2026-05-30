#!/usr/bin/env python3
"""
Security middleware for FastAPI
Integrates nonce, signature, and ledger chaining for enhanced security
"""

from fastapi import Request, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from typing import Optional, Dict, Any
import json
import base64
import time
import os
import logging

logger = logging.getLogger(__name__)
from .security import security_manager, validate_request_signing, validate_replay_protection, check_rate_limit, get_api_key_role

class SecurityMiddleware(BaseHTTPMiddleware):
    """Middleware to handle security features"""
    
    async def dispatch(self, request: Request, call_next):
        """
        Process incoming requests with security checks
        """
        # CRITICAL: Skip ALL middleware for OPTIONS requests (CORS preflight)
        # CORS preflight MUST be handled by CORSMiddleware, not security checks
        if request.method == "OPTIONS":
            return await call_next(request)
        
        # Critical: Bypass ALL middleware for health check endpoints
        # This must be the first check to prevent any processing
        _path = request.url.path
        # Strip /api/v1 prefix for matching
        _clean = _path[7:] if _path.startswith("/api/v1") else _path
        if _clean in ("/system/ready", "/system/health"):
            return await call_next(request)

        # Skip security checks for certain endpoints (docs, etc.)
        skip_paths = ["/ping", "/get/ping", "/test", "/docs", "/redoc",
                      "/openapi.json", "/", "/network/ping", "/network/connectivity",
                      "/csrf-token", "/health", "/auth/register", "/auth/login",
                      "/notifications/announcements", "/hackathons", "/hackathons/active"]
        
        # Check if path matches skip_paths OR starts with public prefixes
        if _clean in skip_paths or _clean.startswith("/hackathons"):
            return await call_next(request)

        logger.info(f"Processing {request.url.path}")
        try:
            # Get API key from header
            api_key = request.headers.get("X-API-Key")
            if api_key:
                # Skip rate limiting for GET requests (read-only)
                if request.method != "GET":
                    # Check rate limiting only for write operations
                    check_rate_limit(api_key, request.url.path)

                # Check role-based access
                role = get_api_key_role(api_key)
                if role:
                    if _clean.startswith("/admin") and role != "admin":
                        return JSONResponse(
                            status_code=403,
                            content={"detail": "Admin access required"}
                        )
                    if _clean.startswith("/agent") and role not in ["agent", "admin"]:
                        return JSONResponse(
                            status_code=403,
                            content={"detail": "Agent or admin access required"}
                        )
                    if _clean.startswith("/workflows") and role not in ["agent", "admin"]:
                        return JSONResponse(
                            status_code=403,
                            content={"detail": "Agent or admin access required for workflows"}
                        )
            else:
                # Require API key for workflows
                if _clean.startswith("/workflows"):
                    return JSONResponse(
                        status_code=401,
                        content={"detail": "API Key required for workflows"}
                    )

            # Perform optional security checks
            consumed_body = await self._perform_optional_security_checks(request)

        except HTTPException as e:
            return JSONResponse(
                status_code=e.status_code,
                content={"detail": e.detail}
            )
        except Exception as e:
            return JSONResponse(
                status_code=400,
                content={"detail": f"Security validation failed: {str(e)}"}
            )

        # Restore the body if it was consumed
        if consumed_body:
            request._body = consumed_body

        # Continue with the request
        response = await call_next(request)
        return response

    def _requires_advanced_security(self, request: Request) -> bool:
        """
        Determine if the request requires advanced security checks.

        Args:
            request: The incoming request

        Returns:
            bool: True if advanced security is required
        """
        # Require advanced security for workflow endpoints
        return request.url.path.startswith("/workflows")
    
    async def _perform_optional_security_checks(self, request: Request) -> Optional[bytes]:
        """
        Perform optional security checks on the request

        Args:
            request: Incoming request

        Returns:
            The consumed body if any, to restore it
        """
        # Extract security headers
        nonce = request.headers.get("X-Nonce")
        timestamp = request.headers.get("X-Timestamp")
        signature = request.headers.get("X-Signature")

        # Get request body for signature verification
        body = b""
        if request.method in ["POST", "PUT", "PATCH"]:
            body = await request.body()
        request_body = body.decode('utf-8') if body else ""

        # Check if security is enforced (SECURITY_SECRET_KEY is set)
        security_enforced = bool(os.getenv("SECURITY_SECRET_KEY"))

        if security_enforced:
            # When security is enforced, require headers for protected routes
            if self._requires_advanced_security(request):
                if not signature:
                    raise HTTPException(status_code=400, detail="Missing X-Signature header")
                if not timestamp:
                    raise HTTPException(status_code=400, detail="Missing X-Timestamp header")
                if not nonce:
                    raise HTTPException(status_code=400, detail="Missing X-Nonce header")

                # Validate timestamp format and expiry
                try:
                    ts = int(timestamp)
                    current_time = int(time.time())
                    if current_time - ts > 300:  # 5 minutes
                        raise HTTPException(status_code=401, detail="Request timestamp is too old")
                except ValueError:
                    raise HTTPException(status_code=400, detail="Invalid X-Timestamp format")

                # Validate signature
                if not security_manager.verify_signature(timestamp, request_body, signature):
                    raise HTTPException(status_code=401, detail="Invalid X-Signature")

                # Validate nonce
                if not security_manager.verify_nonce(nonce, ts):
                    raise HTTPException(status_code=409, detail="Invalid or reused nonce")
        else:
            # When security not enforced, validate only if headers provided
            validate_request_signing(timestamp, request_body, signature)
            validate_replay_protection(nonce, timestamp)

        # Return the body to restore it if consumed
        return body if body else None

# Security header dependencies for specific endpoints
async def get_security_headers(
    nonce: Optional[str] = None,
    timestamp: Optional[str] = None,
    signature: Optional[str] = None
) -> Dict[str, Any]:
    """
    Dependency to extract security headers
    
    Args:
        nonce: Nonce header
        timestamp: Timestamp header
        signature: Signature header
        
    Returns:
        Dictionary with security headers
    """
    return {
        "nonce": nonce,
        "timestamp": timestamp,
        "signature": signature
    }

# Example of how to use security in an endpoint
def secure_endpoint_dependency():
    """
    Dependency for securing endpoints that require advanced security
    """
    def dependency(
        request: Request,
        security_headers: dict = Depends(get_security_headers)
    ):
        # This would be where you perform additional security checks
        # For now, we'll just pass through
        return security_headers
    
    return dependency
