# src/validation/replay_runner.py
"""
Replay validation runner — identical requests, schema stability, trace continuity.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import Any, Callable, Dict, List, Optional

from .contract_validator import (
    fingerprints_match,
    get_header,
    schema_fingerprint,
    validate_api_response_contract,
    validate_trace_continuity,
)
from .report_writer import ValidationReport
from ..replay_protection import _processed_requests, check_replay

logger = logging.getLogger("hackaverse.replay_validation")

RequestFn = Callable[[str, str, Optional[Dict[str, str]], Optional[Dict]], Any]


@dataclass
class ReplayCheckResult:
    report: ValidationReport
    logs: List[str] = field(default_factory=list)

    @property
    def passed(self) -> bool:
        return self.report.passed


class ReplayValidationRunner:
    """Execute replay-safe runtime proofs against an HTTP client adapter."""

    def __init__(self, request_fn: RequestFn, api_key: str):
        self._request = request_fn
        self._api_key = api_key
        self._logs: List[str] = []

    def _log(self, message: str) -> None:
        line = f"[REPLAY] {message}"
        self._logs.append(line)
        logger.info(message)

    def run(self) -> ReplayCheckResult:
        report = ValidationReport(title="HackaVerse Replay Validation Report")
        headers = {"X-API-Key": self._api_key}

        # ── 1. Replay identical GET /health ─────────────────────────────
        bodies: List[Dict[str, Any]] = []
        header_traces: List[str] = []
        for i in range(3):
            status, resp_headers, body = self._request("GET", "/health", headers, None)
            self._log(f"GET /health attempt {i + 1} -> HTTP {status}")
            ok, errs = validate_api_response_contract(body, response_headers=resp_headers)
            report.add(
                f"health_replay_{i + 1}_contract",
                ok and status == 200,
                "; ".join(errs) if errs else f"trace={body.get('trace_id')}",
            )
            bodies.append(body)
            header_traces.append(get_header(resp_headers, "X-Request-Id"))

        fp0 = schema_fingerprint(bodies[0])
        fp_stable = all(fingerprints_match(fp0, schema_fingerprint(b)) for b in bodies[1:])
        report.add(
            "health_schema_stable_across_replays",
            fp_stable,
            f"fingerprint={fp0}",
        )

        traces_unique = len(set(header_traces)) == 3
        report.add(
            "health_trace_ids_unique_per_request",
            traces_unique,
            f"traces={header_traces}",
        )

        # ── 2. Trace continuity (parent → child) ─────────────────────────
        parent_trace = header_traces[0]
        child_headers = {
            **headers,
            "X-Trace-Parent": parent_trace,
        }
        status, resp_headers, body = self._request(
            "GET", "/api/v1/system/health", child_headers, None
        )
        ok, errs = validate_trace_continuity(parent_trace, resp_headers, body)
        report.add(
            "trace_continuity_parent_child",
            ok and status == 200,
            "; ".join(errs)
            if errs
            else f"parent={parent_trace} child={get_header(resp_headers, 'X-Request-Id')}",
        )

        # ── 3. In-process replay store ───────────────────────────────────
        scope_key = "validation_run"
        rid = f"replay_proof_{id(self)}"
        _processed_requests.clear()
        is_new_1, msg_1 = check_replay(rid, tenant_id=scope_key, event_id="proof")
        is_new_2, msg_2 = check_replay(rid, tenant_id=scope_key, event_id="proof")
        self._log(f"check_replay first={is_new_1} second={is_new_2}")
        report.add(
            "replay_store_accepts_first_request",
            is_new_1 is True,
            msg_1,
        )
        report.add(
            "replay_store_blocks_duplicate",
            is_new_2 is False,
            msg_2,
        )

        # ── 4. Error envelope replay-safe structure ────────────────────
        status, resp_headers, body = self._request("GET", "/auth/me", headers, None)
        ok, errs = validate_api_response_contract(body, response_headers=resp_headers)
        report.add(
            "error_envelope_contract",
            ok and status == 401 and body.get("success") is False,
            "; ".join(errs) if errs else f"error_code={body.get('error_code')}",
        )

        report.log_excerpt = self._logs
        return ReplayCheckResult(report=report, logs=self._logs)
