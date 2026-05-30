"""
conftest.py — Shared pytest fixtures for HackaVerse backend tests.
"""

import os
import sys
import pytest
from pathlib import Path
from unittest.mock import MagicMock, patch

# ── Make sure the `src` package is importable ──
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

# Set test env vars BEFORE any src imports
os.environ.setdefault("MONGODB_URI", "")
os.environ.setdefault("JWT_SECRET", "test-secret-key-do-not-use-in-prod")
os.environ.setdefault("API_KEY", "test-api-key")
os.environ.setdefault("ENV", "test")


# ── Fixtures ──

@pytest.fixture
def mock_db():
    """Return a dict-of-MagicMock that mimics pymongo collections."""
    collections = {}

    class FakeDB:
        def __getitem__(self, name):
            if name not in collections:
                collections[name] = MagicMock()
            return collections[name]

    return FakeDB()


@pytest.fixture
def app():
    """Create the FastAPI test app (imports lazily to respect env patching)."""
    with patch("src.database.connect_to_db", return_value=True):
        from src.main import app as _app
        return _app


@pytest.fixture
def client(app):
    """Return a TestClient for the FastAPI app."""
    from fastapi.testclient import TestClient
    return TestClient(app)


@pytest.fixture
def auth_headers():
    """Return headers with a valid test JWT and API key."""
    import jwt as pyjwt
    from datetime import datetime, timedelta

    token = pyjwt.encode(
        {
            "user_id": "test_user_123",
            "email": "test@hackaverse.com",
            "iat": datetime.utcnow(),
            "exp": datetime.utcnow() + timedelta(hours=1),
        },
        os.environ["JWT_SECRET"],
        algorithm="HS256",
    )
    return {
        "Authorization": f"Bearer {token}",
        "X-API-Key": os.environ["API_KEY"],
    }


@pytest.fixture
def api_key_headers():
    """Return headers with just the API key (no auth token)."""
    return {"X-API-Key": os.environ["API_KEY"]}
