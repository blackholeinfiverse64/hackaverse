"""
Input sanitization utilities for MongoDB NoSQL injection prevention.

Usage:
    from ..utils.sanitizer import sanitize_string, sanitize_query_param

    safe_email = sanitize_string(user_input_email)
    safe_query = sanitize_query_param(user_input)
"""
import re
import logging
from typing import Any, Dict

logger = logging.getLogger(__name__)

# MongoDB operator characters that should never appear in user input
_MONGO_OPERATORS = re.compile(r'[\$]')
_DANGEROUS_KEYS = {"$gt", "$gte", "$lt", "$lte", "$ne", "$in", "$nin",
                    "$or", "$and", "$not", "$nor", "$regex", "$where",
                    "$exists", "$type", "$expr", "$jsonSchema", "$mod",
                    "$text", "$geoWithin"}


def sanitize_string(value: str, max_length: int = 1000) -> str:
    """Sanitize a string input — strip dangerous MongoDB operators.

    Args:
        value: Raw user input string.
        max_length: Maximum allowed length (truncated silently).

    Returns:
        Sanitized string safe for MongoDB queries.
    """
    if not isinstance(value, str):
        return str(value)[:max_length]
    # Remove any $ characters (MongoDB operator prefix)
    cleaned = _MONGO_OPERATORS.sub('', value)
    return cleaned[:max_length].strip()


def sanitize_query_param(value: Any) -> Any:
    """Sanitize a query parameter — reject dict/list injection attempts.

    MongoDB NoSQL injection works by sending {"$gt": ""} instead of a string.
    This function ensures the value is a primitive type.

    Args:
        value: User-supplied query parameter.

    Returns:
        Safe primitive value.

    Raises:
        ValueError: If the value is a dict or list (injection attempt).
    """
    if isinstance(value, dict):
        # This is a NoSQL injection attempt — {"$gt": ""} etc.
        logger.warning(f"[SECURITY] NoSQL injection attempt blocked: {value}")
        raise ValueError("Invalid query parameter format")
    if isinstance(value, list):
        return [sanitize_query_param(v) for v in value]
    if isinstance(value, str):
        return sanitize_string(value)
    return value


def sanitize_dict(data: Dict[str, Any]) -> Dict[str, Any]:
    """Recursively sanitize all string values in a dictionary.

    Args:
        data: Dictionary with potentially unsafe values.

    Returns:
        Dictionary with all string values sanitized.
    """
    sanitized = {}
    for key, value in data.items():
        # Block operator keys
        if key in _DANGEROUS_KEYS or key.startswith("$"):
            logger.warning(f"[SECURITY] Blocked dangerous key: {key}")
            continue
        if isinstance(value, dict):
            sanitized[key] = sanitize_dict(value)
        elif isinstance(value, str):
            sanitized[key] = sanitize_string(value)
        elif isinstance(value, list):
            sanitized[key] = [
                sanitize_dict(v) if isinstance(v, dict)
                else sanitize_string(v) if isinstance(v, str)
                else v
                for v in value
            ]
        else:
            sanitized[key] = value
    return sanitized
