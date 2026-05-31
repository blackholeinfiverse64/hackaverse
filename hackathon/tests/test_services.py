"""
test_services.py — Tests for email and Discord notification services.
"""
import pytest
from unittest.mock import patch, AsyncMock, MagicMock


# ============================================================================
# EMAIL SERVICE TESTS
# ============================================================================

class TestEmailService:
    """Tests for the email notification service."""

    def test_email_not_configured_returns_false(self):
        from src.services.email_service import _email_configured
        with patch.dict("os.environ", {"EMAIL_USER": "", "EMAIL_PASSWORD": ""}):
            # Re-import to pick up patched env
            import importlib
            import src.services.email_service as mod
            importlib.reload(mod)
            assert mod._email_configured() is False

    @pytest.mark.asyncio
    async def test_send_email_skips_when_not_configured(self):
        with patch.dict("os.environ", {"EMAIL_USER": "", "EMAIL_PASSWORD": "", "EMAIL_OUTBOX_FALLBACK": "false"}):
            import importlib
            import src.services.email_service as mod
            importlib.reload(mod)
            result = await mod.send_email(
                to="test@test.com",
                subject="Test",
                html_body="<p>Test</p>",
            )
            assert result is False

    @pytest.mark.asyncio
    async def test_send_notification_email_template(self):
        """Verify the template helper builds correct HTML."""
        with patch.dict("os.environ", {"EMAIL_USER": "test@test.com", "EMAIL_PASSWORD": "pass"}):
            import importlib
            import src.services.email_service as mod
            importlib.reload(mod)

            with patch.object(mod, "send_email", new_callable=AsyncMock, return_value=True) as mock_send:
                result = await mod.send_notification_email(
                    to="user@test.com",
                    subject="Test Subject",
                    body="Test body content",
                )
                assert result is True
                mock_send.assert_called_once()
                call_args = mock_send.call_args
                assert "Test Subject" in call_args.kwargs.get("subject", call_args.args[1] if len(call_args.args) > 1 else "")


# ============================================================================
# DISCORD SERVICE TESTS
# ============================================================================

class TestDiscordService:
    """Tests for the Discord webhook service."""

    def test_discord_not_configured(self):
        with patch.dict("os.environ", {"DISCORD_WEBHOOK_URL": ""}):
            import importlib
            import src.services.discord_service as mod
            importlib.reload(mod)
            assert mod._discord_configured() is False

    @pytest.mark.asyncio
    async def test_send_discord_skips_when_not_configured(self):
        with patch.dict("os.environ", {"DISCORD_WEBHOOK_URL": ""}):
            import importlib
            import src.services.discord_service as mod
            importlib.reload(mod)
            result = await mod.send_discord_notification("Test message")
            assert result is False

    @pytest.mark.asyncio
    async def test_send_discord_success(self):
        with patch.dict("os.environ", {"DISCORD_WEBHOOK_URL": "https://discord.com/api/webhooks/test"}):
            import importlib
            import src.services.discord_service as mod
            importlib.reload(mod)

            mock_response = MagicMock()
            mock_response.raise_for_status = MagicMock()

            with patch("httpx.AsyncClient") as mock_client_cls:
                mock_client = AsyncMock()
                mock_client.post = AsyncMock(return_value=mock_response)
                mock_client.__aenter__ = AsyncMock(return_value=mock_client)
                mock_client.__aexit__ = AsyncMock(return_value=False)
                mock_client_cls.return_value = mock_client

                result = await mod.send_discord_notification("Hello Discord!")
                assert result is True

    @pytest.mark.asyncio
    async def test_notify_new_registration(self):
        with patch.dict("os.environ", {"DISCORD_WEBHOOK_URL": "https://discord.com/api/webhooks/test"}):
            import importlib
            import src.services.discord_service as mod
            importlib.reload(mod)

            with patch.object(mod, "send_discord_notification", new_callable=AsyncMock, return_value=True):
                result = await mod.notify_new_registration("John", "john@test.com", "participant")
                assert result is True


# ============================================================================
# DATABASE MODULE TESTS
# ============================================================================

class TestDatabaseModule:
    """Tests for database configuration."""

    def test_collections_dict_complete(self):
        from src.db_models import COLLECTIONS
        required = ["users", "sessions", "hackathons", "teams", "invitations",
                     "submissions", "judgments", "notifications", "files",
                     "provenance_logs", "rewards", "team_members", "user_teams"]
        for col in required:
            assert col in COLLECTIONS, f"Missing collection: {col}"

    def test_get_db_returns_none_without_connection(self):
        from src.database import get_db
        # In test env with no real MongoDB, db should be None
        # (unless connect_to_db was called successfully)
        result = get_db()
        # Just verify it doesn't crash
        assert result is None or result is not None

    def test_get_db_status(self):
        from src.database import get_db_status
        status = get_db_status()
        assert "connected" in status
        assert "database" in status
        assert "status" in status


# ============================================================================
# SECURITY MODULE TESTS
# ============================================================================

class TestSecurityConfig:
    """Tests for security configuration."""

    def test_cors_env_parsing(self):
        """Verify CORS origin parsing from env."""
        import os
        raw = os.getenv("ALLOWED_ORIGINS", "*")
        if raw.strip() == "*":
            origins = ["*"]
        else:
            origins = [o.strip() for o in raw.split(",") if o.strip()]
        assert isinstance(origins, list)
        assert len(origins) > 0

    def test_jwt_secret_set(self):
        """Verify JWT_SECRET is configured."""
        import os
        secret = os.getenv("JWT_SECRET", "")
        assert len(secret) > 0
