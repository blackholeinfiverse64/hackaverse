# scripts/_http_adapter.py
"""HTTP adapters for validation scripts (in-process TestClient or live BASE_URL)."""

from __future__ import annotations

import os
import sys
from pathlib import Path
from typing import Any, Dict, Optional, Tuple

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

os.environ.setdefault("MONGODB_URI", "")
os.environ.setdefault("JWT_SECRET", "validation-secret")
os.environ.setdefault("API_KEY", os.environ.get("API_KEY", "test-api-key"))
os.environ.setdefault("ENV", "test")


def make_request_fn():
    """
    Return (request_fn, description).

    request_fn(method, path, headers, json_body) -> (status, headers_dict, body_dict)
    """
    base_url = os.environ.get("VALIDATION_BASE_URL", "").strip()

    if base_url:
        import httpx

        def _live(
            method: str,
            path: str,
            headers: Optional[Dict[str, str]],
            json_body: Optional[Dict],
        ) -> Tuple[int, Dict[str, str], Any]:
            url = f"{base_url.rstrip('/')}{path}"
            with httpx.Client(timeout=30.0) as client:
                resp = client.request(method, url, headers=headers or {}, json=json_body)
            try:
                body = resp.json()
            except Exception:
                body = {"raw": resp.text}
            return resp.status_code, dict(resp.headers), body

        return _live, f"live:{base_url}"

    from unittest.mock import patch

    from fastapi.testclient import TestClient

    with patch("src.database.connect_to_db", return_value=True):
        from src.main import app

    client = TestClient(app)

    def _inprocess(
        method: str,
        path: str,
        headers: Optional[Dict[str, str]],
        json_body: Optional[Dict],
    ) -> Tuple[int, Dict[str, str], Any]:
        resp = client.request(method, path, headers=headers or {}, json=json_body)
        try:
            body = resp.json()
        except Exception:
            body = {"raw": resp.text}
        return resp.status_code, dict(resp.headers), body

    return _inprocess, "in-process:TestClient"
