# HackaVerse — REVIEW PACKET v4 (TANTRA Convergence Sprint)

**Date:** 2026-05-26  
**Version:** v5.1 → v5.2 (Convergence Hardening)  
**Status:** Post-Stabilization + Convergence Complete + Trace Lineage Added  
**Sprint Type:** 1-day convergence stabilization  

---

## 1. Entry Points

| Surface | URL | Protocol |
|---------|-----|----------|
| Frontend | `https://hackaverse-mu.vercel.app` | HTTPS |
| Backend API | `https://hackaverse.blackholeinfiverse.com/api/v1` | HTTPS |
| Swagger Docs | `/docs` | HTTPS |
| ReDoc | `/redoc` | HTTPS |
| WebSocket | `wss://host/ws/{user_id}` | WSS |
| Health Check | `/health` | GET |
| System Ready | `/system/ready` | GET |
| System Health | `/api/v1/system/health` | GET |

---

## 2. Core Execution Flow

```
User → Frontend (React/Vite)
  → Axios Interceptor
    ├─ Adds: Authorization (Bearer JWT)
    ├─ Adds: X-API-Key (env-configured)
    ├─ Adds: X-Trace-Parent (last known trace_id)
    └─ POST /api/v1/{resource}
      → TraceIdMiddleware
        ├─ Generates: trace_id = "hv-<hex16>"
        ├─ Captures: X-Trace-Parent → parent_trace_id
        └─ Sets: request.state.trace_id, request.state.parent_trace_id
      → SecurityMiddleware
        ├─ Validates: API key
        ├─ Validates: Nonce (anti-replay)
        ├─ Validates: Rate limit
        └─ Validates: Request signature (if SECURITY_SECRET_KEY set)
      → Auth Layer (JWT verification)
        ├─ Extracts: user_id from JWT claims
        └─ Sets: request.state.user_id
      → Route Handler
        ├─ Business logic execution
        ├─ CorrelationLogger.from_request(request)
        │   └─ Logs: {trace_id, parent_trace_id, route, method, user_id, elapsed_ms}
        ├─ MongoDB read/write
        └─ AI Judge (Groq) if scoring
      → APIResponse
        ├─ Returns: {success, message, data, trace_id, error_code}
        └─ Header: X-Request-Id = trace_id
      → Frontend Interceptor
        ├─ Captures: X-Request-Id header → _lastTraceId
        ├─ Stores: response.traceId for debugging
        └─ On error: console.warn("[HackaVerse] trace_id=hv-...")
```

---

## 3. Live Execution Chain

### Successful Login
```
POST /api/v1/auth/login
→ X-Trace-Parent: hv-previous (if available)
→ TraceId: hv-a1b2c3d4e5f67890
→ SecurityMiddleware: API key validated
→ Route: verify password (bcrypt), generate JWT
→ Response: {
    success: true,
    data: {access_token, refresh_token, token_type, user},
    trace_id: "hv-a1b2..."
  }
→ X-Request-Id: hv-a1b2c3d4e5f67890
→ Frontend: payload = response.data.data → stores tokens
```

### Failed Login
```
POST /api/v1/auth/login
→ TraceId: hv-f1e2d3c4b5a67890
→ Route: password mismatch
→ Error Handler: HTTPException(401)
→ Response: {
    success: false,
    message: "Invalid email or password",
    trace_id: "hv-f1e2...",
    error_code: "AUTH_INVALID_TOKEN"
  }
```

### Submission + AI Judging
```
POST /api/v1/judge/submit
→ TraceId: hv-1234567890abcdef
→ Replay Protection: check request_id uniqueness
→ Orchestration:
  Step 1: Multi-Agent AI Judge → consensus_score
  Step 2: Reward calculation → reward_value
  Step 3: Provenance logging → hash-linked entry
→ Webhook: dispatch_event("submission.scored", {...})
→ Response: {
    success: true,
    data: {submission_hash, team_id, judging_result: {...}},
    trace_id: "hv-1234..."
  }
```

---

## 4. What Changed (This Sprint)

| Change | Files | Impact |
|--------|-------|--------|
| **P0: Frontend auth parsing fix** | `AuthContext.jsx` | Login/signup now correctly destructures `response.data.data` instead of `response.data`. Added token existence guard. |
| **Frontend /api/v1 migration** | `appConstants.js` | `API_BASE_URL` now appends `/api/v1` automatically. Frontend no longer depends on backward-compat routes. |
| **Trace parent propagation** | `api.js`, `main.py`, `correlation_logger.py` | Frontend sends `X-Trace-Parent` header. Backend captures as `parent_trace_id`. All logs include lineage. |
| **render.yaml hardening** | `render.yaml` | Removed hardcoded `API_KEY`. Locked `ALLOWED_ORIGINS` to specific domains. Added secret references for JWT_SECRET, GROQ_API_KEY. |
| **MCP import fix** | `routes/mcp.py` | Fixed `from src.mcp_router` → `from ..mcp_router` (relative import). |
| **Pydantic v2 migration** | `routes/judge.py` | All `.dict()` calls → `.model_dump()` for forward compatibility. |
| **apiClient.js deprecation** | `apiClient.js` | Deprecated with console warning + migration guide. Not deleted to avoid breaking imports. |
| **API response contract** | `docs/contracts/api_response_contract.json` | New exportable contract schema for TANTRA consumption. |
| **Ecosystem flow update** | `docs/ecosystem_flow.md` | Added parent trace lineage, MCP validation, structured log format, 5 contract exports. |
| **CorrelationLogger upgrade** | `correlation_logger.py` | Added `parent_trace_id` field, `__slots__` optimization, timezone-aware timestamps. |

---

## 5. What Was NOT Changed

| Item | Reason |
|------|--------|
| Database schema | No schema changes needed — contracts are at the API layer |
| Auth flow (JWT + bcrypt) | Already hardened in v5.0 |
| Groq AI judging pipeline | Working correctly, deterministic scoring maintained |
| WebSocket implementation | Already functional |
| Frontend component structure | Only interceptor and AuthContext updated |
| Security middleware logic | No changes to validation rules |
| Backward-compat routes | Kept for one more sprint cycle (safe removal pending) |
| Replay protection logic | Already deterministic |
| Provenance chain (security.py) | Already hash-linked |
| BHIV connectors | Already gracefully degrades |
| Email service | Already configured with SMTP fallback |

---

## 6. Failure Behavior

| Failure Scenario | HTTP Status | error_code | Response |
|-----------------|-------------|------------|----------|
| Missing auth token | 401 | `AUTH_INVALID_TOKEN` | `{success: false, message: "Missing Authorization header"}` |
| Expired JWT | 401 | `AUTH_INVALID_TOKEN` | `{success: false, message: "Token has expired"}` |
| Invalid API key | 401 | `AUTH_INVALID_TOKEN` | `{success: false, message: "Invalid or missing API Key"}` |
| Validation error | 422 | `VALIDATION_ERROR` | `{success: false, message: "Field 'name' is required..."}` |
| Resource not found | 404 | `RESOURCE_NOT_FOUND` | `{success: false, message: "Team not found"}` |
| Database down | 503 | `SERVICE_UNAVAILABLE` | `{success: false, message: "Database unavailable"}` |
| Unhandled exception | 500 | `INTERNAL_ERROR` | `{success: false, message: "Internal server error"}` |
| CSRF invalid | 403 | `CSRF_INVALID` | `{success: false, message: "CSRF token missing or invalid"}` |
| Replay detected | 409 | `RESOURCE_CONFLICT` | `{success: false, message: "Replay detected"}` |
| Rate limited | 429 | `RATE_LIMITED` | `{success: false, message: "Too many requests"}` |

**All failures include `trace_id` for correlation. No stack traces are exposed.**

---

## 7. Trace Propagation Proof

```
Frontend Request
  ├─ Sends: POST /api/v1/submissions
  ├─ Header: X-Trace-Parent = "hv-previous-trace" (from last response)
  │
Backend TraceIdMiddleware
  ├─ Generates: trace_id = "hv-abc123def456"
  ├─ Captures: parent_trace_id = "hv-previous-trace"
  ├─ Sets: request.state.trace_id, request.state.parent_trace_id
  │
CorrelationLogger
  ├─ Logs: {
  │    "trace_id": "hv-abc123def456",
  │    "parent_trace_id": "hv-previous-trace",
  │    "event_type": "request_started",
  │    "route": "/api/v1/submissions",
  │    "method": "POST",
  │    "user_id": "usr_001",
  │    "timestamp": "2026-05-26T10:30:00Z"
  │  }
  │
Route Handler
  ├─ Uses: CorrelationLogger.from_request(request)
  ├─ Logs: {"trace_id": "hv-abc123...", "parent_trace_id": "hv-previous...",
  │          "event_type": "submission_created", ...}
  │
APIResponse
  ├─ Returns: {"trace_id": "hv-abc123def456", "success": true, ...}
  │
Response Header
  ├─ X-Request-Id: hv-abc123def456
  │
Frontend Interceptor
  ├─ Captures: _lastTraceId = "hv-abc123def456"
  ├─ Next request sends: X-Trace-Parent = "hv-abc123def456"
  └─ Lineage: hv-previous → hv-abc123 → (next request)
```

**Trace lineage is now a directed graph: parent_trace_id → trace_id.**

---

## 8. Contract Normalization Proof

All API responses follow the `APIResponse` schema:

```json
{
  "success": true,
  "message": "Human-readable message",
  "data": {},
  "trace_id": "hv-<hex16>",
  "error_code": null
}
```

**Enforcement points:**
- `APIResponse` model in `src/schemas/response.py` — auto-generates trace_id
- `error_handler.py` middleware — catches all exceptions, wraps in APIResponse
- `CSRFMiddleware` in `main.py` — CSRF failures return APIResponse envelope
- `SecurityMiddleware` in `middleware.py` — auth failures return APIResponse envelope

**Error code registry:** `src/observability/error_codes.py`  
**Contract exports:** `docs/contracts/` (5 schemas)

---

## 9. TANTRA Participation Proof

| Requirement | Status | Evidence |
|-------------|--------|----------|
| Deterministic API contracts | ✅ | APIResponse schema enforced on all endpoints |
| Trace continuity | ✅ | `trace_id` + `parent_trace_id` flows frontend → backend → storage |
| Replay safety | ✅ | Nonce + request_id deduplication via `replay_protection.py` |
| Version-aware routing | ✅ | All frontend calls route through `/api/v1` |
| Exportable contracts | ✅ | 5 JSON schemas in `docs/contracts/` |
| Structured observability | ✅ | JSON correlation logs with trace lineage |
| No architectural drift | ✅ | Clean middleware stack, no hidden execution paths |
| Provenance chain | ✅ | Hash-linked ledger in `security.py` → `provenance_logs` collection |
| Webhook events | ✅ | `submission.scored` dispatched for downstream consumers |
| MCP routing | ✅ | Agent-based routing via `mcp_router.py` with APIResponse wrapping |

---

## 10. Deployment Proof

- **Backend**: Deployed on Render with MongoDB Atlas
  - `render.yaml` hardened: no plaintext secrets, CORS locked, health checks configured
  - Startup: `uvicorn src.main:app --host 0.0.0.0 --port $PORT`
  - Health check: `/system/ready`
- **Frontend**: Deployed on Vercel
  - SPA routing: `vercel.json` rewrites all paths to `/index.html`
  - Build: `vite build` with terser minification, console drops
- **CORS**: Locked to `hackaverse-mu.vercel.app`, `hackaverse.vercel.app`, `hackaverse.blackholeinfiverse.com`
- **API Key**: Validated in production (no default_key allowed)
- **JWT Secret**: Environment variable, never hardcoded
- **Docs**: Available at `/docs` and `/redoc`
- **Secrets**: API_KEY, JWT_SECRET, MONGODB_URI, GROQ_API_KEY stored as Render Secrets (not in repo)

---

## 11. Remaining Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Backward-compat routes still registered | Low | Kept for safety; remove after confirming all consumers use `/api/v1` |
| `apiClient.js` still importable | Low | Deprecated with console warning; migration guide in file header |
| No automated integration tests | Medium | `TESTING_READY.md` provides manual validation; pytest unit tests exist |
| WebSocket not auth-gated | Low | user_id in URL; production should add token validation |
| Rate limiting is in-memory | Low | Sufficient for current scale; production should use Redis |
| `.env` may have been committed historically | Medium | `.gitignore` already includes `.env`; recommend credential rotation |

---

## 12. Next 3 Recommended Tasks

1. **Remove backward-compat routes** — Once all frontend deployments are confirmed on `/api/v1`, remove the duplicate unversioned registrations from `main.py` (lines with `# backward-compat` comments)
2. **Add pytest integration tests** — Create a test suite that validates all APIResponse contracts against live endpoints with trace_id verification
3. **WebSocket authentication** — Add JWT verification to the WebSocket handshake for production security
