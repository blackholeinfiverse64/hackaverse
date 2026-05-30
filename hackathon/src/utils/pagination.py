"""
Pagination utilities for HackaVerse list endpoints.

Usage:
    from ..utils.pagination import paginate_query, PaginationParams

    @router.get("/items")
    async def list_items(page: int = 1, limit: int = 20):
        params = PaginationParams(page=page, limit=limit)
        db = get_db()
        cursor = db["items"].find({})
        return paginate_query(cursor, params, collection=db["items"], query={})
"""

from typing import Optional, Any, Dict
from pydantic import BaseModel, Field


class PaginationParams(BaseModel):
    """Standard pagination parameters."""
    page: int = Field(default=1, ge=1, description="Page number (1-indexed)")
    limit: int = Field(default=20, ge=1, le=100, description="Items per page (max 100)")

    @property
    def skip(self) -> int:
        return (self.page - 1) * self.limit


class PaginatedResponse(BaseModel):
    """Standard paginated response envelope."""
    success: bool = True
    message: str = "OK"
    data: Any = None
    pagination: Optional[Dict[str, Any]] = None


def paginate_query(cursor, params: PaginationParams, collection=None, query: dict = None) -> dict:
    """Apply pagination to a PyMongo cursor and return a standardized response.

    Args:
        cursor: PyMongo cursor (already filtered/sorted).
        params: PaginationParams with page and limit.
        collection: PyMongo collection for total count (optional).
        query: The filter dict used on the collection (for count_documents).

    Returns:
        dict with 'items', 'pagination' keys.
    """
    # Count total documents if collection provided
    total = None
    if collection is not None and query is not None:
        try:
            total = collection.count_documents(query)
        except Exception:
            total = None

    # Apply skip/limit
    items = list(cursor.skip(params.skip).limit(params.limit))

    # Serialize ObjectIds
    for item in items:
        if "_id" in item:
            item["_id"] = str(item["_id"])

    # Build pagination metadata
    pagination = {
        "page": params.page,
        "limit": params.limit,
        "returned": len(items),
    }
    if total is not None:
        pagination["total"] = total
        pagination["total_pages"] = max(1, -(-total // params.limit))  # ceil division
        pagination["has_next"] = params.page < pagination["total_pages"]
        pagination["has_prev"] = params.page > 1

    return {
        "items": items,
        "pagination": pagination,
    }


def paginated_response(items_data: dict, message: str = "OK") -> dict:
    """Wrap paginated data in the standard APIResponse format."""
    return {
        "success": True,
        "message": message,
        "data": items_data["items"],
        "pagination": items_data["pagination"],
    }
