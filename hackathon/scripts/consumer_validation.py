#!/usr/bin/env python3
"""
HackaVerse downstream consumer validation — ecosystem participation proof.

Simulates a TANTRA-style consumer: polls health, chains trace lineage,
validates APIResponse contracts, and registers a webhook subscription.

Usage (from hackathon/):
  python scripts/consumer_validation.py
"""

from __future__ import annotations

import logging
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from scripts._http_adapter import make_request_fn  # noqa: E402
from src.validation.consumer_simulator import ConsumerValidationRunner  # noqa: E402

REPORT_PATH = ROOT / "reports" / "consumer_validation_report.md"
LOG_PATH = ROOT / "reports" / "logs" / "consumer_validation.log"
CONTRACT_PATH = ROOT.parent / "docs" / "contracts" / "api_response_contract.json"


def _configure_logging() -> None:
    LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s | %(levelname)s | %(message)s",
        handlers=[
            logging.StreamHandler(sys.stdout),
            logging.FileHandler(LOG_PATH, encoding="utf-8"),
        ],
    )


def main() -> int:
    _configure_logging()
    import os

    request_fn, mode = make_request_fn()
    api_key = os.environ.get("API_KEY", "test-api-key")

    print("=" * 72)
    print("HackaVerse Consumer Validation (ecosystem simulation)")
    print(f"Mode: {mode}")
    print(f"Report: {REPORT_PATH}")
    print("=" * 72)

    runner = ConsumerValidationRunner(
        request_fn,
        api_key,
        contract_path=CONTRACT_PATH if CONTRACT_PATH.exists() else None,
    )
    result = runner.run()
    result.report.write(REPORT_PATH)

    for line in result.logs:
        print(line)

    print("-" * 72)
    for check in result.report.checks:
        mark = "PASS" if check.passed else "FAIL"
        print(f"  [{mark}] {check.name}: {check.detail}")
    print("-" * 72)
    print(f"OVERALL: {'PASS' if result.passed else 'FAIL'}")
    print(f"Markdown report written to {REPORT_PATH}")

    return 0 if result.passed else 1


if __name__ == "__main__":
    raise SystemExit(main())
