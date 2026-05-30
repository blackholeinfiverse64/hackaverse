"""
Integration tests for replay and consumer runtime validation runners.
"""
import json
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

from src.replay_protection import _processed_requests, check_replay
from src.validation.contract_validator import (
    validate_api_response_contract,
    validate_trace_continuity,
    schema_fingerprint,
    fingerprints_match,
)
from src.validation.replay_runner import ReplayValidationRunner
from src.validation.consumer_simulator import ConsumerValidationRunner


@pytest.fixture
def request_fn(client):
    """Adapt TestClient to validation runner signature."""

    def _fn(method, path, headers=None, json_body=None):
        resp = client.request(method, path, headers=headers or {}, json=json_body)
        try:
            body = resp.json()
        except Exception:
            body = {}
        return resp.status_code, dict(resp.headers), body

    return _fn


@pytest.fixture(autouse=True)
def clear_replay_store():
    _processed_requests.clear()
    yield
    _processed_requests.clear()


class TestContractValidator:
    def test_valid_envelope(self):
        body = {
            "success": True,
            "message": "ok",
            "data": {"status": "ok"},
            "trace_id": "hv-0123456789abcdef",
            "error_code": None,
        }
        headers = {"X-Request-Id": "hv-0123456789abcdef"}
        ok, errs = validate_api_response_contract(body, response_headers=headers)
        assert ok, errs

    def test_invalid_trace_rejected(self):
        body = {
            "success": True,
            "message": "ok",
            "data": None,
            "trace_id": "bad-trace",
            "error_code": None,
        }
        ok, errs = validate_api_response_contract(body)
        assert not ok


class TestReplayValidationRunner:
    def test_replay_runner_passes_in_process(self, request_fn):
        import os

        runner = ReplayValidationRunner(request_fn, os.environ["API_KEY"])
        result = runner.run()
        assert result.passed, [
            (c.name, c.detail) for c in result.report.checks if not c.passed
        ]

    def test_check_replay_blocks_duplicate(self):
        rid = "integration_test_replay_001"
        assert check_replay(rid, tenant_id="test", event_id="evt")[0] is True
        assert check_replay(rid, tenant_id="test", event_id="evt")[0] is False


class TestConsumerValidationRunner:
    def test_consumer_runner_passes_in_process(self, request_fn):
        import os

        contract = (
            Path(__file__).resolve().parent.parent.parent
            / "docs"
            / "contracts"
            / "api_response_contract.json"
        )
        runner = ConsumerValidationRunner(
            request_fn,
            os.environ["API_KEY"],
            contract_path=contract if contract.exists() else None,
        )
        result = runner.run()
        assert result.passed, [
            (c.name, c.detail) for c in result.report.checks if not c.passed
        ]

    def test_trace_continuity_via_client(self, client, api_key_headers):
        first = client.get("/health", headers=api_key_headers)
        parent = first.headers["X-Request-Id"]
        second = client.get(
            "/api/v1/system/health",
            headers={**api_key_headers, "X-Trace-Parent": parent},
        )
        ok, errs = validate_trace_continuity(
            parent, dict(second.headers), second.json()
        )
        assert ok, errs


class TestBatchReplayHttp:
    """HTTP-level proof that identical batch payloads are replay-blocked."""

    @patch("src.judging.multi_agent_judge.evaluate_batch_submissions")
    @patch("src.routes.judge.get_db")
    def test_identical_batch_returns_409_on_replay(
        self, mock_get_db, mock_eval, client, api_key_headers
    ):
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        mock_eval.return_value = [
            {"team_id": "t1", "consensus_score": 80, "criteria_scores": {}}
        ]

        payload = {
            "submissions": [
                {"submission_text": "demo submission A", "team_id": "t1", "request_id": "r1"},
                {"submission_text": "demo submission B", "team_id": "t2", "request_id": "r2"},
            ],
            "tenant_id": "validation",
            "event_id": "batch_replay_test",
        }

        first = client.post(
            "/api/v1/judge/batch",
            json=payload,
            headers=api_key_headers,
        )
        assert first.status_code == 200

        second = client.post(
            "/api/v1/judge/batch",
            json=payload,
            headers=api_key_headers,
        )
        assert second.status_code == 409
        body = second.json()
        ok, _ = validate_api_response_contract(body, response_headers=dict(second.headers))
        assert ok
        assert body.get("trace_id")
        assert body.get("success") is False


class TestValidationScripts:
    def test_scripts_generate_reports(self, tmp_path, monkeypatch, request_fn):
        import os
        from src.validation.replay_runner import ReplayValidationRunner
        from src.validation.consumer_simulator import ConsumerValidationRunner
        from src.validation.report_writer import ValidationReport

        replay_report = tmp_path / "replay.md"
        consumer_report = tmp_path / "consumer.md"

        replay = ReplayValidationRunner(request_fn, os.environ["API_KEY"]).run()
        replay.report.write(replay_report)
        assert replay_report.exists()
        assert "Replay Validation" in replay_report.read_text(encoding="utf-8")

        consumer = ConsumerValidationRunner(request_fn, os.environ["API_KEY"]).run()
        consumer.report.write(consumer_report)
        assert consumer_report.exists()
