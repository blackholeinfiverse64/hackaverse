# HackaVerse — TANTRA Alignment Document

> **Realistic mapping of HackaVerse's role within the TANTRA ecosystem.**
> No fantasy architecture. No speculative systems. Only what exists and what is provable.
> Last updated: 2026-05-11 (Production Hardening Sprint)

---

## 1. Current HackaVerse Role

HackaVerse is an **AI-powered hackathon management platform** that provides:

- User registration and authentication (**bcrypt + PyJWT**)
- Team formation and management
- Hackathon event creation and lifecycle management
- Project submission collection with **file uploads**
- AI-assisted judging via Groq LLM (multi-agent consensus scoring)
- Leaderboard and ranking systems
- **Email notifications** (SMTP) and **Discord webhook** alerts
- **Real-time WebSocket** push notifications
- Structured audit logging (KSML format to local bucket)

**HackaVerse is a workflow participant, NOT an orchestrator.**

---

## 2. Upstream Dependencies

| Dependency | Type | Criticality | Failure Mode |
|-----------|------|-------------|--------------|
| MongoDB Atlas | Data persistence | Required for full operation | Degraded mode (in-memory only) |
| Groq API | AI judging | Required for AI scoring | Fallback deterministic scores |
| BHIV Core | Reasoning relay | Optional | Silent skip, local logging continues |
| SMTP Server | Email notifications | Optional | Silently skipped |
| Discord | Webhook notifications | Optional | Silently skipped |

HackaVerse has **no upstream orchestration dependency**. It does not receive execution instructions from any external system. All execution is triggered by user actions through the frontend or direct API calls.

---

## 3. Downstream Dependencies

No system currently depends on HackaVerse's output. In a future TANTRA integration:

| Potential Consumer | What They Would Consume | Current Status |
|-------------------|------------------------|----------------|
| **Gurukul** | Judging scores, evaluation rubrics | NOT connected (API ready) |
| **Workforce systems** | Participant skill assessments | NOT connected (API ready) |
| **Recruitment systems** | Team performance data | NOT connected (API ready) |
| **Innovation ecosystems** | Submission quality metrics | NOT connected (API ready) |

---

## 4. Structured Contract Boundaries

### What HackaVerse Exposes (API Surface)

| Endpoint Group | Contract | Auth Required |
|---------------|----------|---------------|
| `/auth/*` | User registration, login, token refresh | No (public) |
| `/judge/*` | Submission scoring, ranking, rubric | X-API-Key |
| `/hackathons/*` | Event CRUD, participant management | X-API-Key |
| `/teams/*` | Team CRUD, member management | X-API-Key + Bearer |
| `/submissions/*` | Submission CRUD | X-API-Key + Bearer |
| `/uploads/*` | File upload/download/list/delete | X-API-Key + Bearer |
| `/leaderboard/*` | Rankings query | X-API-Key |
| `/user/*` | User profile management | Bearer |
| `/ws/{user_id}` | WebSocket real-time notifications | None |
| `/health`, `/system/*` | Health checks, DB status | None |

### What HackaVerse Does NOT Expose

- No webhook endpoints for external orchestration
- No event bus / message queue integration
- No gRPC streaming
- No batch import/export APIs
- No multi-tenant isolation beyond tenant_id field

---

## 5. Trace Propagation Expectations

### Current State
- HackaVerse uses KSML structured logging (`{intent, actor, context, outcome}`)
- Logs are written to local JSON files via `bucket_connector.py`
- Provenance chain with hash-linked entries exists in MongoDB (`provenance_logs` collection)
- `tenant_id` and `event_id` fields propagate through judging flows

### What Exists for Trace Propagation
- `request_id` field in judge submission requests
- `tenant_id` / `event_id` in all judging payloads
- Hash-chained provenance entries with `entry_hash` and `previous_hash`
- Timestamp-based correlation in bucket logs

### What Does NOT Exist
- OpenTelemetry / distributed tracing
- Correlation ID propagation across frontend ↔ backend
- Span/trace export to external systems
- Standardized trace headers (W3C Trace Context)

---

## 6. Observable Execution Points

| Point | Location | Observable Via |
|-------|----------|---------------|
| Backend startup | `main.py` startup event | Console output |
| DB connection | `database.py` connect_to_db | Console + `/health` |
| Auth events | `auth_routes.py` | Logger output (bcrypt/JWT) |
| Judging flow | `judge.py` → `multi_agent_judge.py` | KSML bucket logs |
| Reward calculation | `reward.py` | KSML bucket logs |
| Provenance entry | `security.py` create_entry | MongoDB provenance_logs |
| Email notification | `email_service.py` | Logger output |
| Discord notification | `discord_service.py` | Logger output |
| WebSocket events | `main.py` websocket_endpoint | Connection logs |
| File uploads | `file_uploads.py` | Logger + MongoDB files collection |
| BHIV Core relay | `bhiv_connectors.py` | Logger output |
| Bucket writes | `bucket_connector.py` | `./data/bucket/*.json` |

---

## 7. Replay-Safe Expectations

### Currently Replay-Safe
- Judging submissions (idempotent scoring — same input produces same AI query)
- Health checks (stateless)
- Leaderboard queries (read-only)
- Rubric queries (read-only)
- File downloads (idempotent)

### NOT Replay-Safe
- User registration (creates duplicate users)
- Team creation (creates duplicate teams)
- File uploads (creates duplicate files)
- Nonce-protected endpoints (replay detection exists but only for workflows)

---

## 8. Current Convergence Gaps

| Gap | Description | Severity | Status |
|-----|-------------|----------|--------|
| No distributed tracing | Cannot trace across frontend → backend → Groq → DB | Medium | Open |
| No webhook ingestion | Cannot receive orchestration signals from TANTRA | Medium | Open |
| No structured event emission | No outbound event bus for downstream consumers | Medium | Open |
| No multi-tenant isolation | tenant_id is a field, not an enforcement boundary | Low | Open |
| No schema versioning | API contracts are not versioned beyond OpenAPI | Low | Open |
| ~~SHA-256 password hashing~~ | ~~Not production-safe~~ | ~~High~~ | ✅ Fixed (bcrypt) |
| ~~Non-cryptographic JWT~~ | ~~Token forgery possible~~ | ~~High~~ | ✅ Fixed (PyJWT) |
| ~~CORS wildcard~~ | ~~Any origin can call API~~ | ~~Medium~~ | ✅ Fixed (env-based) |
| Credentials in git history | Git history contains old creds | High | ⚠️ Documented |

---

## 9. Expected Proof Flow

For TANTRA integration readiness, HackaVerse must prove:

1. **Deterministic startup** → Health endpoint returns predictable state ✅
2. **API contract stability** → OpenAPI spec at `/openapi.json` ✅
3. **Audit trail** → Provenance chain in MongoDB ✅
4. **Structured logging** → KSML bucket logs ✅
5. **Graceful degradation** → Runs without MongoDB or Groq ✅
6. **Environment determinism** → `.env.example` with documented defaults ✅
7. **Security hygiene** → bcrypt + PyJWT + CORS lockdown ✅
8. **Automated testing** → pytest test suite with CI/CD ✅
9. **Notification system** → Email + Discord + WebSocket ✅

---

## 10. Boundary Risks

| Risk | Impact | Status |
|------|--------|--------|
| ~~CORS wildcard in production~~ | ~~Any origin can call API~~ | ✅ Fixed |
| ~~SHA-256 password hashing~~ | ~~Rainbow table vulnerability~~ | ✅ Fixed (bcrypt) |
| ~~Non-cryptographic JWT~~ | ~~Token forgery possible~~ | ✅ Fixed (PyJWT) |
| Default API key grants admin | Unauthorized admin access | ⚠️ Document in deploy |
| Bucket logs grow unbounded | Disk exhaustion | Open — add log rotation |
| No rate limit per API key | Abuse from single consumer | Open — global only |

---

## 11. What HackaVerse Owns

- ✅ Hackathon event lifecycle (create → active → ended)
- ✅ Team registration and management
- ✅ Submission collection with file uploads
- ✅ AI-assisted judging execution
- ✅ Scoring rubric definition
- ✅ Leaderboard calculation
- ✅ User authentication within its own boundary (bcrypt + PyJWT)
- ✅ Email and Discord notifications
- ✅ Real-time WebSocket push
- ✅ Audit trail for its own operations
- ✅ Automated test suite and CI/CD pipeline

---

## 12. What HackaVerse Does NOT Own

- ❌ Cross-platform user identity (no SSO/federation)
- ❌ Ecosystem orchestration logic
- ❌ Workflow scheduling or cron execution (Render cron is external)
- ❌ Data sovereignty decisions across ecosystems
- ❌ AI model training or fine-tuning
- ❌ Notification delivery guarantees (fire-and-forget)
- ❌ Financial or payment processing

---

## 13. Deterministic Participation Expectations

For HackaVerse to participate correctly in TANTRA:

| Expectation | Current Status | Action Needed |
|------------|---------------|---------------|
| Stable API contract | ✅ OpenAPI at /openapi.json | Version and pin |
| Predictable startup | ✅ Health endpoint | No change |
| Environment documentation | ✅ ENV_REFERENCE.md | Maintain |
| Security hygiene | ✅ bcrypt + PyJWT + CORS | Monitor |
| Automated testing | ✅ pytest + GitHub Actions | Maintain |
| Trace propagation | ⚠️ Partial (KSML) | Add correlation IDs |
| Event emission | ❌ Not implemented | Add webhook/event bus |
| Schema versioning | ❌ Not implemented | Add API versioning |
