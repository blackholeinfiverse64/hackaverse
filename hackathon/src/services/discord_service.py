"""
Discord Webhook Notification Service for HackaVerse
=====================================================
Sends notifications to a Discord channel via webhook URL.

Configuration (via .env):
    DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
"""

import os
import logging
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)

DISCORD_WEBHOOK_URL = os.getenv("DISCORD_WEBHOOK_URL", "")


def _discord_configured() -> bool:
    """Return True when a Discord webhook URL is present."""
    return bool(DISCORD_WEBHOOK_URL)


async def send_discord_notification(
    content: str,
    embed: Optional[Dict[str, Any]] = None,
    username: str = "HackaVerse Bot",
    avatar_url: str = "",
) -> bool:
    """Send a message to Discord via webhook.

    Args:
        content: Plain text content.
        embed: Optional Discord embed object.
        username: Bot display name.
        avatar_url: Bot avatar URL.

    Returns True on success, False on failure (never raises).
    """
    if not _discord_configured():
        logger.warning("[DISCORD] Webhook URL not configured — skipping")
        return False

    try:
        import httpx

        payload: Dict[str, Any] = {
            "username": username,
            "content": content,
        }

        if avatar_url:
            payload["avatar_url"] = avatar_url

        if embed:
            payload["embeds"] = [embed]

        async with httpx.AsyncClient() as client:
            resp = await client.post(
                DISCORD_WEBHOOK_URL,
                json=payload,
                timeout=10.0,
            )
            resp.raise_for_status()

        logger.info(f"[DISCORD] Notification sent: {content[:80]}...")
        return True

    except Exception as exc:
        logger.error(f"[DISCORD] Failed to send notification: {exc}")
        return False


# ---------- Convenience Helpers ----------

async def notify_new_registration(name: str, email: str, role: str) -> bool:
    """Notify Discord about a new user registration."""
    embed = {
        "title": "👤 New User Registered",
        "color": 0x7C3AED,  # Purple
        "fields": [
            {"name": "Name", "value": name, "inline": True},
            {"name": "Email", "value": email, "inline": True},
            {"name": "Role", "value": role, "inline": True},
        ],
    }
    return await send_discord_notification(
        content="A new user just joined HackaVerse!",
        embed=embed,
    )


async def notify_team_created(team_name: str, leader_name: str) -> bool:
    """Notify Discord about a new team."""
    embed = {
        "title": "🏗️ New Team Created",
        "color": 0x10B981,  # Green
        "fields": [
            {"name": "Team", "value": team_name, "inline": True},
            {"name": "Leader", "value": leader_name, "inline": True},
        ],
    }
    return await send_discord_notification(
        content=f"Team **{team_name}** has been created!",
        embed=embed,
    )


async def notify_submission(team_name: str, project_title: str) -> bool:
    """Notify Discord about a new project submission."""
    embed = {
        "title": "📦 New Submission",
        "color": 0x3B82F6,  # Blue
        "fields": [
            {"name": "Project", "value": project_title, "inline": True},
            {"name": "Team", "value": team_name, "inline": True},
        ],
    }
    return await send_discord_notification(
        content=f"Team **{team_name}** submitted **{project_title}**!",
        embed=embed,
    )


async def notify_judging_complete(
    team_name: str, project_title: str, score: float
) -> bool:
    """Notify Discord when AI judging is complete."""
    embed = {
        "title": "🏆 Judging Complete",
        "color": 0xF59E0B,  # Amber
        "fields": [
            {"name": "Project", "value": project_title, "inline": True},
            {"name": "Team", "value": team_name, "inline": True},
            {"name": "Score", "value": f"{score}/100", "inline": True},
        ],
    }
    return await send_discord_notification(
        content=f"Judging complete for **{project_title}** — Score: **{score}/100**",
        embed=embed,
    )


async def notify_hackathon_event(event_name: str, message: str) -> bool:
    """Notify Discord about a hackathon event (start, end, announcement)."""
    embed = {
        "title": f"📢 {event_name}",
        "description": message,
        "color": 0xEC4899,  # Pink
    }
    return await send_discord_notification(
        content=f"**{event_name}**: {message}",
        embed=embed,
    )
