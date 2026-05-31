#!/usr/bin/env python3
"""Stage 1 revalidation against live .env configuration."""
import os
import sys
from pathlib import Path

# Load .env before app imports
from dotenv import load_dotenv
load_dotenv(Path(__file__).resolve().parent.parent / ".env", override=True)

os.environ.setdefault("PYTHONIOENCODING", "utf-8")

RESULTS = []


def record(name, status, detail=""):
    RESULTS.append({"name": name, "status": status, "detail": detail})
    icon = "PASS" if status == "PASS" else ("FAIL" if status == "FAIL" else "WARN")
    print(f"[{icon}] {name}" + (f" — {detail}" if detail else ""))


def main():
    print("=" * 72)
    print("STAGE 1 REVALIDATION")
    print("=" * 72)

    uri = os.getenv("MONGODB_URI", "")
    groq = os.getenv("GROQ_API_KEY", "")
    db_name = os.getenv("BUCKET_DB_NAME", "hackaverse_db")

    record("MONGODB_URI set", "PASS" if uri else "FAIL", "from .env" if uri else "missing")
    record("GROQ_API_KEY set", "PASS" if groq else "FAIL", "from .env" if groq else "missing")
    record("BUCKET_DB_NAME", "PASS" if db_name == "hackaverse_db" else "WARN", db_name)

    # --- Database ---
    from pymongo import MongoClient
    try:
        client = MongoClient(uri, serverSelectionTimeoutMS=10000)
        client.admin.command("ping")
        db = client[db_name]
        record("MongoDB ping", "PASS", f"database={db_name}")
    except Exception as e:
        record("MongoDB ping", "FAIL", str(e))
        client = None
        db = None

    if db is not None:
        cols = db.list_collection_names()
        record("Collections exist", "PASS" if "users" in cols else "WARN", f"{len(cols)} collections")
        for role, email in [
            ("admin", "admin@hackaverse.com"),
            ("judge", "judge@hackaverse.com"),
            ("participant", "participant@hackaverse.com"),
        ]:
            u = db.users.find_one({"email": email})
            if u and u.get("role") == role:
                record(f"{role} account", "PASS", f"user_id={u.get('user_id')}")
            else:
                record(f"{role} account", "FAIL", "missing or wrong role")
        jd = db.judges.find_one({"email": "judge@hackaverse.com"})
        ju = db.users.find_one({"email": "judge@hackaverse.com"})
        if jd and ju and jd.get("user_id") == ju.get("user_id"):
            record("Judge user_id mapping", "PASS", jd.get("user_id"))
        else:
            record("Judge user_id mapping", "FAIL", "judges/users mismatch or missing")

    # --- Backend module connect ---
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
    from src.database import connect_to_db, get_db_status
    ok = connect_to_db()
    st = get_db_status()
    record("connect_to_db()", "PASS" if ok else "FAIL", st.get("status", ""))

    # --- FastAPI TestClient ---
    from fastapi.testclient import TestClient
    from src.main import app

    client = TestClient(app)

    r = client.get("/system/ready")
    record("GET /system/ready", "PASS" if r.status_code == 200 else "FAIL", str(r.status_code))

    r = client.get("/system/health")
    record("GET /system/health", "PASS" if r.status_code == 200 else "FAIL", str(r.status_code))

    r = client.get("/system/db-status")
    if r.status_code == 200:
        data = r.json().get("data", {})
        connected = data.get("connected", False)
        record("GET /system/db-status", "PASS" if connected else "FAIL", str(data))
    else:
        record("GET /system/db-status", "FAIL", str(r.status_code))

    api_key = os.getenv("API_KEY", "hackaverse-local-dev-key")
    headers = {"X-API-Key": api_key}

    sys.path.insert(0, str(Path(__file__).resolve().parent))
    from seed_creds_helper import get_seed_password

    tokens = {}
    for email, role in [
        ("admin@hackaverse.com", "admin"),
        ("judge@hackaverse.com", "judge"),
        ("participant@hackaverse.com", "participant"),
    ]:
        pwd = get_seed_password(role)
        if not pwd:
            record(f"Login {role}", "FAIL", f"set SEED_{role.upper()}_PASSWORD or run seed_data.py")
            continue
        r = client.post("/auth/login", json={"email": email, "password": pwd})
        if r.status_code == 200:
            body = r.json()
            data = body.get("data", body)
            user = data.get("user", {})
            token = data.get("access_token")
            role_ok = user.get("role") == role
            tokens[role] = token
            record(f"Login {role}", "PASS" if role_ok and token else "FAIL", f"role={user.get('role')}")
        else:
            record(f"Login {role}", "FAIL", f"HTTP {r.status_code} {r.text[:120]}")

    if tokens.get("admin"):
        r = client.get("/admin/dashboard", headers={**headers, "Authorization": f"Bearer {tokens['admin']}"})
        record("Admin dashboard API", "PASS" if r.status_code == 200 else "FAIL", f"HTTP {r.status_code}")

    if tokens.get("judge"):
        auth = {**headers, "Authorization": f"Bearer {tokens['judge']}"}
        r = client.get("/judge/submissions/pending", headers=auth)
        record("Judge pending submissions API", "PASS" if r.status_code == 200 else "FAIL", f"HTTP {r.status_code}")
        r = client.get("/judge/submissions?status=submitted", headers=auth)
        record("Judge submissions API", "PASS" if r.status_code == 200 else "FAIL", f"HTTP {r.status_code}")

    # Judge invitation flow
    inv_token = None
    r = client.post(
        "/judge/invitations/send",
        json={"email": "stage1-test-judge@hackaverse.com", "hackathon_name": "Stage1 Test"},
        headers=headers,
    )
    if r.status_code == 200:
        inv_token = r.json().get("data", {}).get("token")
        record("Judge invite send", "PASS", "token received")
    else:
        record("Judge invite send", "FAIL", f"HTTP {r.status_code}")

    if inv_token:
        r = client.get(f"/judge/invitations/{inv_token}")
        record("Judge invite details", "PASS" if r.status_code == 200 else "FAIL", f"HTTP {r.status_code}")
        r = client.post(
            "/judge/invitations/accept",
            json={"token": inv_token, "name": "Stage1 Judge", "password": "judge@test123"},
        )
        if r.status_code == 200:
            acc = r.json().get("data", {})
            has_token = bool(acc.get("access_token")) and acc.get("user", {}).get("role") == "judge"
            record("Judge invite accept + JWT", "PASS" if has_token else "FAIL", "session created" if has_token else "no token")
        else:
            record("Judge invite accept + JWT", "FAIL", f"HTTP {r.status_code} {r.text[:120]}")

    # Groq key loaded in config
    groq_loaded = bool(os.getenv("GROQ_API_KEY"))
    record("GROQ_API_KEY in process env", "PASS" if groq_loaded else "FAIL")

    # Frontend redirect logic (static check)
    role_redirect_path = Path(__file__).resolve().parent.parent.parent / "hackaverse-frontend" / "src" / "utils" / "roleRedirect.js"
    if role_redirect_path.exists():
        text = role_redirect_path.read_text(encoding="utf-8")
        ok_redirect = all(x in text for x in ["'/admin'", "'/judge'", "'/app'"])
        record("Role redirect helper", "PASS" if ok_redirect else "FAIL", "roleRedirect.js")
    else:
        record("Role redirect helper", "FAIL", "file missing")

    auth_ctx = Path(__file__).resolve().parent.parent.parent / "hackaverse-frontend" / "src" / "contexts" / "AuthContext.jsx"
    if auth_ctx.exists():
        text = auth_ctx.read_text(encoding="utf-8")
        has_me = "getMe" in text and "establishSession" in text
        record("AuthContext persistence (/auth/me)", "PASS" if has_me else "FAIL")
    else:
        record("AuthContext persistence", "FAIL")

    print("\n" + "=" * 72)
    passed = sum(1 for x in RESULTS if x["status"] == "PASS")
    failed = sum(1 for x in RESULTS if x["status"] == "FAIL")
    warned = sum(1 for x in RESULTS if x["status"] == "WARN")
    print(f"SUMMARY: {passed} PASS, {failed} FAIL, {warned} WARN / {len(RESULTS)} checks")
    print("=" * 72)
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
