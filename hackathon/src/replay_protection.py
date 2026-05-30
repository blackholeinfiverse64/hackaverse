# src/replay_protection.py
"""
Replay Protection - Prevents duplicate request processing
"""

import logging
from typing import Tuple, Optional
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

# In-memory store for processed requests (in production, use Redis or database)
_processed_requests = {}


def check_replay(
    request_id: str,
    tenant_id: str = "default",
    event_id: str = "default_event",
    ttl_seconds: int = 3600
) -> Tuple[bool, str]:
    """
    Check if a request has already been processed (replay protection).
    
    Args:
        request_id: Unique identifier for the request
        tenant_id: Tenant identifier for scoping
        event_id: Event identifier for scoping
        ttl_seconds: Time-to-live for the request record in seconds
        
    Returns:
        Tuple of (is_new: bool, message: str)
        - is_new=True if this is a new request (not a replay)
        - is_new=False if this request was already processed (replay detected)
    """
    try:
        # Create composite key for scoping
        composite_key = f"{tenant_id}:{event_id}:{request_id}"
        
        # Check if request was already processed
        if composite_key in _processed_requests:
            record = _processed_requests[composite_key]
            
            # Check if record has expired
            if datetime.now() < record["expires_at"]:
                logger.warning(f"Replay detected for request {composite_key}")
                return False, f"Request {request_id} was already processed"
            else:
                # Record expired, remove it
                del _processed_requests[composite_key]
        
        # Record this request as processed
        _processed_requests[composite_key] = {
            "request_id": request_id,
            "tenant_id": tenant_id,
            "event_id": event_id,
            "processed_at": datetime.now(),
            "expires_at": datetime.now() + timedelta(seconds=ttl_seconds)
        }
        
        logger.info(f"New request recorded: {composite_key}")
        return True, f"Request {request_id} is new and will be processed"
        
    except Exception as e:
        logger.error(f"Error in replay protection: {str(e)}")
        # On error, allow the request to proceed (fail open)
        return True, f"Replay check error: {str(e)}"


def clear_expired_requests() -> int:
    """
    Clear expired request records from memory.
    
    Returns:
        Number of records cleared
    """
    try:
        now = datetime.now()
        expired_keys = [
            key for key, record in _processed_requests.items()
            if record["expires_at"] < now
        ]
        
        for key in expired_keys:
            del _processed_requests[key]
        
        if expired_keys:
            logger.info(f"Cleared {len(expired_keys)} expired request records")
        
        return len(expired_keys)
        
    except Exception as e:
        logger.error(f"Error clearing expired requests: {str(e)}")
        return 0


def get_replay_stats() -> dict:
    """
    Get statistics about replay protection.
    
    Returns:
        Dictionary with replay protection statistics
    """
    return {
        "total_tracked_requests": len(_processed_requests),
        "timestamp": datetime.now().isoformat()
    }
