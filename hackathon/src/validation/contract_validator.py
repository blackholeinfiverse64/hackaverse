# src/validation/contract_validator.py
"""
API contract and trace continuity validators (TANTRA / api_response_contract.json).
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional, Tuple

from ..observability.trace_context import TRACE_ID_HEADER, TRACE_ID_PATTERN

REQUIRED_ENVELOPE_KEYS = frozenset({"success", "message", "data", "trace_id", "error_code"})


def get_header(headers: Dict[str, str], name: str) -> str:
    """Case-insensitive header lookup (TestClient uses lowercase keys)."""
    target = name.lower()
    for key, value in headers.items():
        if key.lower() == target:
            return value
    return ""


def validate_api_response_contract(
    body: Any,
    *,
    response_headers: Optional[Dict[str, str]] = None,
    require_header_match: bool = True,
) -> Tuple[bool, List[str]]:
    """
    Validate a JSON body against the canonical APIResponse envelope.

    Returns (passed, list of failure messages).
    """
    failures: List[str] = []

    if not isinstance(body, dict):
        return False, ["Response body is not a JSON object"]

    missing = REQUIRED_ENVELOPE_KEYS - set(body.keys())
    if missing:
        failures.append(f"Missing envelope keys: {sorted(missing)}")

    if "success" in body and not isinstance(body["success"], bool):
        failures.append("'success' must be boolean")

    if "message" in body and not isinstance(body["message"], str):
        failures.append("'message' must be string")

    if "trace_id" in body:
        trace_id = body["trace_id"]
        if not isinstance(trace_id, str) or not TRACE_ID_PATTERN.match(trace_id):
            failures.append(f"Invalid trace_id format: {trace_id!r}")

    if "error_code" in body and body["error_code"] is not None:
        if not isinstance(body["error_code"], str):
            failures.append("'error_code' must be string or null")

    if body.get("success") is True and body.get("error_code") not in (None, ""):
        # Allow null only on success
        if body.get("error_code"):
            failures.append("Success response should have error_code null")

    if body.get("success") is False:
        if not body.get("error_code"):
            failures.append("Error response should include error_code")

    if require_header_match and response_headers:
        header_trace = get_header(response_headers, TRACE_ID_HEADER)
        body_trace = body.get("trace_id")
        if header_trace and body_trace and header_trace != body_trace:
            failures.append(
                f"Header/body trace mismatch: {TRACE_ID_HEADER}={header_trace!r} "
                f"body.trace_id={body_trace!r}"
            )

    return len(failures) == 0, failures


def validate_trace_continuity(
    parent_trace: str,
    child_headers: Dict[str, str],
    child_body: Dict[str, Any],
) -> Tuple[bool, List[str]]:
    """
    Validate downstream call: child trace is new; parent was accepted (lineage).
    """
    failures: List[str] = []
    child_trace = get_header(child_headers, TRACE_ID_HEADER) or child_body.get("trace_id")

    if not child_trace or not TRACE_ID_PATTERN.match(str(child_trace)):
        failures.append("Child response missing valid trace_id")

    if parent_trace == child_trace:
        failures.append("Child trace_id must not equal parent (server generates new trace)")

    if not TRACE_ID_PATTERN.match(parent_trace):
        failures.append(f"Invalid parent trace format: {parent_trace!r}")

    return len(failures) == 0, failures


def schema_fingerprint(body: Dict[str, Any]) -> Dict[str, str]:
    """Deterministic structural fingerprint (ignores volatile trace_id values)."""
    def _type_label(value: Any) -> str:
        if value is None:
            return "null"
        if isinstance(value, bool):
            return "bool"
        if isinstance(value, (int, float)):
            return "number"
        if isinstance(value, str):
            return "string"
        if isinstance(value, list):
            return "array"
        if isinstance(value, dict):
            return "object"
        return type(value).__name__

    fp: Dict[str, str] = {}
    for key in sorted(body.keys()):
        if key == "trace_id":
            fp[key] = "string:hv-*"
        else:
            fp[key] = _type_label(body[key])
    if isinstance(body.get("data"), dict):
        for key in sorted(body["data"].keys()):
            fp[f"data.{key}"] = _type_label(body["data"][key])
    return fp


def fingerprints_match(a: Dict[str, str], b: Dict[str, str]) -> bool:
    return a == b
