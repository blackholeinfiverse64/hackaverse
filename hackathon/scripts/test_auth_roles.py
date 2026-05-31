#!/usr/bin/env python3
"""Smoke-test login for seeded roles. Requires MONGODB_URI in env."""
import asyncio
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / ".env", override=False)

from src.database import connect_to_db
from src.routes.auth_routes import login, LoginRequest


class _RawRequest:
    client = type("C", (), {"host": "127.0.0.1"})()


async def main():
    if not connect_to_db():
        print("FAIL: database not connected")
        return
    import os
    import sys
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    from seed_creds_helper import get_seed_password

    for email, expected in [
        ("admin@hackaverse.com", "admin"),
        ("judge@hackaverse.com", "judge"),
        ("participant@hackaverse.com", "participant"),
    ]:
        pwd = get_seed_password(expected)
        if not pwd:
            print(f"{email}: FAIL — set SEED_{expected.upper()}_PASSWORD or run seed_data.py")
            continue
        resp = await login(LoginRequest(email=email, password=pwd), _RawRequest())
        user = resp.data["user"]
        ok = user["role"] == expected and bool(resp.data.get("access_token"))
        print(f"{email}: role={user['role']} expected={expected} token={'yes' if resp.data.get('access_token') else 'no'} {'PASS' if ok else 'FAIL'}")


if __name__ == "__main__":
    asyncio.run(main())
