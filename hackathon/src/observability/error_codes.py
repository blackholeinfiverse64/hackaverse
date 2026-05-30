# src/observability/error_codes.py
"""
Canonical Error Codes for HackaVerse
=====================================
Every error response includes an error_code drawn from this registry.
Codes are deterministic, replay-safe, and machine-parseable.
"""


class ErrorCode:
    """Namespace of canonical error code strings."""

    # ---- Auth ----
    AUTH_MISSING_TOKEN = "AUTH_MISSING_TOKEN"
    AUTH_INVALID_TOKEN = "AUTH_INVALID_TOKEN"
    AUTH_TOKEN_EXPIRED = "AUTH_TOKEN_EXPIRED"
    AUTH_INVALID_CREDENTIALS = "AUTH_INVALID_CREDENTIALS"
    AUTH_RATE_LIMITED = "AUTH_RATE_LIMITED"
    AUTH_MISSING_API_KEY = "AUTH_MISSING_API_KEY"
    AUTH_INVALID_API_KEY = "AUTH_INVALID_API_KEY"

    # ---- Validation ----
    VALIDATION_ERROR = "VALIDATION_ERROR"
    INVALID_INPUT = "INVALID_INPUT"

    # ---- Resource ----
    RESOURCE_NOT_FOUND = "RESOURCE_NOT_FOUND"
    RESOURCE_CONFLICT = "RESOURCE_CONFLICT"
    RESOURCE_FORBIDDEN = "RESOURCE_FORBIDDEN"

    # ---- Database ----
    DATABASE_UNAVAILABLE = "DATABASE_UNAVAILABLE"
    DATABASE_ERROR = "DATABASE_ERROR"

    # ---- Business logic ----
    TEAM_ALREADY_MEMBER = "TEAM_ALREADY_MEMBER"
    TEAM_NOT_LEADER = "TEAM_NOT_LEADER"
    INVITATION_EXPIRED = "INVITATION_EXPIRED"
    INVITATION_INVALID = "INVITATION_INVALID"
    REPLAY_DETECTED = "REPLAY_DETECTED"

    # ---- System ----
    INTERNAL_ERROR = "INTERNAL_ERROR"
    SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE"
    CSRF_INVALID = "CSRF_INVALID"
    RATE_LIMITED = "RATE_LIMITED"

    # ---- Judging ----
    JUDGING_FAILED = "JUDGING_FAILED"
    SUBMISSION_INVALID = "SUBMISSION_INVALID"
