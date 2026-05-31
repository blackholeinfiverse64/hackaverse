"""Shared helpers for judge authorization and collection lookups."""
from datetime import datetime
from typing import Optional, Dict, Any

from fastapi import HTTPException

from ..db_models import COLLECTIONS


def find_judge_doc(db, user_id: str) -> Optional[Dict[str, Any]]:
    """Resolve a judge record by user_id, with email fallback and seed migration."""
    judges_col = db[COLLECTIONS["judges"]]

    judge = judges_col.find_one({"user_id": user_id})
    if judge:
        return judge

    user = db[COLLECTIONS["users"]].find_one({"user_id": user_id})
    if not user or user.get("role") != "judge":
        return None

    email = user.get("email")
    if email:
        judge = judges_col.find_one({"email": email})
        if judge:
            if not judge.get("user_id"):
                judges_col.update_one(
                    {"_id": judge["_id"]},
                    {"$set": {"user_id": user_id, "updated_at": datetime.utcnow()}},
                )
                judge = judges_col.find_one({"email": email})
            return judge

    # Seeded judge in users only — create matching judges record
    judge_doc = {
        "user_id": user_id,
        "email": email,
        "name": user.get("name", ""),
        "role": "judge",
        "status": "active",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    judges_col.insert_one(judge_doc)
    return judge_doc


def require_judge(db, user_id: str) -> Dict[str, Any]:
    """Return judge document or raise 403."""
    judge = find_judge_doc(db, user_id)
    if not judge:
        raise HTTPException(status_code=403, detail="User is not a judge")
    return judge
