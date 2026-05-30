"""
test_health.py — Tests for system health and root endpoints.
"""
import pytest
from unittest.mock import patch, MagicMock


class TestRootEndpoint:
    """Tests for GET /"""

    def test_root_returns_ok(self, client):
        resp = client.get("/")
        assert resp.status_code == 200
        data = resp.json()
        assert data["message"] == "HackaVerse API"
        assert data["version"] == "v5.0"
        assert data["status"] == "operational"

    def test_root_has_docs_link(self, client):
        resp = client.get("/")
        assert resp.json()["docs"] == "/docs"


class TestHealthEndpoint:
    """Tests for GET /health"""

    def test_health_returns_200(self, client):
        resp = client.get("/health")
        assert resp.status_code == 200

    def test_health_response_structure(self, client):
        resp = client.get("/health")
        data = resp.json()
        assert "success" in data
        assert "data" in data
        assert "status" in data["data"]
        assert "timestamp" in data["data"]

    @patch("src.main.DB_AVAILABLE", True)
    def test_health_connected(self, client):
        resp = client.get("/health")
        data = resp.json()
        assert data["data"]["status"] == "ok"

    @patch("src.main.DB_AVAILABLE", False)
    def test_health_degraded(self, client):
        resp = client.get("/health")
        data = resp.json()
        assert data["data"]["status"] == "degraded"


class TestDocsEndpoint:
    """Tests for API documentation endpoints."""

    def test_docs_accessible(self, client):
        resp = client.get("/docs")
        assert resp.status_code == 200

    def test_openapi_json(self, client):
        resp = client.get("/openapi.json")
        assert resp.status_code == 200
        data = resp.json()
        assert "paths" in data
        assert "info" in data
