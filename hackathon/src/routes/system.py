# src/routes/system.py
from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime
import logging
from ..database import get_db, get_db_status, DB_AVAILABLE
from ..schemas.response import APIResponse
from ..auth import get_api_key, get_current_user_id
from ..db_models import COLLECTIONS

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/system", tags=["system"])

@router.get("/health", summary="Check system health")
async def health():
    """Quick health check"""
    status = get_db_status()
    
    return APIResponse(
        success=True,
        message="System health check",
        data={
            "status": "healthy" if status["connected"] else "degraded",
            "database": status["status"],
            "timestamp": datetime.now().isoformat()
        }
    )

@router.get("/ready", include_in_schema=False)
async def system_ready():
    """Readiness check for deployment platforms"""
    return {"status": "ready"}

@router.get("/logs", summary="System activity and provenance logs", dependencies=[Depends(get_api_key)])
async def get_system_logs(
    tenant_id: str = "default",
    event_id: str = "default_event",
    limit: int = 100,
    user_id: str = Depends(get_current_user_id),
):
    """Return merged activity and provenance log entries for admin log viewer."""
    limit = min(max(limit, 1), 500)
    logs = []
    db = get_db()

    if db is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
    user = db[COLLECTIONS["users"]].find_one({"user_id": user_id})
    if not user or user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    if db is not None:
        if COLLECTIONS["activities"] in db.list_collection_names():
            for act in db[COLLECTIONS["activities"]].find({}).sort("timestamp", -1).limit(limit):
                logs.append({
                    "timestamp": act.get("timestamp") or act.get("created_at", ""),
                    "message": act.get("description") or act.get("title", ""),
                    "level": "INFO",
                    "source": "activity",
                    "actor": act.get("actor_name", "System"),
                })

        if COLLECTIONS["provenance_logs"] in db.list_collection_names():
            prov_query = {}
            if tenant_id:
                prov_query["tenant_id"] = tenant_id
            for entry in db[COLLECTIONS["provenance_logs"]].find(prov_query).sort("timestamp", -1).limit(limit):
                logs.append({
                    "timestamp": entry.get("timestamp", ""),
                    "message": entry.get("message") or entry.get("action", str(entry.get("_id", ""))),
                    "level": entry.get("level", "INFO"),
                    "source": "provenance",
                    "event_id": entry.get("event_id", event_id),
                })

    logs.sort(key=lambda x: x.get("timestamp") or "", reverse=True)
    logs = logs[:limit]

    return APIResponse(
        success=True,
        message=f"Retrieved {len(logs)} log entries",
        data={"logs": logs},
    )


@router.get("/db-status", summary="Database connection status")
async def db_status():
    """Get database connection status"""
    status = get_db_status()
    
    return APIResponse(
        success=DB_AVAILABLE,
        message=status["status"],
        data={
            "connected": status["connected"],
            "database": status["database"],
            "uri_configured": status["uri_set"]
        }
    )