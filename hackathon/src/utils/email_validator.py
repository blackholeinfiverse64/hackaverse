import re
from fastapi import HTTPException

def validate_email(email: str) -> bool:
    """Validate email format"""
    if not email or not isinstance(email, str):
        return False
    
    pattern = r'^[^@]+@[^@]+\.[^@]+$'
    return re.match(pattern, email) is not None

def validate_email_or_raise(email: str, field_name: str = "email") -> str:
    """Validate email and raise HTTPException if invalid"""
    if not email or not email.strip():
        raise HTTPException(status_code=400, detail=f"{field_name} is required")
    
    if not validate_email(email):
        raise HTTPException(status_code=400, detail=f"Invalid {field_name} format")
    
    return email.strip()
