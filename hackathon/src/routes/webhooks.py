# src/routes/webhooks.py
"""
Webhook Event System for HackaVerse — TANTRA Integration
=========================================================
Allows external systems (TANTRA) to subscribe to HackaVerse events
and receive real-time HTTP POST callbacks when events occur.

Events:
  - team.created, team.updated, team.deleted
  - submission.created, submission.scored
  - hackathon.created, hackathon.updated
  - judge.invitation_sent, judge.score_submitted
  - user.registered

Usage (TANTRA):
  POST /webhooks/subscribe
    { "url": "https://tantra.example.com/hook", "events": ["submission.scored"], "secret": "shared-secret" }

  GET /webhooks — list all subscriptions
  DELETE /webhooks/{webhook_id} — remove a subscription
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field, HttpUrl
from typing import List, Optional, Dict, Any
from datetime import datetime
from uuid import uuid4
import hmac
import hashlib
import json
import logging
import httpx

from ..auth import get_api_key
from ..database import get_db
from ..db_models import COLLECTIONS
from ..schemas.response import APIResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/webhooks", tags=["webhooks"], dependencies=[Depends(get_api_key)])

# ============================================================================
# SCHEMAS
# ============================================================================

class WebhookSubscribe(BaseModel):
    url: str = Field(..., description="Callback URL to receive events")
    events: List[str] = Field(..., min_length=1, description="List of event types to subscribe to")
    secret: Optional[str] = Field(None, description="Shared secret for HMAC signature verification")
    description: Optional[str] = Field(None, max_length=200)

class WebhookUpdate(BaseModel):
    url: Optional[str] = None
    events: Optional[List[str]] = None
    active: Optional[bool] = None

# Valid event types
VALID_EVENTS = {
    "team.created", "team.updated", "team.deleted",
    "submission.created", "submission.scored",
    "hackathon.created", "hackathon.updated",
    "judge.invitation_sent", "judge.score_submitted",
    "user.registered",
    "*",  # Wildcard — subscribe to all events
}

# ============================================================================
# SUBSCRIBE
# ============================================================================

@router.post("/subscribe")
async def subscribe_webhook(data: WebhookSubscribe):
    """
    Subscribe to HackaVerse events via webhook.

    - **url**: The callback URL that will receive POST requests
    - **events**: List of event types (e.g. ["submission.scored", "team.created"])
    - **secret**: Optional shared secret for HMAC payload signing
    """
    # Validate event types
    invalid = set(data.events) - VALID_EVENTS
    if invalid:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid event types: {', '.join(invalid)}. Valid: {', '.join(sorted(VALID_EVENTS))}"
        )

    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database unavailable")

    webhook_id = f"wh_{uuid4().hex[:12]}"
    webhook = {
        "webhook_id": webhook_id,
        "url": data.url,
        "events": data.events,
        "secret": data.secret,
        "description": data.description or "",
        "active": True,
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
        "delivery_count": 0,
        "last_delivery_at": None,
        "last_status": None,
    }

    db[COLLECTIONS.get("webhooks", "webhooks")].insert_one(webhook)
    logger.info(f"[WEBHOOK] Subscription created: {webhook_id} -> {data.url} for events {data.events}")

    return APIResponse(
        success=True,
        message="Webhook subscription created",
        data={
            "webhook_id": webhook_id,
            "url": data.url,
            "events": data.events,
            "active": True,
        }
    )

# ============================================================================
# LIST WEBHOOKS
# ============================================================================

@router.get("")
async def list_webhooks():
    """List all webhook subscriptions."""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database unavailable")

    webhooks = list(db[COLLECTIONS.get("webhooks", "webhooks")].find({}))
    for wh in webhooks:
        wh["_id"] = str(wh.get("_id", ""))
        # Don't expose secrets
        wh.pop("secret", None)

    return APIResponse(success=True, message=f"Found {len(webhooks)} webhook(s)", data=webhooks)

# ============================================================================
# DELETE WEBHOOK
# ============================================================================

@router.delete("/{webhook_id}")
async def delete_webhook(webhook_id: str):
    """Remove a webhook subscription."""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database unavailable")

    result = db[COLLECTIONS.get("webhooks", "webhooks")].delete_one({"webhook_id": webhook_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Webhook not found")

    logger.info(f"[WEBHOOK] Subscription deleted: {webhook_id}")
    return APIResponse(success=True, message="Webhook deleted", data={"webhook_id": webhook_id})

# ============================================================================
# DISPATCH ENGINE — called internally by other routes
# ============================================================================

async def dispatch_event(event_type: str, payload: Dict[str, Any]):
    """
    Dispatch an event to all subscribed webhooks.

    Called internally from route handlers after significant events.
    Non-blocking — failures are logged but never raise.

    Args:
        event_type: e.g. "submission.scored"
        payload: Event data dict
    """
    db = get_db()
    if db is None:
        return

    try:
        # Find active webhooks for this event
        query = {
            "active": True,
            "$or": [
                {"events": event_type},
                {"events": "*"},
            ]
        }
        webhooks = list(db[COLLECTIONS.get("webhooks", "webhooks")].find(query))

        if not webhooks:
            return

        event_data = {
            "event": event_type,
            "timestamp": datetime.utcnow().isoformat(),
            "data": payload,
        }

        async with httpx.AsyncClient(timeout=10.0) as client:
            for wh in webhooks:
                try:
                    body = json.dumps(event_data, default=str)
                    headers = {"Content-Type": "application/json"}

                    # Add HMAC signature if secret is configured
                    secret = wh.get("secret")
                    if secret:
                        signature = hmac.new(
                            secret.encode("utf-8"),
                            body.encode("utf-8"),
                            hashlib.sha256
                        ).hexdigest()
                        headers["X-HackaVerse-Signature"] = f"sha256={signature}"

                    resp = await client.post(wh["url"], content=body, headers=headers)

                    # Update delivery stats
                    db[COLLECTIONS.get("webhooks", "webhooks")].update_one(
                        {"webhook_id": wh["webhook_id"]},
                        {"$set": {
                            "last_delivery_at": datetime.utcnow().isoformat(),
                            "last_status": resp.status_code,
                        }, "$inc": {"delivery_count": 1}}
                    )

                    logger.info(
                        f"[WEBHOOK] Delivered {event_type} to {wh['url']} — "
                        f"status={resp.status_code}"
                    )

                except Exception as exc:
                    logger.error(f"[WEBHOOK] Delivery failed to {wh.get('url')}: {exc}")
                    db[COLLECTIONS.get("webhooks", "webhooks")].update_one(
                        {"webhook_id": wh["webhook_id"]},
                        {"$set": {
                            "last_delivery_at": datetime.utcnow().isoformat(),
                            "last_status": "error",
                        }}
                    )

    except Exception as exc:
        logger.error(f"[WEBHOOK] Dispatch error for {event_type}: {exc}")
