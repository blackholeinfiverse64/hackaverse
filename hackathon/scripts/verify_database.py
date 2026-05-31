#!/usr/bin/env python3
"""One-off database verification for HackaVerse migration audit. Reads MONGODB_URI from env only."""
import os
import sys
from pathlib import Path
from datetime import datetime

from dotenv import load_dotenv
from pymongo import MongoClient

# Load hackathon/.env if present (does not override existing env)
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path, override=False)

MONGODB_URI = os.getenv("MONGODB_URI")
DB_NAME = os.getenv("BUCKET_DB_NAME", "hackaverse_db")

EXPECTED_COLLECTIONS = [
    "users", "sessions", "judges", "judge_invitations", "judge_assignments",
    "hackathons", "teams", "user_teams", "submissions", "judgments",
    "invitations", "notifications", "announcements", "activities",
    "rewards", "files", "webhooks", "hackathon_participants", "team_members",
    "provenance_logs",
]

SEED_EMAILS = {
    "admin": "admin@hackaverse.com",
    "judge": "judge@hackaverse.com",
    "participant": "participant@hackaverse.com",
}


def mask_uri(uri: str) -> str:
    if not uri:
        return "(not set)"
    try:
        if "@" in uri:
            pre, rest = uri.split("@", 1)
            scheme = pre.split("://")[0] + "://"
            user = pre.split("://")[1].split(":")[0] if "://" in pre else "?"
            host = rest.split("/")[0].split("?")[0]
            db_part = ""
            if "/" in rest:
                db_part = rest.split("/", 1)[1].split("?")[0]
            return f"{scheme}{user}:***@{host}/{db_part or '?'}"
    except Exception:
        pass
    return "(redacted)"


def main():
    print("=" * 70)
    print("HackaVerse Database Verification")
    print("=" * 70)
    print(f"MONGODB_URI: {mask_uri(MONGODB_URI)}")
    print(f"BUCKET_DB_NAME: {DB_NAME}")
    print()

    if not MONGODB_URI:
        print("FAIL: MONGODB_URI not set")
        sys.exit(1)

    try:
        client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=10000)
        client.admin.command("ping")
        print("PASS: MongoDB ping successful")
    except Exception as e:
        print(f"FAIL: Connection failed — {type(e).__name__}: {e}")
        sys.exit(1)

    db = client[DB_NAME]
    collections = sorted(db.list_collection_names())
    print(f"\nDatabase in use: {DB_NAME}")
    print(f"Collections found ({len(collections)}): {', '.join(collections) or '(none)'}")

    missing = [c for c in EXPECTED_COLLECTIONS if c not in collections]
    extra = [c for c in collections if c not in EXPECTED_COLLECTIONS and not c.startswith("system.")]

    if missing:
        print(f"\nCollections MISSING (may be empty until first use): {', '.join(missing)}")
    else:
        print("\nAll expected core collections present (or will be created on first write)")

    if extra:
        print(f"Extra collections: {', '.join(extra)}")

    print("\n--- Document counts ---")
    for name in ["users", "judges", "hackathons", "teams", "submissions", "sessions", "notifications", "rewards"]:
        if name in collections:
            print(f"  {name}: {db[name].count_documents({})}")
        else:
            print(f"  {name}: (collection does not exist)")

    print("\n--- Seed role accounts ---")
    for role, email in SEED_EMAILS.items():
        user = db["users"].find_one({"email": email}) if "users" in collections else None
        if not user:
            print(f"  {role} ({email}): NOT FOUND")
            continue
        uid = user.get("user_id", "?")
        r = user.get("role", "?")
        has_pw = bool(user.get("password_hash"))
        pw_type = "bcrypt" if has_pw and str(user.get("password_hash", "")).startswith("$2") else (
            "legacy_sha256" if has_pw else "MISSING"
        )
        print(f"  {role} ({email}): role={r}, user_id={uid}, password={pw_type}")

    if "judges" in collections:
        judge_user = db["users"].find_one({"email": SEED_EMAILS["judge"]})
        if judge_user:
            jd = db["judges"].find_one({"email": SEED_EMAILS["judge"]})
            if jd:
                match = jd.get("user_id") == judge_user.get("user_id")
                print(f"\n  judges collection: user_id={jd.get('user_id')}, matches users.user_id={match}")
            else:
                print("\n  judges collection: NO entry for judge@hackaverse.com")

    # Password verify for seed accounts
    print("\n--- Password verification (seed defaults) ---")
    try:
        import bcrypt
        from hashlib import sha256

        def check(stored, plain):
            if not stored:
                return False
            if stored.startswith("$2"):
                return bcrypt.checkpw(plain.encode(), stored.encode())
            return sha256(plain.encode()).hexdigest() == stored

        import sys
        from pathlib import Path as _Path
        sys.path.insert(0, str(_Path(__file__).resolve().parent))
        from seed_creds_helper import get_seed_password

        tests = [
            ("admin@hackaverse.com", "admin"),
            ("judge@hackaverse.com", "judge"),
            ("participant@hackaverse.com", "participant"),
        ]
        for email, role in tests:
            pwd = get_seed_password(role)
            if not pwd:
                print(f"  {email}: SKIP — set SEED_{role.upper()}_PASSWORD or run seed_data.py")
                continue
            u = db["users"].find_one({"email": email}) if "users" in collections else None
            ok = check(u.get("password_hash", ""), pwd) if u else False
            print(f"  {email} / default password: {'PASS' if ok else 'FAIL or user missing'}")
    except ImportError:
        print("  (bcrypt not available — skip password checks)")

    client.close()
    print("\n" + "=" * 70)
    print("Verification complete")
    print("=" * 70)


if __name__ == "__main__":
    main()
