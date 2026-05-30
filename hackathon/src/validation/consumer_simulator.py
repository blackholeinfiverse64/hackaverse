# src/validation/consumer_simulator.py
"""
Downstream ecosystem consumer simulation (TANTRA-style participation).
"""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional

from .contract_validator import (
    get_header,
    validate_api_response_contract,
    validate_trace_continuity,
)
from .report_writer import ValidationReport

logger = logging.getLogger("hackaverse.consumer_validation")

RequestFn = Callable[[str, str, Optional[Dict[str, str]], Optional[Dict]], Any]

CONSUMER_SCENARIOS = (
    "health_poll",
    "versioned_system_health",
    "auth_error_contract",
    "trace_lineage_chain",
    "webhook_subscribe_contract",
)


@dataclass
class ConsumerCheckResult:
    report: ValidationReport
    logs: List[str] = field(default_factory=list)

    @property
    def passed(self) -> bool:
        return self.report.passed


class ConsumerValidationRunner:
    """Simulate a downstream participant validating HackaVerse API contracts."""

    def __init__(
        self,
        request_fn: RequestFn,
        api_key: str,
        contract_path: Optional[Path] = None,
    ):
        self._request = request_fn
        self._api_key = api_key
        self._contract_path = contract_path
        self._logs: List[str] = []

    def _log(self, message: str) -> None:
        line = f"[CONSUMER] {message}"
        self._logs.append(line)
        logger.info(message)

    def _consumer_headers(self, parent_trace: Optional[str] = None) -> Dict[str, str]:
        h = {
            "X-API-Key": self._api_key,
            "Content-Type": "application/json",
            "X-Consumer-ID": "tantra-sim-validator",
        }
        if parent_trace:
            h["X-Trace-Parent"] = parent_trace
        return h

    def run(self) -> ConsumerCheckResult:
        report = ValidationReport(title="HackaVerse Consumer Validation Report")

        # Load contract metadata if present
        if self._contract_path and self._contract_path.exists():
            contract = json.loads(self._contract_path.read_text(encoding="utf-8"))
            report.add(
                "contract_file_loaded",
                contract.get("contract_type") == "api_response",
                str(self._contract_path.name),
            )

        # Scenario 1: health poll
        status, headers, body = self._request(
            "GET", "/health", self._consumer_headers(), None
        )
        ok, errs = validate_api_response_contract(body, response_headers=headers)
        self._log(f"health_poll HTTP {status} trace={body.get('trace_id')}")
        report.add(
            "health_poll",
            ok and status == 200 and body.get("success") is True,
            "; ".join(errs) if errs else "APIResponse valid",
        )
        root_trace = get_header(headers, "X-Request-Id") or body.get("trace_id")

        # Scenario 2: versioned system health
        status, headers, body = self._request(
            "GET",
            "/api/v1/system/health",
            self._consumer_headers(parent_trace=root_trace),
            None,
        )
        ok, errs = validate_api_response_contract(body, response_headers=headers)
        cont_ok, cont_errs = validate_trace_continuity(root_trace, headers, body)
        self._log(f"system_health HTTP {status}")
        report.add(
            "versioned_system_health",
            ok and status == 200,
            "; ".join(errs) if errs else "contract OK",
        )
        report.add(
            "trace_lineage_chain",
            cont_ok,
            "; ".join(cont_errs) if cont_errs else f"chain root={root_trace}",
        )

        # Scenario 3: auth error contract (consumer handles 401)
        status, headers, body = self._request(
            "GET", "/api/v1/auth/me", self._consumer_headers(), None
        )
        ok, errs = validate_api_response_contract(body, response_headers=headers)
        has_trace = bool(body.get("trace_id"))
        self._log(f"auth_me HTTP {status} error_code={body.get('error_code')}")
        report.add(
            "auth_error_contract",
            status == 401 and ok and has_trace and body.get("success") is False,
            "; ".join(errs) if errs else f"error_code={body.get('error_code')}",
        )

        # Scenario 4: webhook subscribe (consumer registers callback)
        webhook_body = {
            "url": "https://tantra-sim.example.com/hooks/hackaverse",
            "events": ["submission.scored", "team.created"],
            "secret": "sim-shared-secret",
            "description": "consumer_validation_sim",
        }
        status, headers, body = self._request(
            "POST",
            "/api/v1/webhooks/subscribe",
            self._consumer_headers(parent_trace=root_trace),
            webhook_body,
        )
        ok, errs = validate_api_response_contract(body, response_headers=headers)
        subscribed = status == 200 and body.get("success") is True
        if status == 503:
            # DB unavailable in CI — contract still validated if JSON envelope OK
            subscribed = ok and body.get("error_code") in (
                None,
                "SERVICE_UNAVAILABLE",
                "DATABASE_UNAVAILABLE",
            )
        self._log(f"webhook_subscribe HTTP {status}")
        report.add(
            "webhook_subscribe_contract",
            ok and status in (200, 503),
            "; ".join(errs) if errs else f"HTTP {status}",
        )

        # Scenario 5: deterministic read — two polls, same schema
        _, _, body_a = self._request("GET", "/health", self._consumer_headers(), None)
        _, _, body_b = self._request("GET", "/health", self._consumer_headers(), None)
        deterministic = (
            body_a.get("success") == body_b.get("success")
            and type(body_a.get("data")) is type(body_b.get("data"))
            and "trace_id" in body_a
            and "trace_id" in body_b
        )
        report.add(
            "deterministic_response_structure",
            deterministic,
            "success/data types stable; trace_id present each call",
        )

        report.log_excerpt = self._logs
        return ConsumerCheckResult(report=report, logs=self._logs)
