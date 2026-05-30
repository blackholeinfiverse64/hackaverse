# HackaVerse — Integration Boundary Map

> **Reusability analysis for ecosystem participation. Documentation only — no code changes.**
> Last updated: 2026-05-11 (Production Hardening Sprint)

---

## What HackaVerse Offers as Reusable Surfaces

### 1. AI Judging Pipeline ✅ Ready

**What it does:** Accepts a submission text, runs multi-agent LLM evaluation across defined criteria, produces consensus scores with explanations.

**Reuse API:**
```
POST /judge/score
Body: {
  "submission_text": "...",
  "team_id": "...",
  "tenant_id": "...",
  "event_id": "..."
}
Response: {
  "success": true,
  "data": {
    "scores": { "usefulness": 8.5, "creativity": 7.2, ... },
    "total": 78.5,
    "evaluation_text": "...",
    "consensus": true
  }
}
```

**Potential Consumers:**
| System | Use Case |
|--------|----------|
| **Gurukul** | Student project evaluation using the same rubric engine |
| **AIAIC** | AI assignment scoring with configurable criteria |
| **Marine** | Research proposal quality assessment |
| **Workforce** | Technical assessment scoring for candidates |

**Requirements for Safe Reuse:**
- Consumer must provide `tenant_id` to isolate scoring contexts
- Consumer must have valid `API_KEY` with appropriate role
- Consumer must handle `fallback: true` responses (Groq unavailable)
- Scoring criteria are configurable via `JUDGING_CRITERIA` env var

---

### 2. Ranking Engine ✅ Ready

**What it does:** Aggregates scores across multiple judging rounds, computes weighted rankings, handles ties.

**Reuse API:**
```
POST /judge/rank
Body: { "tenant_id": "...", "event_id": "...", "limit": 50 }
Response: {
  "data": {
    "rankings": [
      { "team_id": "...", "total_score": 85.2, "rank": 1, "criteria_scores": {...} }
    ]
  }
}
```

**Potential Consumers:** Any system needing ranked evaluation output.

---

### 3. User Authentication Module ✅ Ready (Hardened)

**What it does:** Email/password registration, JWT token issuance, session management.

**Reuse API:**
```
POST /auth/register  →  Create user (password hashed with bcrypt)
POST /auth/login     →  Get JWT access token (PyJWT HMAC-SHA256)
GET  /auth/profile   →  Get current user (Bearer token verified)
```

**Security Status (All Fixed):**
- ✅ **bcrypt** password hashing with auto-salt
- ✅ **PyJWT** with HMAC-SHA256 signing + expiry enforcement
- ✅ Backward-compatible with legacy SHA-256 hashes (auto-rehash on login)
- ✅ Configurable `JWT_SECRET` and `JWT_EXPIRY_HOURS` via env

**Remaining Limitations:**
- ❌ No SSO/SAML/OAuth federation
- ❌ No multi-tenant user isolation

---

### 4. Notification System ✅ Ready (NEW)

**What it does:** Sends notifications via 3 channels — email (SMTP), Discord (webhook), WebSocket (real-time push).

**Reuse Pattern:**
```python
# Email
from src.services.email_service import send_notification_email
await send_notification_email(to="user@example.com", subject="...", body="...")

# Discord
from src.services.discord_service import send_discord_notification
await send_discord_notification(content="...", embed={...})

# WebSocket (from main.py)
from src.main import broadcast_to_user
await broadcast_to_user(user_id="user_123", payload={"type": "notification", ...})
```

**Potential Consumers:** Any BHIV system needing event notifications.

---

### 5. File Upload System ✅ Ready (NEW)

**What it does:** Handles file upload, download, listing, and deletion with metadata stored in MongoDB.

**Reuse API:**
```
POST   /uploads         →  Upload file (multipart/form-data, max 10MB)
GET    /uploads/{id}    →  Download file
GET    /uploads         →  List files (filter by team_id, submission_id)
DELETE /uploads/{id}    →  Delete file (uploader only)
```

**Supported File Types:** `png, jpg, jpeg, gif, pdf, zip, md, txt`

**Potential Consumers:** Any system needing file management.

---

### 6. Structured Audit Trail (KSML Logging) ✅ Ready

**What it does:** Writes structured events with `{intent, actor, context, outcome}` to local JSON bucket files.

**Reuse Pattern:**
```python
from src.security import KSMLLogger
logger = KSMLLogger()
logger.log_event(
    intent="evaluate_submission",
    actor="judge_system",
    context={"team_id": "team_123", "event_id": "hack_001"},
    outcome="scored_85.2"
)
```

**Potential Consumers:** Any system needing structured audit trail.

---

## What HackaVerse Does NOT Offer

| Surface | Status | Why Not |
|---------|--------|---------|
| Event bus / webhooks (outbound) | Not implemented | No outbound event emission |
| gRPC | Not implemented | REST-only |
| Batch processing | Not implemented | Single-request API only |
| Data export (CSV/JSON bulk) | Not implemented | No bulk export |
| Multi-tenant isolation | Partial (field-level only) | No row-level security |
| Rate-limited per API key | Partial (global rate limiter) | Not per-key |

---

## Integration Safety Rules

### For Any Future Consumer

1. **Always use `tenant_id`** — prevents cross-contamination of scoring data
2. **Handle degraded responses** — check for `"fallback": true` in judge responses
3. **Respect rate limits** — global rate limiter at 60 req/min/IP
4. **Use the API key contract** — do NOT bypass via direct DB access
5. **Expect cold starts** — Render free tier sleeps after 15 min inactivity
6. **Do NOT depend on bucket logs** — they are audit-only, not queryable
7. **Handle WebSocket disconnects** — reconnect with exponential backoff

### For HackaVerse as a Provider

1. **Do NOT add cross-system dependencies** without explicit approval
2. **Do NOT expose internal models** beyond the API contract
3. **Do NOT implement orchestration logic** — HackaVerse is a leaf node
4. **Version the API** before exposing to external consumers
5. **Pin the judging rubric schema** before external consumption

---

## Reusability Readiness Score

| Surface | Ready? | Notes |
|---------|--------|-------|
| AI Judging Pipeline | ✅ Yes | Stable, configurable criteria |
| Ranking Engine | ✅ Yes | Stable and stateless |
| User Auth | ✅ Yes | bcrypt + PyJWT (production-safe) |
| Notification System | ✅ Yes | Email + Discord + WebSocket |
| File Upload | ✅ Yes | With validation and metadata |
| Audit Trail | ✅ Yes | Stable KSML format |
| Hackathon Management | ⚠️ Conditional | Needs multi-tenant enforcement |
| Team Management | ⚠️ Conditional | Tied to hackathon domain model |
