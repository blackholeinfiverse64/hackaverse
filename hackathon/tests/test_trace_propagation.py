"""
test_trace_propagation.py — Integration tests for deterministic trace propagation.

Verifies that TraceIdMiddleware:
  - generates hv-* trace ids
  - attaches trace_id to request.state (via response body/header alignment)
  - returns X-Request-Id response header
  - propagates trace_id into APIResponse bodies
  - preserves parent trace lineage from X-Trace-Parent
  - includes trace_id in structured error responses
"""
import json
import re

import pytest

from src.observability.trace_context import TRACE_ID_HEADER, TRACE_ID_PATTERN


TRACE_RE = re.compile(r"^hv-[0-9a-f]{16}$")


class TestTraceHeaderPropagation:
    """Trace id must appear on every HTTP response header."""

    def test_health_returns_x_request_id_header(self, client):
        resp = client.get("/health")
        assert resp.status_code == 200
        assert TRACE_ID_HEADER in resp.headers
        assert TRACE_RE.match(resp.headers[TRACE_ID_HEADER])

    def test_versioned_system_health_returns_header(self, client):
        resp = client.get("/api/v1/system/health")
        assert resp.status_code == 200
        assert TRACE_RE.match(resp.headers[TRACE_ID_HEADER])

    def test_root_returns_x_request_id_header(self, client):
        resp = client.get("/")
        assert resp.status_code == 200
        assert TRACE_RE.match(resp.headers[TRACE_ID_HEADER])


class TestTraceBodyPropagation:
    """APIResponse bodies must carry the same trace_id as the response header."""

    def test_health_body_trace_matches_header(self, client):
        resp = client.get("/health")
        body = resp.json()
        header_trace = resp.headers[TRACE_ID_HEADER]

        assert "trace_id" in body
        assert body["trace_id"] == header_trace
        assert TRACE_RE.match(body["trace_id"])

    def test_system_health_body_trace_matches_header(self, client):
        resp = client.get("/api/v1/system/health")
        body = resp.json()
        assert body["trace_id"] == resp.headers[TRACE_ID_HEADER]

    def test_trace_ids_are_unique_per_request(self, client):
        first = client.get("/health")
        second = client.get("/health")
        assert first.headers[TRACE_ID_HEADER] != second.headers[TRACE_ID_HEADER]


class TestParentTracePropagation:
    """Upstream X-Trace-Parent must be captured without replacing request trace."""

    def test_parent_trace_accepted_without_reuse(self, client):
        parent = "hv-abcdef0123456789"
        resp = client.get(
            "/health",
            headers={"X-Trace-Parent": parent},
        )
        child = resp.headers[TRACE_ID_HEADER]
        assert child != parent
        assert TRACE_RE.match(child)
        assert resp.json()["trace_id"] == child


class TestTraceErrorPropagation:
    """Error envelopes must include the request trace_id."""

    def test_validation_error_includes_trace_id(self, client, api_key_headers):
        resp = client.post(
            "/auth/register",
            json={"name": "Bad"},
            headers=api_key_headers,
        )
        assert resp.status_code in (400, 422)
        body = resp.json()
        assert "trace_id" in body
        assert body["trace_id"] == resp.headers[TRACE_ID_HEADER]
        assert TRACE_RE.match(body["trace_id"])

    def test_unauthorized_includes_trace_id(self, client):
        resp = client.get("/auth/me")
        assert resp.status_code == 401
        body = resp.json()
        assert body["trace_id"] == resp.headers[TRACE_ID_HEADER]


class TestTraceStructuredLogging:
    """Correlation logger emits JSON with trace_id for non-quiet routes."""

    def test_structured_log_contains_trace_id(self, client, api_key_headers, caplog):
        import logging
        from unittest.mock import MagicMock, patch

        caplog.set_level(logging.INFO, logger="hackaverse.correlation")

        mock_db = MagicMock()
        mock_collection = MagicMock()
        mock_collection.count_documents.return_value = 0
        mock_cursor = MagicMock()
        mock_cursor.skip.return_value = mock_cursor
        mock_cursor.limit.return_value = mock_cursor
        mock_cursor.__iter__ = MagicMock(return_value=iter([]))
        mock_collection.find.return_value = mock_cursor
        mock_db.__getitem__ = MagicMock(return_value=mock_collection)

        with patch("src.routes.hackathons.get_db", return_value=mock_db):
            resp = client.get(
                "/hackathons/active?page=1&limit=5",
                headers=api_key_headers,
            )

        assert resp.status_code == 200
        trace_id = resp.headers[TRACE_ID_HEADER]

        log_records = [
            json.loads(record.message)
            for record in caplog.records
            if record.name == "hackaverse.correlation"
        ]
        assert log_records, "Expected structured correlation logs"
        assert any(entry.get("trace_id") == trace_id for entry in log_records)
        assert any(entry.get("event_type") == "request_started" for entry in log_records)
        assert any(entry.get("event_type") == "request_completed" for entry in log_records)


class TestTraceContextHelpers:
    """Unit checks for trace context utilities."""

    def test_generate_trace_id_format(self):
        from src.observability.trace_context import generate_trace_id

        trace_id = generate_trace_id()
        assert TRACE_ID_PATTERN.match(trace_id)

    def test_api_response_from_request(self):
        from unittest.mock import MagicMock

        from src.observability.trace_context import set_trace_id, reset_trace_id
        from src.schemas.response import APIResponse

        request = MagicMock()
        request.state.trace_id = "hv-0123456789abcdef"

        token = set_trace_id(request.state.trace_id)
        try:
            response = APIResponse.from_request(
                request,
                success=True,
                message="ok",
                data={"x": 1},
            )
        finally:
            reset_trace_id(token)

        assert response.trace_id == "hv-0123456789abcdef"
