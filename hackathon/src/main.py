# Configure logging FIRST, before any other imports that might interfere
import logging
import os
import json
from pathlib import Path
from dotenv import load_dotenv

# CRITICAL: Force load .env from correct path BEFORE any other imports
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path, override=True)

# Basic logging setup
logging.basicConfig(
    level=logging.INFO,
    format="%(levelname)s:%(name)s:%(message)s"
)

from fastapi import FastAPI, HTTPException, Depends, Request
from pydantic import BaseModel
from typing import List, Optional
import time
from datetime import datetime
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from .schemas.response import APIResponse

# Import database module
from .database import connect_to_db, close_db, get_db_status, DB_AVAILABLE

logger = logging.getLogger(__name__)

# Initialize FastAPI
app = FastAPI(
    title="HackaVerse API",
    description="Hackathon management platform - Production",
    version="v5.0",
    contact={"name": "HackaVerse Team", "email": "team@hackaverse.com"},
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

@app.on_event("startup")
async def startup_event():
    """Startup event - connect to database"""
    logger.info("="*70)
    logger.info("[STARTUP] HackaVerse Backend Starting...")
    logger.info("="*70)

    env_mode = os.getenv("ENV", "development").lower()
    judge_mode = os.getenv("JUDGE_MODE", "ai").lower()

    try:
        from .services.email_service import get_email_delivery_mode
        logger.info(f"[STARTUP] Email delivery mode: {get_email_delivery_mode()}")
    except Exception as exc:
        logger.warning(f"[STARTUP] Email service check skipped: {exc}")

    if env_mode == "production" and judge_mode == "ai":
        from .judging.multi_agent_judge import is_groq_configured
        if not is_groq_configured():
            logger.error(
                "[STARTUP] GROQ_API_KEY is required when ENV=production and JUDGE_MODE=ai"
            )
            raise RuntimeError(
                "GROQ_API_KEY must be set for production AI judging. "
                "Use JUDGE_MODE=demo only for non-production demo stacks."
            )

    # Connect to database
    success = connect_to_db()

    if success:
        logger.info("[SUCCESS] Backend Ready! Database: Connected | Docs: /docs")
    else:
        logger.warning("[WARNING] Backend Started in Degraded Mode — Database NOT Connected")

    logger.info("="*70)

@app.on_event("shutdown")
async def shutdown_event():
    """Shutdown event - close database connection"""
    close_db()

# Store CORS config for later — will be added LAST so it runs FIRST
_env = os.getenv("ENV", "development").lower()
_raw_origins = os.getenv("ALLOWED_ORIGINS", "")

if _raw_origins.strip() and _raw_origins.strip() != "*":
    # Explicit origins set — use them
    _allowed_origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]
elif _env == "production":
    # PRODUCTION with no explicit origins: default to known domains
    _allowed_origins = [
        "https://hackaverse-mu.vercel.app",
        "https://hackaverse.vercel.app",
    ]
    logger.warning(
        "[CORS] Production mode with no ALLOWED_ORIGINS set — "
        "defaulting to known Vercel domains. Set ALLOWED_ORIGINS in .env "
        "to include TANTRA domains."
    )
else:
    # Development — allow all local ports for flexibility
    _allowed_origins = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "*"  # Fallback to wildcard
    ]
    logger.warning(
        "[CORS] Development mode — allowing local origins. "
        "Set ALLOWED_ORIGINS in .env for production."
    )

# ============================================================================
# SECURITY & MIDDLEWARE STACK
# ============================================================================
# IMPORTANT: Middleware order in Starlette is REVERSE - last added = first executed
# We add Security, Trace, and CSRF middleware early, then add CORSMiddleware LAST
# so it runs FIRST and can add CORS headers to ALL responses (including errors)

# Add security middleware
from .middleware import SecurityMiddleware
app.add_middleware(SecurityMiddleware)

# ============================================================================
# TRACE ID MIDDLEWARE — canonical request tracing with correlation logging
# ============================================================================
from .observability.trace_middleware import TraceIdMiddleware

app.add_middleware(TraceIdMiddleware)

# ============================================================================
# CSRF PROTECTION MIDDLEWARE
# ============================================================================
import secrets as _secrets
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

class CSRFMiddleware(BaseHTTPMiddleware):
    """CSRF protection for state-changing requests.
    
    Validates X-CSRF-Token header on POST/PUT/PATCH/DELETE requests
    when the request comes from a browser (has cookies/session).
    API-key authenticated requests are exempt (machine-to-machine).
    """
    SAFE_METHODS = {"GET", "HEAD", "OPTIONS"}
    EXEMPT_PATHS = {"/auth/login", "/auth/register", "/docs", "/redoc",
                    "/openapi.json", "/", "/health", "/system/ready",
                    "/system/health"}

    async def dispatch(self, request: Request, call_next):
        # Skip safe methods
        if request.method in self.SAFE_METHODS:
            return await call_next(request)
        # Skip exempt paths (strip /api/v1 prefix if present)
        path = request.url.path
        clean_path = path.replace("/api/v1", "") if path.startswith("/api/v1") else path
        if clean_path in self.EXEMPT_PATHS:
            return await call_next(request)
        # Skip if API key is present (machine-to-machine)
        if request.headers.get("X-API-Key"):
            return await call_next(request)
        # Skip if no cookies (not a browser session)
        if not request.cookies:
            return await call_next(request)
        # Validate CSRF token
        csrf_token = request.headers.get("X-CSRF-Token")
        session_csrf = request.cookies.get("csrf_token")
        if not csrf_token or not session_csrf or csrf_token != session_csrf:
            return JSONResponse(
                status_code=403,
                content={"success": False, "message": "CSRF token missing or invalid",
                         "data": None, "trace_id": getattr(getattr(request, 'state', None), 'trace_id', 'hv-unknown'),
                         "error_code": "CSRF_INVALID"}
            )
        return await call_next(request)

from starlette.middleware.base import BaseHTTPMiddleware
app.add_middleware(CSRFMiddleware)

# ============================================================================
# CORS MIDDLEWARE
# ============================================================================
# Enables cross-origin requests from specified origins with full support for
# credentials, preflight requests, and custom headers.
app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-API-Key", "X-Nonce",
                   "X-Timestamp", "X-Signature", "X-CSRF-Token", "X-Trace-Parent"],
    expose_headers=["X-Request-Id"],
    max_age=3600,
)

# CSRF token endpoint
@app.get("/csrf-token")
def get_csrf_token():
    """Generate a CSRF token and set it as a cookie."""
    from starlette.responses import JSONResponse as StarletteJSON
    token = _secrets.token_urlsafe(32)
    response = StarletteJSON(
        content={"success": True, "message": "CSRF token generated", "data": {"csrf_token": token}}
    )
    response.set_cookie(
        key="csrf_token", value=token, httponly=False, samesite="strict",
        secure=_env == "production", max_age=3600
    )
    return response

# ============================================================================
# CORE ROUTERS
# ============================================================================

from .routes.auth_routes import router as auth_router
from .routes.admin import router as admin_router, registration_router
from .routes.hackathons import router as hackathons_router, public_router as hackathons_public_router
from .routes.teams_crud import router as teams_crud_router
from .routes.submissions import router as submissions_router
from .routes.leaderboard import router as leaderboard_router
from .routes.system import router as system_router
from .routes.notifications import router as notifications_router
from .routes.judge import router as judge_router
from .routes.judge_review import router as judge_review_router
from .routes.team_members_management import router as team_members_router
from .routes.judge_invitations import router as judge_invitations_router
from .routes.mcp import router as mcp_router
from .routes.teams import router as teams_router
from .routes.user_profile import router as user_profile_router
from .routes.submissions_crud import router as submissions_crud_router
from .routes.missing_endpoints import (
    reward_router,
    leaderboard_router as missing_leaderboard_router,
    judging_router,
)
from .routes.file_uploads import router as file_uploads_router
from .routes.webhooks import router as webhooks_router

# --------------------------------------------------------------------------
# API VERSIONING — Single canonical namespace: /api/v1
# --------------------------------------------------------------------------
# All routers are mounted ONLY under /api/v1. No duplicate registrations.
# Frontend is configured to use API_BASE_URL = http://host:port/api/v1
# --------------------------------------------------------------------------
from fastapi import APIRouter as _APIRouter

API_PREFIX = "/api/v1"
v1 = _APIRouter(prefix=API_PREFIX)

# Auth
v1.include_router(auth_router, prefix="/auth")

# Admin
v1.include_router(admin_router)
v1.include_router(registration_router)

# Hackathons (public + authenticated)
v1.include_router(hackathons_public_router)
v1.include_router(hackathons_router)

# Teams (CRUD + management + members)
v1.include_router(teams_crud_router)     # /api/v1/teams (GET list, GET by id)
v1.include_router(teams_router)          # /api/v1/teams (POST create, invitations, etc.)
v1.include_router(team_members_router)   # /api/v1/teams (member management)

# Submissions
v1.include_router(submissions_router)
v1.include_router(submissions_crud_router)

# Judging & Leaderboard
v1.include_router(judge_router)
v1.include_router(judge_review_router)
v1.include_router(judge_invitations_router)
v1.include_router(leaderboard_router)
v1.include_router(missing_leaderboard_router)
v1.include_router(judging_router)

# System & Infra
v1.include_router(system_router)
v1.include_router(notifications_router)
v1.include_router(mcp_router)
v1.include_router(user_profile_router)
v1.include_router(reward_router)
v1.include_router(file_uploads_router)
v1.include_router(webhooks_router)

# ============================================================================
# CORS MIDDLEWARE — Added LAST so it runs FIRST
# ============================================================================
# CRITICAL: CORSMiddleware MUST be added last so it runs first in the middleware
# stack. This ensures CORS headers are added to ALL responses, including error
# responses from other middleware.
app.add_middleware(
    CORSMiddleware,
    # Production hardening:
    # - In production, ALLOWED_ORIGINS must be explicitly set (or we default to known Vercel domains above).
    # - In development, we allow local origins and may include "*" as a fallback.
    allow_origins=_allowed_origins,
    allow_credentials=("*" not in _allowed_origins),
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=[
        "Authorization",
        "Content-Type",
        "X-API-Key",
        "X-Nonce",
        "X-Timestamp",
        "X-Signature",
        "X-CSRF-Token",
        "X-Trace-Parent",
    ],
    expose_headers=["X-Request-Id"],
)

# Mount versioned router
app.include_router(v1)

# --------------------------------------------------------------------------
# BACKWARD COMPATIBILITY — unversioned aliases for frontend migration period
# These mirror the v1 routes at the root level so existing frontend calls
# (e.g., /auth/login, /teams, /hackathons) continue to work until the
# frontend is fully migrated to /api/v1 paths.
# --------------------------------------------------------------------------
app.include_router(auth_router, prefix="/auth")
app.include_router(admin_router)
app.include_router(registration_router)
app.include_router(hackathons_public_router)
app.include_router(hackathons_router)
app.include_router(teams_crud_router)
app.include_router(submissions_router)
app.include_router(leaderboard_router)
app.include_router(system_router)
app.include_router(notifications_router)
app.include_router(judge_router)
app.include_router(judge_review_router)
app.include_router(judge_invitations_router)
app.include_router(team_members_router)
app.include_router(mcp_router)
app.include_router(teams_router)
app.include_router(user_profile_router)
app.include_router(submissions_crud_router)
app.include_router(reward_router)
app.include_router(judging_router)
app.include_router(missing_leaderboard_router)
app.include_router(file_uploads_router)
app.include_router(webhooks_router)

# --------------------------------------------------------------------------
# DETERMINISTIC ERROR CONTRACT SYSTEM
# --------------------------------------------------------------------------
# All errors return: {success, message, data, trace_id, error_code}
# --------------------------------------------------------------------------
from .middleware_handlers.error_handler import (
    http_exception_handler,
    validation_exception_handler,
    generic_exception_handler,
)

app.add_exception_handler(HTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, generic_exception_handler)

# ============================================================================
# ESSENTIAL SYSTEM ENDPOINTS
# ============================================================================

# Explicit CORS preflight handlers for key endpoints
@app.options("/{path_name:path}", include_in_schema=False)
async def options_handler(request: Request, path_name: str):
    """Explicit OPTIONS handler for CORS preflight requests.

    CORSMiddleware normally handles OPTIONS, but we keep this handler to
    guarantee a fast 200 response even when other middleware short-circuits.
    """
    from starlette.responses import Response

    origin = request.headers.get("origin")
    allow_origin = ""
    if "*" in _allowed_origins:
        allow_origin = "*"
    elif origin and origin in _allowed_origins:
        allow_origin = origin

    headers = {
        "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
        "Access-Control-Allow-Headers": "Authorization,Content-Type,X-API-Key,X-Nonce,X-Timestamp,X-Signature,X-CSRF-Token,X-Trace-Parent",
        "Access-Control-Expose-Headers": "X-Request-Id",
    }
    if allow_origin:
        headers["Access-Control-Allow-Origin"] = allow_origin
        headers["Vary"] = "Origin"

    return Response(status_code=200, headers=headers)

@app.get("/")
def root():
    """Root endpoint - API information"""
    return {
        "message": "HackaVerse API",
        "version": "v5.0",
        "docs": "/docs",
        "status": "operational"
    }

@app.get("/health")
def health_check():
    """Health check endpoint for frontend"""
    status = get_db_status()
    
    return APIResponse(
        success=True,
        message="Service is healthy",
        data={
            "status": "ok" if status["connected"] else "degraded",
            "database": status["status"],
            "timestamp": datetime.now().isoformat()
        }
    )

# ============================================================================
# WEBSOCKET — Real-time Notifications
# ============================================================================

from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, Set

# In-memory connection store: user_id → set of websocket connections
_ws_connections: Dict[str, Set[WebSocket]] = {}


async def broadcast_to_user(user_id: str, payload: dict):
    """Send a JSON message to every open WebSocket for a given user."""
    for ws in list(_ws_connections.get(user_id, [])):
        try:
            await ws.send_json(payload)
        except Exception:
            _ws_connections[user_id].discard(ws)


@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    """WebSocket endpoint for real-time push notifications.

    Connect with: ws://localhost:8000/ws/<user_id>
    Messages are JSON objects with a 'type' field.
    """
    await websocket.accept()
    _ws_connections.setdefault(user_id, set()).add(websocket)
    logger.info(f"[WS] User {user_id} connected ({len(_ws_connections[user_id])} sessions)")
    try:
        while True:
            # Keep the connection alive; optionally handle client messages
            data = await websocket.receive_text()
            # Echo-back / ping-pong
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        _ws_connections[user_id].discard(websocket)
        logger.info(f"[WS] User {user_id} disconnected")


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", 8000))
    host = "0.0.0.0"

    logger.info(f"[MAIN] Starting FastAPI server")
    logger.info(f"[MAIN] Host: {host}")
    logger.info(f"[MAIN] Port: {port}")
    logger.info(f"[MAIN] Environment: {os.getenv('ENV', 'development')}")

    uvicorn.run(
        app,
        host=host,
        port=port,
        log_level="info",
        access_log=True
    )
