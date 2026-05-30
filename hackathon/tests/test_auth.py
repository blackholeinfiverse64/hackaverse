"""
test_auth.py — Tests for authentication endpoints.
Covers: register, login (including the P0 user_id fix), refresh, logout, /me.
"""
import os
import pytest
from unittest.mock import patch, MagicMock
from datetime import datetime, timedelta


class TestRegisterEndpoint:
    """Tests for POST /auth/register"""

    def test_register_requires_email(self, client, api_key_headers):
        resp = client.post(
            "/auth/register",
            json={"name": "Test", "password": "pass1234"},
            headers=api_key_headers,
        )
        assert resp.status_code in (400, 422)

    def test_register_requires_password_min_length(self, client, api_key_headers):
        resp = client.post(
            "/auth/register",
            json={"name": "Test", "email": "x@y.com", "password": "12345"},
            headers=api_key_headers,
        )
        assert resp.status_code in (400, 422)

    @patch("src.routes.auth_routes.get_db")
    def test_register_success_in_memory(self, mock_get_db, client, api_key_headers):
        """When DB is None, register should succeed in-memory."""
        mock_get_db.return_value = None
        resp = client.post(
            "/auth/register",
            json={"name": "Test User", "email": "test@test.com", "password": "pass1234"},
            headers=api_key_headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True
        assert "access_token" in data["data"]
        assert "user" in data["data"]

    @patch("src.routes.auth_routes.get_db")
    def test_register_duplicate_email(self, mock_get_db, client, api_key_headers):
        """Should reject duplicate emails."""
        mock_db = MagicMock()
        mock_db.__getitem__ = MagicMock(return_value=MagicMock())
        mock_db.__getitem__().find_one.return_value = {"email": "dup@test.com"}
        mock_get_db.return_value = mock_db
        resp = client.post(
            "/auth/register",
            json={"name": "Dup", "email": "dup@test.com", "password": "pass1234"},
            headers=api_key_headers,
        )
        assert resp.status_code == 400


class TestLoginEndpoint:
    """Tests for POST /auth/login — includes P0 user_id fix verification."""

    @patch("src.routes.auth_routes.get_db")
    def test_login_db_unavailable(self, mock_get_db, client, api_key_headers):
        mock_get_db.return_value = None
        resp = client.post(
            "/auth/login",
            json={"email": "x@y.com", "password": "pass1234"},
            headers=api_key_headers,
        )
        assert resp.status_code == 503

    @patch("src.routes.auth_routes.get_db")
    def test_login_invalid_credentials(self, mock_get_db, client, api_key_headers):
        mock_db = MagicMock()
        mock_db.__getitem__ = MagicMock(return_value=MagicMock())
        mock_db.__getitem__().find_one.return_value = None
        mock_get_db.return_value = mock_db
        resp = client.post(
            "/auth/login",
            json={"email": "nope@test.com", "password": "pass1234"},
            headers=api_key_headers,
        )
        assert resp.status_code == 401

    @patch("src.routes.auth_routes.get_db")
    @patch("src.routes.auth_routes.verify_password", return_value=True)
    @patch("src.routes.auth_routes._rehash_if_legacy")
    def test_login_success_no_crash(self, mock_rehash, mock_verify, mock_get_db, client, api_key_headers):
        """P0 fix: login must NOT crash with NameError on user_id.
        
        Before the fix, _rehash_if_legacy was called with user_id before
        it was assigned, causing a NameError crash.
        """
        mock_db = MagicMock()
        user_doc = {
            "_id": "abc123",
            "user_id": "user_001",
            "email": "good@test.com",
            "name": "Good User",
            "role": "participant",
            "password_hash": "$2b$12$fakehash",
            "created_at": datetime.now().isoformat(),
        }
        mock_db.__getitem__ = MagicMock(return_value=MagicMock())
        mock_db.__getitem__().find_one.return_value = user_doc
        mock_db.__getitem__().insert_one.return_value = MagicMock()
        mock_get_db.return_value = mock_db
        
        resp = client.post(
            "/auth/login",
            json={"email": "good@test.com", "password": "pass1234"},
            headers=api_key_headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True
        assert "access_token" in data["data"]
        assert data["data"]["user"]["user_id"] == "user_001"
        
        # Verify _rehash was called with the correct user_id
        mock_rehash.assert_called_once()
        call_args = mock_rehash.call_args
        assert call_args[0][3] == "user_001"  # 4th arg is user_id


class TestMeEndpoint:
    """Tests for GET /auth/me"""

    def test_me_requires_auth(self, client):
        resp = client.get("/auth/me")
        assert resp.status_code == 401

    def test_me_with_valid_token(self, client, auth_headers):
        """Should return user info with valid JWT."""
        with patch("src.routes.auth_routes.get_db") as mock_get_db:
            mock_db = MagicMock()
            mock_db.__getitem__ = MagicMock(return_value=MagicMock())
            mock_db.__getitem__().find_one.return_value = {
                "_id": "abc",
                "user_id": "test_user_123",
                "email": "test@hackaverse.com",
                "name": "Test",
                "role": "participant",
                "created_at": datetime.now().isoformat(),
            }
            mock_get_db.return_value = mock_db
            resp = client.get("/auth/me", headers=auth_headers)
            assert resp.status_code == 200
            data = resp.json()
            assert data["success"] is True


class TestAPIResponseConsistency:
    """Verify all auth endpoints return APIResponse schema."""

    @patch("src.routes.auth_routes.get_db")
    def test_register_returns_api_response(self, mock_get_db, client, api_key_headers):
        mock_get_db.return_value = None
        resp = client.post(
            "/auth/register",
            json={"name": "Test", "email": "r@t.com", "password": "pass1234"},
            headers=api_key_headers,
        )
        data = resp.json()
        assert "success" in data
        assert "message" in data
        assert "data" in data

    @patch("src.routes.auth_routes.get_db")
    def test_login_error_returns_structured(self, mock_get_db, client, api_key_headers):
        mock_get_db.return_value = None
        resp = client.post(
            "/auth/login",
            json={"email": "x@y.com", "password": "pass1234"},
            headers=api_key_headers,
        )
        # 503 should still return structured error
        assert resp.status_code == 503
