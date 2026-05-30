from datetime import datetime
import logging

logger = logging.getLogger(__name__)

def log_activity(activity_type: str, message: str):
    """Log activity to MongoDB activities collection"""
    try:
        from ..database import get_db
        db = get_db()
        
        if db is not None:
            db.activities.insert_one({
                "type": activity_type,
                "message": message,
                "created_at": datetime.utcnow().isoformat()
            })
            logger.info(f"Activity logged: {activity_type} - {message}")
    except Exception as e:
        logger.error(f"Failed to log activity: {str(e)}")
