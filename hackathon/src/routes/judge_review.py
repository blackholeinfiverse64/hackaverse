from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
import logging
from ..auth import get_api_key, get_current_user_id
from ..database import get_db
from ..db_models import COLLECTIONS
from ..schemas.response import APIResponse
from ..utils.judge_helpers import require_judge

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/judge", tags=["judge"], dependencies=[Depends(get_api_key)])

class ReviewSubmit(BaseModel):
    submission_id: str = Field(..., min_length=1)
    clarity_score: float = Field(ge=0, le=10)
    quality_score: float = Field(ge=0, le=10)
    innovation_score: float = Field(ge=0, le=10)
    comments: str = Field(..., min_length=1)
    final_score: float = Field(ge=0, le=10)

@router.get("/submissions")
async def get_all_submissions_for_judge(status: Optional[str] = None, hackathon_id: Optional[str] = None, limit: int = 100, user_id: str = Depends(get_current_user_id)):
    """Get all submissions for judge review (no team filtering)"""
    db = get_db()
    require_judge(db, user_id)
    
    query = {}
    
    if status:
        query["status"] = status
    
    if hackathon_id:
        query["$or"] = [
            {"hackathon_id": hackathon_id},
            {"hackathon": hackathon_id}
        ]

    raw = list(db[COLLECTIONS.get("submissions", "submissions")].find(query).limit(min(limit, 500)))
    submissions = []

    for item in raw:
        has_hackathon = bool(item.get("hackathon_id") or item.get("hackathon"))
        if not item.get("team_id") or not has_hackathon or not (item.get("title") or item.get("project_title")):
            logger.warning(f"Invalid submission data, skipped: {item.get('submission_id') or item.get('_id')}")
            continue

        item["_id"] = str(item["_id"])
        item["submission_id"] = item.get("submission_id") or str(item.get("_id"))
        item["title"] = item.get("title") or item.get("project_title")
        if item.get("hackathon") and not item.get("hackathon_id"):
            item["hackathon_id"] = item["hackathon"]

        submissions.append(item)

    logger.info(f"Judge {user_id} retrieved {len(submissions)} submissions (status={status}, hackathon_id={hackathon_id})")
    return APIResponse(success=True, message=f"{len(submissions)} submissions retrieved", data=submissions)

@router.get("/submissions/pending")
async def get_pending_submissions(hackathon_id: Optional[str] = None, limit: int = 100, user_id: str = Depends(get_current_user_id)):
    """Get submissions pending judge review (judge must be assigned)"""
    db = get_db()
    require_judge(db, user_id)
    
    # Query for submissions with status "submitted" or no status field
    query = {
        "$or": [
            {"status": "submitted"},
            {"status": {"$exists": False}},
            {"status": None}
        ]
    }
    
    if hackathon_id:
        query["$and"] = [
            {
                "$or": [
                    {"hackathon_id": hackathon_id},
                    {"hackathon": hackathon_id}
                ]
            }
        ]

    raw = list(db[COLLECTIONS.get("submissions", "submissions")].find(query).limit(min(limit, 500)))
    pending = []

    for item in raw:
        has_hackathon = bool(item.get("hackathon_id") or item.get("hackathon"))
        if not item.get("team_id") or not has_hackathon or not (item.get("title") or item.get("project_title")):
            logger.warning(f"Invalid submission data, skipped: {item.get('submission_id') or item.get('_id')}")
            continue

        item["_id"] = str(item["_id"])
        item["submission_id"] = item.get("submission_id") or str(item.get("_id"))
        item["title"] = item.get("title") or item.get("project_title")
        if item.get("hackathon") and not item.get("hackathon_id"):
            item["hackathon_id"] = item["hackathon"]

        pending.append(item)

    logger.info(f"Judge {user_id} retrieved {len(pending)} pending submissions (hackathon_id={hackathon_id})")
    return APIResponse(success=True, message=f"{len(pending)} pending submissions", data=pending)

@router.get("/submissions/all")
async def get_all_submissions(hackathon_id: Optional[str] = None, limit: int = 100, user_id: str = Depends(get_current_user_id)):
    """Get all submissions for judge review (no status filter)"""
    db = get_db()
    require_judge(db, user_id)
    
    query = {}
    
    if hackathon_id:
        query["$or"] = [
            {"hackathon_id": hackathon_id},
            {"hackathon": hackathon_id}
        ]

    raw = list(db[COLLECTIONS.get("submissions", "submissions")].find(query).limit(min(limit, 500)))
    submissions = []

    for item in raw:
        has_hackathon = bool(item.get("hackathon_id") or item.get("hackathon"))
        if not item.get("team_id") or not has_hackathon or not (item.get("title") or item.get("project_title")):
            logger.warning(f"Invalid submission data, skipped: {item.get('submission_id') or item.get('_id')}")
            continue

        item["_id"] = str(item["_id"])
        item["submission_id"] = item.get("submission_id") or str(item.get("_id"))
        item["title"] = item.get("title") or item.get("project_title")
        if item.get("hackathon") and not item.get("hackathon_id"):
            item["hackathon_id"] = item["hackathon"]

        submissions.append(item)

    logger.info(f"Judge {user_id} retrieved {len(submissions)} total submissions (hackathon_id={hackathon_id})")
    return APIResponse(success=True, message=f"{len(submissions)} total submissions", data=submissions)

@router.post("/review/submit")
async def submit_review(review: ReviewSubmit, user_id: str = Depends(get_current_user_id)):
    """Submit manual judge review"""
    db = get_db()
    require_judge(db, user_id)

    submission = db[COLLECTIONS.get("submissions", "submissions")].find_one({"submission_id": review.submission_id})
    if not submission:
        submission = db[COLLECTIONS.get("submissions", "submissions")].find_one({"_id": review.submission_id})

    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    update_fields = {
        "judge_clarity_score": review.clarity_score,
        "judge_quality_score": review.quality_score,
        "judge_innovation_score": review.innovation_score,
        "judge_total_score": review.final_score,
        "judge_comments": review.comments,
        "judge_reviewed": True,
        "reviewed_at": datetime.now().isoformat(),
        "reviewed_by": user_id,
        "status": "judged"
    }

    db[COLLECTIONS.get("submissions", "submissions")].update_one(
        {"submission_id": review.submission_id},
        {"$set": update_fields}
    )

    judgment_doc = {
        "submission_hash": str(review.submission_id),
        "team_id": submission.get("team_id", "unknown"),
        "clarity": review.clarity_score,
        "quality": review.quality_score,
        "innovation": review.innovation_score,
        "total_score": review.final_score,
        "confidence": 1.0, 
        "trace": review.comments,
        "version": "human_v1",
        "tenant_id": submission.get("tenant_id", "default"),
        "event_id": submission.get("event_id", "default_event"),
        "workspace_id": submission.get("workspace_id", None),
        "timestamp": int(datetime.now().timestamp()),
        "human_reviewed": True,
        "review_type": "human",
        "judge_id": user_id
    }
    db.judgments.insert_one(judgment_doc)

    logger.info(f"Judge {user_id} reviewed submission: {review.submission_id}")
    return APIResponse(success=True, message="Review submitted successfully", data={
            "submission_id": review.submission_id,
            "judge_reviewed": True,
            "final_score": review.final_score
        })

@router.get("/my-assignments")
async def get_judge_assignments(user_id: str = Depends(get_current_user_id)):
    """Get submissions assigned to current judge"""
    db = get_db()
    require_judge(db, user_id)
    
    assignments = list(db[COLLECTIONS["judge_assignments"]].find({"judge_id": user_id}))
    
    submission_ids = [a.get("submission_id") for a in assignments]
    submissions = []
    
    if submission_ids:
        submissions = list(db[COLLECTIONS.get("submissions", "submissions")].find(
            {"submission_id": {"$in": submission_ids}}
        ))
        for s in submissions:
            s["_id"] = str(s["_id"])
    
    logger.info(f"Judge {user_id} has {len(submissions)} assigned submissions")
    return APIResponse(success=True, message=f"{len(submissions)} assigned submissions", data=submissions)
