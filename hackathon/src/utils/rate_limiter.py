from datetime import datetime, timedelta
from fastapi import HTTPException
from typing import Dict
import logging

logger = logging.getLogger(__name__)

class RateLimiter:
    def __init__(self, max_requests: int = 5, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests: Dict[str, list] = {}
    
    def is_allowed(self, user_id: str) -> bool:
        """Check if user is allowed to make request"""
        now = datetime.now()
        
        if user_id not in self.requests:
            self.requests[user_id] = []
        
        cutoff_time = now - timedelta(seconds=self.window_seconds)
        self.requests[user_id] = [
            req_time for req_time in self.requests[user_id]
            if req_time > cutoff_time
        ]
        
        if len(self.requests[user_id]) >= self.max_requests:
            return False
        
        self.requests[user_id].append(now)
        return True
    
    def check_rate_limit(self, user_id: str) -> None:
        """Check rate limit and raise exception if exceeded"""
        if not self.is_allowed(user_id):
            raise HTTPException(
                status_code=429,
                detail="Too many invitations. Please wait before sending more."
            )

invitation_limiter = RateLimiter(max_requests=5, window_seconds=60)
