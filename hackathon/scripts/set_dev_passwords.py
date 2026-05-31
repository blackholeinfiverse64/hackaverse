#!/usr/bin/env python3
"""Set local dev passwords for seeded accounts (local use only)."""
from datetime import datetime
from pathlib import Path

import bcrypt
from dotenv import load_dotenv
from pymongo import MongoClient

import os

_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(_ROOT / ".env")

ACCOUNTS = [
    ("admin@hackaverse.com", "admin@123", "admin"),
    ("judge@hackaverse.com", "judge@123", "judge"),
    ("participant@hackaverse.com", "participant@123", "participant"),
]


def main():
    uri = os.getenv("MONGODB_URI")
    if not uri:
        raise SystemExit("MONGODB_URI not set")
    db_name = os.getenv("BUCKET_DB_NAME", "hackaverse_db")
    client = MongoClient(uri, serverSelectionTimeoutMS=10000)
    db = client[db_name]

    for email, password, role in ACCOUNTS:
        password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
        result = db.users.update_one(
            {"email": email},
            {"$set": {"password_hash": password_hash}},
        )
        status = "updated" if result.matched_count else "NOT FOUND"
        print(f"{email}: {status}")

    lines = [
        "# Local dev passwords — DO NOT COMMIT",
        f"# Updated: {datetime.now().isoformat()}",
        "",
    ]
    for email, password, role in ACCOUNTS:
        lines.extend([f"{role}:", f"  email: {email}", f"  password: {password}", ""])
    (_ROOT / ".seed_credentials.local").write_text("\n".join(lines), encoding="utf-8")
    print("Wrote .seed_credentials.local")
    client.close()


if __name__ == "__main__":
    main()
