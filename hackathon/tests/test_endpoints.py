"""
test_endpoints.py — Tests for core API endpoints.
Covers: hackathons, teams, submissions, notifications, webhooks, CSRF, API versioning.
"""
import os
import pytest
from unittest.mock import patch, MagicMock
from datetime import datetime


class TestAPIVersioning:
    """Verify that /api/v1/ prefix routes work alongside unversioned routes."""

    def test_versioned_root(self, client):
        """Root endpoint is always unversioned."""
        resp = client.get("/")
        assert resp.status_code == 200
        assert resp.json()["version"] == "v5.0"

    def test_versioned_health(self, client):
        """Health should be accessible at /health (unversioned)."""
        resp = client.get("/health")
        assert resp.status_code == 200
        data = resp.json()
        assert "success" in data

    def test_openapi_includes_v1_paths(self, client):
        """OpenAPI spec should include /api/v1/ prefixed paths."""
        resp = client.get("/openapi.json")
        assert resp.status_code == 200
        paths = resp.json().get("paths", {})
        v1_paths = [p for p in paths if p.startswith("/api/v1")]
        assert len(v1_paths) > 0, "No /api/v1/ paths found in OpenAPI spec"


class TestCSRFEndpoint:
    """Tests for GET /csrf-token"""

    def test_csrf_token_generated(self, client):
        resp = client.get("/csrf-token")
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True
        assert "csrf_token" in data["data"]
        # Should set cookie
        assert "csrf_token" in resp.cookies


class TestHackathonEndpoints:
    """Tests for hackathon CRUD endpoints."""

    def test_active_hackathons_pagination(self, client, api_key_headers):
        """Active hackathons should accept page/limit params."""
        with patch("src.routes.hackathons.get_db") as mock_get_db:
            mock_db = MagicMock()
            mock_collection = MagicMock()
            mock_collection.count_documents.return_value = 0
            mock_cursor = MagicMock()
            mock_cursor.skip.return_value = mock_cursor
            mock_cursor.limit.return_value = mock_cursor
            mock_cursor.__iter__ = MagicMock(return_value=iter([]))
            mock_collection.find.return_value = mock_cursor
            mock_db.__getitem__ = MagicMock(return_value=mock_collection)
            mock_get_db.return_value = mock_db

            resp = client.get(
                "/hackathons/active?page=1&limit=10",
                headers=api_key_headers,
            )
            assert resp.status_code == 200
            data = resp.json()
            assert data["success"] is True
            inner = data["data"]
            assert "pagination" in inner
            assert inner["pagination"]["page"] == 1
            assert inner["pagination"]["limit"] == 10

    def test_create_hackathon(self, client, api_key_headers):
        """Should create a hackathon."""
        with patch("src.routes.hackathons.get_db") as mock_get_db:
            mock_db = MagicMock()
            mock_collection = MagicMock()
            mock_collection.insert_one.return_value = MagicMock(inserted_id="test_id")
            mock_db.__getitem__ = MagicMock(return_value=mock_collection)
            mock_get_db.return_value = mock_db

            resp = client.post(
                "/hackathons",
                json={
                    "name": "Test Hackathon",
                    "description": "A test hackathon",
                    "start_date": "2025-09-01",
                    "end_date": "2025-09-02",
                    "min_team_size": 1,
                    "max_team_size": 5,
                },
                headers=api_key_headers,
            )
            assert resp.status_code == 200
            data = resp.json()
            assert data["success"] is True


class TestNotificationEndpoints:
    """Tests for notification endpoints."""

    def test_announcements_pagination(self, client, api_key_headers):
        """Announcements should support pagination."""
        with patch("src.routes.notifications.get_db") as mock_get_db:
            mock_db = MagicMock()
            mock_collection = MagicMock()
            mock_collection.count_documents.return_value = 0
            mock_cursor = MagicMock()
            mock_cursor.sort.return_value = mock_cursor
            mock_cursor.skip.return_value = mock_cursor
            mock_cursor.limit.return_value = mock_cursor
            mock_cursor.__iter__ = MagicMock(return_value=iter([]))
            mock_collection.find.return_value = mock_cursor
            mock_db.__getitem__ = MagicMock(return_value=mock_collection)
            mock_get_db.return_value = mock_db

            resp = client.get(
                "/notifications/announcements?page=1&limit=5",
                headers=api_key_headers,
            )
            assert resp.status_code == 200
            data = resp.json()
            assert data["success"] is True
            assert "pagination" in data["data"]


class TestWebhookEndpoints:
    """Tests for webhook event system."""

    def test_subscribe_requires_api_key(self, client):
        resp = client.post(
            "/webhooks/subscribe",
            json={"url": "https://example.com/hook", "events": ["team.created"]},
        )
        assert resp.status_code == 401

    def test_subscribe_validates_events(self, client, api_key_headers):
        """Should reject invalid event types."""
        with patch("src.routes.webhooks.get_db") as mock_get_db:
            mock_get_db.return_value = MagicMock()
            resp = client.post(
                "/webhooks/subscribe",
                json={"url": "https://example.com/hook", "events": ["invalid.event"]},
                headers=api_key_headers,
            )
            assert resp.status_code == 400

    def test_subscribe_success(self, client, api_key_headers):
        """Should create webhook subscription."""
        with patch("src.routes.webhooks.get_db") as mock_get_db:
            mock_db = MagicMock()
            mock_collection = MagicMock()
            mock_db.__getitem__ = MagicMock(return_value=mock_collection)
            mock_get_db.return_value = mock_db

            resp = client.post(
                "/webhooks/subscribe",
                json={
                    "url": "https://tantra.example.com/hook",
                    "events": ["submission.scored", "team.created"],
                    "secret": "test-secret",
                },
                headers=api_key_headers,
            )
            assert resp.status_code == 200
            data = resp.json()
            assert data["success"] is True
            assert "webhook_id" in data["data"]

    def test_list_webhooks(self, client, api_key_headers):
        """Should list webhook subscriptions."""
        with patch("src.routes.webhooks.get_db") as mock_get_db:
            mock_db = MagicMock()
            mock_collection = MagicMock()
            mock_collection.find.return_value = []
            mock_db.__getitem__ = MagicMock(return_value=mock_collection)
            mock_get_db.return_value = mock_db

            resp = client.get("/webhooks", headers=api_key_headers)
            assert resp.status_code == 200
            data = resp.json()
            assert data["success"] is True


class TestCORSHeaders:
    """Verify CORS headers are set correctly."""

    def test_cors_allows_options(self, client):
        """OPTIONS requests should be handled."""
        resp = client.options(
            "/health",
            headers={"Origin": "http://localhost:5173", "Access-Control-Request-Method": "GET"},
        )
        # Should not be 405
        assert resp.status_code in (200, 204, 400)


class TestResponseConsistency:
    """All endpoints should return consistent APIResponse format."""

    def test_health_has_standard_format(self, client):
        resp = client.get("/health")
        data = resp.json()
        assert "success" in data
        assert "message" in data
        assert "data" in data

    def test_root_has_message(self, client):
        resp = client.get("/")
        data = resp.json()
        assert "message" in data
        assert "version" in data
