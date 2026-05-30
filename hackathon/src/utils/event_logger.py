import uuid
import logging
from datetime import datetime

_logger = logging.getLogger(__name__)

def log_event(db, eventType, message, userId=None, hackathonId=None, teamId=None):
    """Log an activity event to the database"""
    event = {
        "eventId": str(uuid.uuid4()),
        "eventType": eventType,
        "message": message,
        "userId": userId,
        "hackathonId": hackathonId,
        "teamId": teamId,
        "timestamp": datetime.utcnow()
    }
    
    try:
        db["activity_events"].insert_one(event)
    except Exception as e:
        _logger.error(f"Error logging event: {e}")
    
    return event
