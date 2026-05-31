"""Load seeded account passwords from env or .seed_credentials.local."""
import os
from pathlib import Path

_ROOT = Path(__file__).resolve().parent.parent
_CREDENTIALS_FILE = _ROOT / ".seed_credentials.local"


def _parse_credentials_file() -> dict[str, str]:
    if not _CREDENTIALS_FILE.exists():
        return {}
    creds: dict[str, str] = {}
    role: str | None = None
    for line in _CREDENTIALS_FILE.read_text(encoding="utf-8").splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            continue
        if stripped.endswith(":") and " " not in stripped:
            role = stripped[:-1]
            continue
        if stripped.startswith("password:") and role:
            creds[role] = stripped.split(":", 1)[1].strip()
    return creds


def get_seed_password(role: str) -> str:
    """Password for admin | judge | participant from env or seed output file."""
    env_key = f"SEED_{role.upper()}_PASSWORD"
    password = os.getenv(env_key, "").strip()
    if password:
        return password
    return _parse_credentials_file().get(role, "")
