"""
Security utilities for the HackaVerse platform
"""
import time
from fastapi import Header, HTTPException
import os, hmac, hashlib
from datetime import datetime
import json
import base64
from typing import Dict, Any, Optional
from collections import defaultdict
import threading
from typing import Tuple
import secrets
import uuid


class RateLimiter:
    def __init__(self):
        self.requests = defaultdict(list)  # key -> list of timestamps
        self.lock = threading.Lock()

    def is_allowed(self, key: str, limit: int, window: int) -> bool:
        """Check if request is allowed under rate limit"""
        current_time = time.time()
        with self.lock:
            # Clean old requests
            self.requests[key] = [t for t in self.requests[key] if current_time - t < window]
            # Check limit
            if len(self.requests[key]) >= limit:
                return False
            # Add current request
            self.requests[key].append(current_time)
            return True

class SecurityManager:
    def __init__(self):
        self.nonces = {}  # nonce -> expiry_time
        self.api_secret = os.getenv("SECURITY_SECRET_KEY", "default_secret_for_dev")
        if self.api_secret == "default_secret_for_dev" and os.getenv("ENV", "").lower() == "production":
            import logging as _log
            _log.getLogger(__name__).critical("[SECURITY] SECURITY_SECRET_KEY using default in PRODUCTION!")
        self.rate_limiter = RateLimiter()
        self.lock = threading.Lock()
        self.ledger = []  # Simple ledger storage for testing

    def generate_nonce(self) -> str:
        """
        Generate a secure random nonce for request signing.

        Returns:
            str: A 32-character hexadecimal nonce
        """
        return secrets.token_hex(16)

    def sign_payload(self, data: Dict[str, Any], nonce: str, timestamp: int) -> str:
        """
        Sign payload data for ledger integrity.

        Args:
            data: The data to sign
            nonce: The nonce
            timestamp: The timestamp

        Returns:
            str: Hexadecimal signature
        """
        message = f"{timestamp}{json.dumps(data, sort_keys=True)}{nonce}".encode('utf-8')
        return hmac.new(
            self.api_secret.encode('utf-8'),
            message,
            hashlib.sha256
        ).hexdigest()

    def verify_nonce(self, nonce: str, timestamp: int) -> bool:
        """
        Verify that the nonce hasn't been used before within TTL

        Args:
            nonce: The nonce to verify
            timestamp: Request timestamp

        Returns:
            True if nonce is valid and unused, False otherwise
        """
        current_time = int(time.time())
        ttl = 300  # 5 minutes

        with self.lock:
            # Clean expired nonces
            expired = [n for n, exp in self.nonces.items() if current_time > exp]
            for n in expired:
                del self.nonces[n]

            # Check if timestamp is too old
            if current_time - timestamp > ttl:
                return False

            # Check if nonce exists and not expired
            if nonce in self.nonces:
                return False

            # Add nonce with expiry
            self.nonces[nonce] = current_time + ttl
            return True

    def verify_signature(self, timestamp: str, request_body: str, signature: str) -> bool:
        """
        Verify the signature using timestamp + request_body

        Args:
            timestamp: Request timestamp as string
            request_body: Raw request body
            signature: Expected signature

        Returns:
            True if signature is valid, False otherwise
        """
        message = f"{timestamp}{request_body}".encode('utf-8')

        # Calculate expected signature
        expected_signature = hmac.new(
            self.api_secret.encode('utf-8'),
            message,
            hashlib.sha256
        ).hexdigest()

        return hmac.compare_digest(expected_signature, signature)

    def add_to_ledger(self, data: Dict[str, Any], nonce: str, timestamp: int, signature: str) -> Dict[str, Any]:
        """
        Add an entry to the ledger (for testing purposes).

        Args:
            data: The data to add
            nonce: The nonce
            timestamp: The timestamp
            signature: The signature

        Returns:
            Dict: The ledger entry
        """
        id = str(uuid.uuid4())
        data_hash = compute_payload_hash(data)
        entry = {
            "id": id,
            "data_hash": data_hash,
            "nonce": nonce,
            "timestamp": timestamp,
            "signature": signature,
            "entry_hash": "",
            "previous_hash": self.ledger[-1]["entry_hash"] if self.ledger else "0"
        }
        entry["entry_hash"] = self._hash_ledger_entry(entry, include_hash=False)
        self.ledger.append(entry)
        return entry

    def get_ledger(self) -> list:
        """
        Get all ledger entries.

        Returns:
            list: List of ledger entries
        """
        return self.ledger

    def verify_ledger_integrity(self) -> bool:
        """
        Verify the integrity of the ledger.

        Returns:
            bool: True if ledger is valid
        """
        for i, entry in enumerate(self.ledger):
            expected_hash = self._hash_ledger_entry(entry, include_hash=False)
            if entry["entry_hash"] != expected_hash:
                return False
            if i > 0:
                if entry["previous_hash"] != self.ledger[i-1]["entry_hash"]:
                    return False
        return True

    def _hash_ledger_entry(self, entry: Dict[str, Any], include_hash: bool = True) -> str:
        """
        Hash a ledger entry.

        Args:
            entry: The entry to hash
            include_hash: Whether to include the hash field

        Returns:
            str: The hash
        """
        data = entry.copy()
        if not include_hash and "entry_hash" in data:
            del data["entry_hash"]
        message = json.dumps(data, sort_keys=True).encode('utf-8')
        return hashlib.sha256(message).hexdigest()

# Create a global security manager instance
security_manager = SecurityManager()


# API Key roles mapping
API_KEY_ROLES = {
    os.getenv("API_KEY", "default_key"): "admin",
    # Add production agent keys via env vars:
    # os.getenv("AGENT_API_KEY", ""): "agent",
}

def get_api_key_role(api_key: str) -> Optional[str]:
    """Get role for API key"""
    return API_KEY_ROLES.get(api_key)

def validate_request_signing(x_timestamp: Optional[str], request_body: str, x_signature: Optional[str]) -> None:
    """Validate request signing if headers present"""
    if not x_signature:
        return  # Optional, allow request

    if not x_timestamp:
        raise HTTPException(status_code=400, detail="Missing X-Timestamp header when X-Signature provided")

    try:
        ts = int(x_timestamp)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid X-Timestamp format")

    if not security_manager.verify_signature(x_timestamp, request_body, x_signature):
        raise HTTPException(status_code=401, detail="Invalid X-Signature")

def validate_replay_protection(x_nonce: Optional[str], x_timestamp: Optional[str]) -> None:
    """Validate replay protection if headers present"""
    if not x_nonce:
        return  # Optional, allow request

    if not x_timestamp:
        raise HTTPException(status_code=400, detail="Missing X-Timestamp header when X-Nonce provided")

    try:
        ts = int(x_timestamp)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid X-Timestamp format")

    if not security_manager.verify_nonce(x_nonce, ts):
        raise HTTPException(status_code=409, detail="Invalid or reused nonce, or timestamp too old")

def check_rate_limit(api_key: str, path: str) -> None:
    """Check rate limiting for API key and path"""
    # 60 requests per minute per API key
    key = f"{api_key}:general"
    if not security_manager.rate_limiter.is_allowed(key, 60, 60):
        raise HTTPException(status_code=429, detail="Rate limit exceeded")

    # 10 requests per minute for /admin routes
    if path.startswith("/admin"):
        admin_key = f"{api_key}:admin"
        if not security_manager.rate_limiter.is_allowed(admin_key, 10, 60):
            raise HTTPException(status_code=429, detail="Admin rate limit exceeded")


def create_entry(db, actor: str, event: str, payload: Dict[str, Any], event_id: Optional[str] = None, outcome: Optional[str] = None) -> Dict[str, Any]:
    """
    Create a provenance entry in the database.

    Args:
        db: Database connection
        actor: The actor performing the action
        event: The event type
        payload: The payload data
        event_id: Optional event identifier
        outcome: Optional outcome of the event

    Returns:
        Dict: The created entry
    """
    import time
    timestamp = int(time.time())

    # Infer defaults
    if not actor:
        actor = "system"
    if not outcome:
        outcome = "unknown"
    if not event_id:
        event_id = f"{event}_{timestamp}"

    # Get previous entry for chain
    prev_entry = db.provenance_logs.find_one(sort=[("timestamp", -1)])
    previous_hash = prev_entry["entry_hash"] if prev_entry else "0"

    # Compute payload hash
    payload_hash = compute_payload_hash(payload)

    # Create entry
    entry = {
        "previous_hash": previous_hash,
        "timestamp": timestamp,
        "actor": actor,
        "event": event,
        "event_id": event_id,
        "outcome": outcome,
        "payload_hash": payload_hash,
        "entry_hash": "",  # Will be computed
        "signature": "mock_signature"  # Mock for testing
    }

    # Compute entry hash
    entry["entry_hash"] = compute_entry_hash(entry)

    # Insert into database
    db.provenance_logs.insert_one(entry)

    return entry


def verify_chain(db) -> list:
    """
    Verify the provenance chain integrity.

    Args:
        db: Database connection

    Returns:
        list: List of issues found
    """
    issues = []
    entries = list(db.provenance_logs.find().sort("timestamp", 1))

    for i, entry in enumerate(entries):
        # Verify entry hash
        expected_hash = compute_entry_hash(entry)
        if entry["entry_hash"] != expected_hash:
            issues.append(f"Entry {i} hash mismatch")

        # Verify chain
        if i > 0:
            if entry["previous_hash"] != entries[i-1]["entry_hash"]:
                issues.append(f"Entry {i} chain broken")

    return issues


def _sha256_hex(data: str) -> str:
    """
    SHA256 hash of data as hex string.

    Args:
        data: The data to hash

    Returns:
        str: Hex hash
    """
    return hashlib.sha256(data.encode('utf-8')).hexdigest()


def compute_payload_hash(payload: Dict[str, Any]) -> str:
    """
    Compute hash of payload data.

    Args:
        payload: The payload to hash

    Returns:
        str: Hex hash of the payload
    """
    # Sort keys for deterministic hashing
    payload_str = json.dumps(payload, sort_keys=True)
    return hashlib.sha256(payload_str.encode('utf-8')).hexdigest()


def compute_entry_hash(entry: Dict[str, Any]) -> str:
    """
    Compute hash of entry data.

    Args:
        entry: The entry to hash

    Returns:
        str: Hex hash of the entry
    """
    # Sort keys for deterministic hashing
    entry_str = json.dumps(entry, sort_keys=True)
    return hashlib.sha256(entry_str.encode('utf-8')).hexdigest()