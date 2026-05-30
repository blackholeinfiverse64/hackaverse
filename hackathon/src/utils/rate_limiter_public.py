"""
Rate limiting middleware for public endpoints.

Usage in routes:
    from ..utils.rate_limiter_public import check_public_rate_limit

    @router.get("/public/data")
    async def public_endpoint(request: Request):
        check_public_rate_limit(request)
        ...
"""
import time
import logging
from collections import defaultdict
from threading import Lock
from fastapi import Request, HTTPException

logger = logging.getLogger(__name__)

# ─── In-memory rate limiter (works per-process) ───
_requests: dict = defaultdict(list)  # ip -> [timestamps]
_lock = Lock()

# Default limits
PUBLIC_RATE_LIMIT = 60      # requests
PUBLIC_RATE_WINDOW = 60     # per 60 seconds
AUTH_RATE_LIMIT = 10        # login/register attempts
AUTH_RATE_WINDOW = 300      # per 5 minutes
WEBHOOK_RATE_LIMIT = 5      # webhook subscriptions
WEBHOOK_RATE_WINDOW = 3600  # per hour


def _get_client_ip(request: Request) -> str:
    """Extract client IP, respecting X-Forwarded-For behind proxies."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _is_allowed(key: str, limit: int, window: int) -> bool:
    """Check if request is within rate limit."""
    now = time.time()
    with _lock:
        # Prune old entries
        _requests[key] = [t for t in _requests[key] if now - t < window]
        if len(_requests[key]) >= limit:
            return False
        _requests[key].append(now)
        return True


def check_public_rate_limit(request: Request):
    """Rate limit for general public endpoints (60 req/min per IP)."""
    ip = _get_client_ip(request)
    key = f"public:{ip}"
    if not _is_allowed(key, PUBLIC_RATE_LIMIT, PUBLIC_RATE_WINDOW):
        logger.warning(f"[RATE_LIMIT] Public rate limit exceeded for IP: {ip}")
        raise HTTPException(
            status_code=429,
            detail="Too many requests. Please try again later.",
            headers={"Retry-After": str(PUBLIC_RATE_WINDOW)}
        )


def check_auth_rate_limit(request: Request):
    """Stricter rate limit for auth endpoints (10 attempts / 5 min per IP)."""
    ip = _get_client_ip(request)
    key = f"auth:{ip}"
    if not _is_allowed(key, AUTH_RATE_LIMIT, AUTH_RATE_WINDOW):
        logger.warning(f"[RATE_LIMIT] Auth rate limit exceeded for IP: {ip}")
        raise HTTPException(
            status_code=429,
            detail="Too many authentication attempts. Please wait 5 minutes.",
            headers={"Retry-After": str(AUTH_RATE_WINDOW)}
        )


def check_webhook_rate_limit(request: Request):
    """Rate limit for webhook subscriptions (5 / hour per IP)."""
    ip = _get_client_ip(request)
    key = f"webhook:{ip}"
    if not _is_allowed(key, WEBHOOK_RATE_LIMIT, WEBHOOK_RATE_WINDOW):
        logger.warning(f"[RATE_LIMIT] Webhook rate limit exceeded for IP: {ip}")
        raise HTTPException(
            status_code=429,
            detail="Too many webhook subscriptions. Please wait.",
            headers={"Retry-After": str(WEBHOOK_RATE_WINDOW)}
        )
