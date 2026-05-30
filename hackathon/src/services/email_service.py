"""
Email Notification Service for HackaVerse
==========================================
Sends transactional emails via SMTP (e.g. Gmail, SendGrid, Mailgun).

Usage:
    from ..services.email_service import send_email, send_notification_email

    await send_notification_email(
        to="user@example.com",
        subject="Welcome to HackaVerse!",
        body="You have successfully registered.",
    )

Configuration (via .env):
    SMTP_SERVER=smtp.gmail.com
    SMTP_PORT=587
    EMAIL_USER=your-email@gmail.com
    EMAIL_PASSWORD=your-app-password
    EMAIL_FROM_NAME=HackaVerse
"""

import os
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional, List

logger = logging.getLogger(__name__)

# ---------- Config ----------
SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
EMAIL_USER = os.getenv("EMAIL_USER", "")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD", "")
EMAIL_FROM_NAME = os.getenv("EMAIL_FROM_NAME", "HackaVerse")


def _email_configured() -> bool:
    """Return True when SMTP credentials are present."""
    return bool(EMAIL_USER and EMAIL_PASSWORD)


async def send_email(
    to: str | List[str],
    subject: str,
    html_body: str,
    text_body: Optional[str] = None,
) -> bool:
    """Send an email via SMTP.

    Returns True on success, False on failure (never raises).
    """
    if not _email_configured():
        logger.warning("[EMAIL] SMTP not configured — skipping email send")
        return False

    try:
        import aiosmtplib

        recipients = [to] if isinstance(to, str) else to

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
        return False


# ---------- Convenience helpers ----------

async def send_notification_email(to: str, subject: str, body: str) -> bool:
    """Send a simple notification email with a standard HackaVerse template."""
    html = f"""
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto;
                background: #0f0f23; color: #e4e4e7; padding: 32px; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #a78bfa; margin: 0; font-size: 28px;">🚀 HackaVerse</h1>
        </div>
        <div style="background: #1a1a2e; padding: 24px; border-radius: 8px; margin-bottom: 24px;">
            <h2 style="color: #e4e4e7; margin-top: 0;">{subject}</h2>
            <p style="color: #a1a1aa; line-height: 1.6;">{body}</p>
        </div>
        <div style="text-align: center; color: #71717a; font-size: 12px;">
            <p>This is an automated message from HackaVerse.</p>
            <p>© 2025 HackaVerse. All rights reserved.</p>
        </div>
    </div>
    """
    return await send_email(to=to, subject=subject, html_body=html, text_body=body)


async def send_welcome_email(to: str, name: str) -> bool:
    """Send a welcome email after registration."""
    return await send_notification_email(
        to=to,
        subject="Welcome to HackaVerse! 🎉",
        body=f"Hi {name},\n\nWelcome to HackaVerse — the AI-powered hackathon platform! "
             f"Your account has been created successfully.\n\n"
             f"Get started by joining a hackathon or creating a team.\n\n"
             f"Happy hacking! 🚀",
    )


async def send_team_invitation_email(
    to: str, team_name: str, inviter_name: str, token: str
) -> bool:
    """Send a team invitation email."""
    return await send_notification_email(
        to=to,
        subject=f"You've been invited to join {team_name}! 🤝",
        body=f"Hi!\n\n{inviter_name} has invited you to join team '{team_name}' "
             f"on HackaVerse.\n\n"
             f"Use invitation token: {token}\n\n"
             f"Log in to your HackaVerse dashboard to accept or decline.",
    )


async def send_submission_confirmation_email(
    to: str, project_title: str, team_name: str
) -> bool:
    """Send submission confirmation."""
    return await send_notification_email(
        to=to,
        subject=f"Submission received: {project_title} ✅",
        body=f"Your project '{project_title}' from team '{team_name}' "
             f"has been submitted successfully!\n\n"
             f"The AI judging system will evaluate your submission shortly.",
    )


async def send_judging_results_email(
    to: str, project_title: str, total_score: float
) -> bool:
    """Send judging results notification."""
    return await send_notification_email(
        to=to,
        subject=f"Judging results for {project_title} 🏆",
        body=f"The AI judges have evaluated '{project_title}'!\n\n"
             f"Total Score: {total_score}/100\n\n"
             f"Check the leaderboard for full details.",
    )


def send_judge_invitation_email(
    invitee_email: str, hackathon_name: str, token: str
) -> bool:
    """Send a judge invitation email (synchronous wrapper).

    Called from judge_invitations route.  Because the route doesn't
    ``await`` this helper, it is intentionally synchronous and
    fire-and-forget.  When SMTP is not configured the call is a no-op.
    """
    if not _email_configured():
        logger.warning(
            "[EMAIL] SMTP not configured — skipping judge invitation email "
            f"to {invitee_email}"
        )
        return False

    try:
        import smtplib

        html = f"""
        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto;
                    background: #0f0f23; color: #e4e4e7; padding: 32px; border-radius: 12px;">
            <div style="text-align: center; margin-bottom: 24px;">
                <h1 style="color: #a78bfa; margin: 0; font-size: 28px;">🚀 HackaVerse</h1>
            </div>
            <div style="background: #1a1a2e; padding: 24px; border-radius: 8px; margin-bottom: 24px;">
                <h2 style="color: #e4e4e7; margin-top: 0;">You're Invited to Judge {hackathon_name}! ⚖️</h2>
                <p style="color: #a1a1aa; line-height: 1.6;">
                    You have been invited to serve as a judge for <strong>{hackathon_name}</strong>.
                </p>
                <p style="color: #a1a1aa; line-height: 1.6;">
                    Use the following invitation token to accept:<br/>
                    <code style="background: #2d2d4e; padding: 4px 8px; border-radius: 4px; color: #00FFFF;">{token}</code>
                </p>
            </div>
            <div style="text-align: center; color: #71717a; font-size: 12px;">
                <p>This is an automated message from HackaVerse.</p>
                <p>© 2025 HackaVerse. All rights reserved.</p>
            </div>
        </div>
        """

        msg = MIMEMultipart("alternative")
        msg["From"] = f"{EMAIL_FROM_NAME} <{EMAIL_USER}>"
        msg["To"] = invitee_email
        msg["Subject"] = f"Judge Invitation — {hackathon_name}"
        msg.attach(MIMEText(html, "html"))

        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(EMAIL_USER, EMAIL_PASSWORD)
            server.send_message(msg)

        logger.info(f"[EMAIL] Judge invitation sent to {invitee_email}")
        return True

    except Exception as exc:
        logger.error(f"[EMAIL] Failed to send judge invitation: {exc}")
        return False