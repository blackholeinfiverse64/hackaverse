# src/routes/system.py
from fastapi import APIRouter
from datetime import datetime
import logging
from ..database import get_db, get_db_status, DB_AVAILABLE
from ..schemas.response import APIResponse

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
            "status": "healthy" if DB_AVAILABLE else "degraded",
            "database": status["status"],
            "timestamp": datetime.now().isoformat()
        }
    )

@router.get("/ready", include_in_schema=False)
async def system_ready():
    """Readiness check for deployment platforms"""
    return {"status": "ready"}

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