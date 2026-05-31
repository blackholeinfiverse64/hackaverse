"""
Email Notification Service for HackaVerse
==========================================
Sends transactional emails via SMTP, or writes to a local outbox when SMTP
is not configured (development / pre-SMTP deployment).
"""

import os
import re
import logging
from datetime import datetime
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from pathlib import Path
from typing import Optional, List

logger = logging.getLogger(__name__)

SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
EMAIL_USER = os.getenv("EMAIL_USER", "")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD", "")
EMAIL_FROM_NAME = os.getenv("EMAIL_FROM_NAME", "HackaVerse")
FRONTEND_BASE_URL = os.getenv("FRONTEND_BASE_URL", "http://localhost:3000").rstrip("/")
EMAIL_OUTBOX_DIR = os.getenv("EMAIL_OUTBOX_DIR", "./data/email_outbox")
# Set to "false" to disable outbox fallback (emails fail if SMTP missing)
EMAIL_OUTBOX_FALLBACK = os.getenv("EMAIL_OUTBOX_FALLBACK", "true").lower() in ("1", "true", "yes")


def _email_configured() -> bool:
    return bool(EMAIL_USER and EMAIL_PASSWORD)


def _outbox_enabled() -> bool:
    return EMAIL_OUTBOX_FALLBACK


def _write_outbox(to: str, subject: str, html_body: str, text_body: Optional[str] = None) -> bool:
    """Persist email to disk for local testing when SMTP is unavailable."""
    try:
        out_dir = Path(EMAIL_OUTBOX_DIR)
        out_dir.mkdir(parents=True, exist_ok=True)
        safe_to = re.sub(r"[^\w\-@.]", "_", to)
        ts = datetime.utcnow().strftime("%Y%m%dT%H%M%S%f")
        html_path = out_dir / f"{ts}_{safe_to}.html"
        html_path.write_text(html_body, encoding="utf-8")
        if text_body:
            (out_dir / f"{ts}_{safe_to}.txt").write_text(text_body, encoding="utf-8")
        logger.info(f"[EMAIL] Outbox delivery → {html_path}")
        return True
    except Exception as exc:
        logger.error(f"[EMAIL] Outbox write failed: {exc}")
        return False


def get_email_delivery_mode() -> str:
    if _email_configured():
        return "smtp"
    if _outbox_enabled():
        return "outbox"
    return "disabled"


async def send_email(
    to: str | List[str],
    subject: str,
    html_body: str,
    text_body: Optional[str] = None,
) -> bool:
    """Send an email via SMTP, or outbox when SMTP is not configured."""
    recipients = [to] if isinstance(to, str) else to

    if not _email_configured():
        if _outbox_enabled():
            ok = all(_write_outbox(r, subject, html_body, text_body) for r in recipients)
            return ok
        logger.warning("[EMAIL] SMTP not configured and outbox disabled — skipping email send")
        return False

    try:
        import aiosmtplib

        msg = MIMEMultipart("alternative")
        msg["From"] = f"{EMAIL_FROM_NAME} <{EMAIL_USER}>"
        msg["To"] = ", ".join(recipients)
        msg["Subject"] = subject

        if text_body:
            msg.attach(MIMEText(text_body, "plain"))
        msg.attach(MIMEText(html_body, "html"))

        await aiosmtplib.send(
            msg,
            hostname=SMTP_SERVER,
            port=SMTP_PORT,
            username=EMAIL_USER,
            password=EMAIL_PASSWORD,
            start_tls=True,
        )

        logger.info(f"[EMAIL] Sent to {recipients}: {subject}")
        return True

    except Exception as exc:
        logger.error(f"[EMAIL] Failed to send email: {exc}")
        if _outbox_enabled():
            return all(_write_outbox(r, subject, html_body, text_body) for r in recipients)
        return False


async def send_notification_email(to: str, subject: str, body: str) -> bool:
    html = f"""
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto;
                background: #0f0f23; color: #e4e4e7; padding: 32px; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #a78bfa; margin: 0; font-size: 28px;">HackaVerse</h1>
        </div>
        <div style="background: #1a1a2e; padding: 24px; border-radius: 8px; margin-bottom: 24px;">
            <h2 style="color: #e4e4e7; margin-top: 0;">{subject}</h2>
            <p style="color: #a1a1aa; line-height: 1.6;">{body}</p>
        </div>
        <div style="text-align: center; color: #71717a; font-size: 12px;">
            <p>This is an automated message from HackaVerse.</p>
        </div>
    </div>
    """
    return await send_email(to=to, subject=subject, html_body=html, text_body=body)


async def send_welcome_email(to: str, name: str) -> bool:
    return await send_notification_email(
        to=to,
        subject="Welcome to HackaVerse!",
        body=f"Hi {name},\n\nWelcome to HackaVerse. Your account has been created successfully.",
    )


async def send_team_invitation_email(
    to: str, team_name: str, inviter_name: str, token: str
) -> bool:
    return await send_notification_email(
        to=to,
        subject=f"You've been invited to join {team_name}!",
        body=f"{inviter_name} invited you to team '{team_name}'.\n\nInvitation token: {token}",
    )


async def send_submission_confirmation_email(
    to: str, project_title: str, team_name: str
) -> bool:
    return await send_notification_email(
        to=to,
        subject=f"Submission received: {project_title}",
        body=f"Your project '{project_title}' from team '{team_name}' was submitted successfully.",
    )


async def send_judging_results_email(
    to: str, project_title: str, total_score: float
) -> bool:
    return await send_notification_email(
        to=to,
        subject=f"Judging results for {project_title}",
        body=f"Total Score: {total_score}/100\n\nCheck the leaderboard for details.",
    )


def send_judge_invitation_email(
    invitee_email: str, hackathon_name: str, token: str
) -> bool:
    """Send judge invitation (sync). Uses SMTP or outbox fallback."""
    accept_url = f"{FRONTEND_BASE_URL}/judge/accept?token={token}"
    text_body = (
        f"You have been invited to judge {hackathon_name} on HackaVerse.\n\n"
        f"Accept your invitation:\n{accept_url}\n\n"
        f"Or use token: {token}"
    )
    html = f"""
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto;
                background: #0f0f23; color: #e4e4e7; padding: 32px; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #a78bfa; margin: 0; font-size: 28px;">HackaVerse</h1>
        </div>
        <div style="background: #1a1a2e; padding: 24px; border-radius: 8px; margin-bottom: 24px;">
            <h2 style="color: #e4e4e7; margin-top: 0;">Judge Invitation — {hackathon_name}</h2>
            <p style="color: #a1a1aa; line-height: 1.6;">
                You have been invited to serve as a judge for <strong>{hackathon_name}</strong>.
            </p>
            <p style="margin: 24px 0;">
                <a href="{accept_url}"
                   style="background: #00F2EA; color: #0f0f23; padding: 12px 24px;
                          border-radius: 8px; text-decoration: none; font-weight: bold;">
                    Accept Invitation
                </a>
            </p>
            <p style="color: #71717a; font-size: 12px;">
                Or paste this link: <a href="{accept_url}" style="color: #a78bfa;">{accept_url}</a>
            </p>
            <p style="color: #71717a; font-size: 12px;">Token (backup): <code>{token}</code></p>
        </div>
    </div>
    """

    if not _email_configured():
        if _outbox_enabled():
            return _write_outbox(invitee_email, f"Judge Invitation — {hackathon_name}", html, text_body)
        logger.warning(
            f"[EMAIL] SMTP not configured — skipping judge invitation email to {invitee_email}"
        )
        return False

    try:
        import smtplib

        msg = MIMEMultipart("alternative")
        msg["From"] = f"{EMAIL_FROM_NAME} <{EMAIL_USER}>"
        msg["To"] = invitee_email
        msg["Subject"] = f"Judge Invitation — {hackathon_name}"
        msg.attach(MIMEText(text_body, "plain"))
        msg.attach(MIMEText(html, "html"))

        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(EMAIL_USER, EMAIL_PASSWORD)
            server.send_message(msg)

        logger.info(f"[EMAIL] Judge invitation sent to {invitee_email}")
        return True

    except Exception as exc:
        logger.error(f"[EMAIL] Failed to send judge invitation: {exc}")
        if _outbox_enabled():
            return _write_outbox(invitee_email, f"Judge Invitation — {hackathon_name}", html, text_body)
        return False
