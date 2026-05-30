# HackaVerse — TESTING READY

**A tester should be able to validate the platform within 10 minutes.**

---

## 1. Prerequisites

- **Python 3.10+** (backend)
- **Node.js 18+** & **npm** (frontend)
- **Git** (to clone)
- Internet connection (MongoDB Atlas, Groq API)

---

## 2. Clone & Setup

```bash
git clone https://github.com/blackholeinfiverse37/Hackaverse.git
cd Hackaverse
```

---

## 3. Backend Setup

```bash
cd hackathon

# Create virtual environment
python -m venv venv

# Activate (Windows)
.\venv\Scripts\Activate.ps1

# Activate (macOS/Linux)
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Environment Variables

Copy `.env.example` to `.env` and fill in required values:

```bash
cp .env.example .env
```

| Variable | Purpose | Required |
|----------|---------|----------|
| `MONGODB_URI` | MongoDB Atlas connection string | ✅ Yes |
| `API_KEY` | Backend API key (must match frontend `VITE_API_KEY`) | ✅ Yes |
| `JWT_SECRET` | JWT signing secret | ✅ Yes |
| `GROQ_API_KEY` | AI judging API key (fallback scores if missing) | Optional |
| `PORT` | Backend port | Default: `8000` |
| `ENV` | Environment mode | Default: `development` |

### Start Backend

```bash
cd hackathon
python -m uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

**Expected output:**
```
INFO:src.main:[STARTUP] HackaVerse Backend Starting...
INFO:src.main:[SUCCESS] Backend Ready! Database: Connected | Docs: /docs
```

**Verify:** Open `http://localhost:8000/docs` — you should see Swagger UI with versioned routes under `/api/v1`.

---

## 4. Frontend Setup

```bash
cd hackaverse-frontend

# Install dependencies
npm install
```

### Environment Variables

Create or verify `.env` in `hackaverse-frontend/`:

```env
VITE_API_URL=http://localhost:8000
VITE_API_KEY=<your-api-key-matching-backend>
```

> **Important:** `VITE_API_KEY` must match the `API_KEY` in `hackathon/.env`.  
> **Note:** The frontend automatically appends `/api/v1` to the base URL. Do NOT include it in `VITE_API_URL`.

### Start Frontend

```bash
npm run dev
```

**Expected output:**
```
VITE v5.x.x ready in Xms
➜ Local:   http://localhost:3000/
```

---

## 5. Test Credentials

### Register a New User (recommended)

```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -H "X-API-Key: <your-api-key>" \
  -d '{"name": "Test User", "email": "test@hackaverse.com", "password": "TestPass123!"}'
```

### Login

```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -H "X-API-Key: <your-api-key>" \
  -d '{"email": "test@hackaverse.com", "password": "TestPass123!"}'
```

**Expected response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "access_token": "eyJ...",
    "refresh_token": "eyJ...",
    "token_type": "bearer",
    "user": {
      "user_id": "usr_xxx",
      "email": "test@hackaverse.com",
      "name": "Test User",
      "role": "participant"
    }
  },
  "trace_id": "hv-a1b2c3d4e5f67890",
  "error_code": null
}
```

---

## 6. Test Routes

### Health Check (no auth required)
```bash
curl http://localhost:8000/health
```
Expected: `{"success": true, "message": "Service is healthy", ...}`

### System Health (no auth required)
```bash
curl http://localhost:8000/api/v1/system/health
```
Expected: `{"success": true, "data": {"status": "healthy", "database": "connected", ...}}`

### List Hackathons (API key required)
```bash
curl http://localhost:8000/api/v1/hackathons \
  -H "X-API-Key: <your-api-key>"
```
Expected: `{"success": true, "data": [...], "trace_id": "hv-..."}`

### List Teams (auth + API key required)
```bash
curl http://localhost:8000/api/v1/teams/list \
  -H "Authorization: Bearer <token_from_login>" \
  -H "X-API-Key: <your-api-key>"
```
Expected: `{"success": true, "data": [...], "trace_id": "hv-..."}`

### Admin Dashboard (API key required)
```bash
curl http://localhost:8000/api/v1/admin/dashboard \
  -H "X-API-Key: <your-api-key>"
```
Expected: `{"success": true, "data": {"totalParticipants": ..., "activeTeams": ...}}`

### Judging Rubric (API key required)
```bash
curl http://localhost:8000/api/v1/judge/rubric \
  -H "X-API-Key: <your-api-key>"
```
Expected: `{"success": true, "data": {"criteria": {...}, "weights": {...}}}`

---

## 7. Expected Error Behavior

### Missing API Key
```bash
curl http://localhost:8000/api/v1/hackathons
```
Expected:
```json
{
  "success": false,
  "message": "Invalid or missing API Key",
  "data": null,
  "trace_id": "hv-xxx",
  "error_code": "AUTH_INVALID_TOKEN"
}
```

### Invalid Login
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -H "X-API-Key: <your-api-key>" \
  -d '{"email": "wrong@test.com", "password": "wrong"}'
```
Expected: `{"success": false, "message": "Invalid email or password", "error_code": "AUTH_INVALID_TOKEN", "trace_id": "hv-..."}`

### Validation Error (missing required field)
```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -H "X-API-Key: <your-api-key>" \
  -d '{"email": "test@test.com"}'
```
Expected: `{"success": false, "error_code": "VALIDATION_ERROR", "trace_id": "hv-..."}`

### Replay Detection
```bash
# Submit once (should succeed)
curl -X POST http://localhost:8000/api/v1/judge/submit \
  -H "Content-Type: application/json" \
  -H "X-API-Key: <your-api-key>" \
  -d '{"submission_text": "Test", "team_id": "t1", "request_id": "test-replay-001"}'

# Submit same request_id again (should return 409)
curl -X POST http://localhost:8000/api/v1/judge/submit \
  -H "Content-Type: application/json" \
  -H "X-API-Key: <your-api-key>" \
  -d '{"submission_text": "Test", "team_id": "t1", "request_id": "test-replay-001"}'
```
Expected on second call: `{"success": false, "message": "Replay detected", ...}` (HTTP 409)

---

## 8. Trace Continuity Check

1. Make any API request
2. Check the **response headers** — `X-Request-Id` should contain `hv-<hex16>`
3. Check the **response body** — `trace_id` should match the header
4. In the **backend console**, you should see structured log entries with the same `trace_id`

```bash
# Check X-Request-Id header
curl -v http://localhost:8000/api/v1/hackathons \
  -H "X-API-Key: <your-api-key>" 2>&1 | grep -i "x-request-id"
```

### Trace Parent Propagation Check

```bash
# First request — no parent
curl -v http://localhost:8000/api/v1/hackathons \
  -H "X-API-Key: <your-api-key>" 2>&1 | grep "x-request-id"
# Note the returned trace_id (e.g., hv-abc123)

# Second request — send previous trace as parent
curl -v http://localhost:8000/api/v1/hackathons \
  -H "X-API-Key: <your-api-key>" \
  -H "X-Trace-Parent: hv-abc123" 2>&1 | grep "x-request-id"
# Backend logs should show parent_trace_id = "hv-abc123"
```

---

## 9. Frontend Validation Checklist

### Login Flow
- [ ] Open `http://localhost:3000`
- [ ] Click "Register" → fill form → submit
- [ ] Verify: redirected to dashboard (tokens stored correctly)
- [ ] Refresh page → verify: still logged in (token persisted)
- [ ] Click "Logout" → verify: redirected to login page

### API Response Parsing
- [ ] Open browser DevTools → Network tab
- [ ] Login → check response body has `{success, message, data: {access_token, ...}, trace_id}`
- [ ] Verify `X-Request-Id` header matches `trace_id` in body

### Error Handling
- [ ] Try login with wrong password → verify error message displayed
- [ ] Try accessing dashboard without login → verify redirect to login

---

## 10. Quick Validation Checklist

- [ ] Backend starts without errors
- [ ] `/docs` shows Swagger UI with versioned routes
- [ ] `/health` returns `{"success": true}`
- [ ] `/api/v1/system/health` returns database status
- [ ] Register → Login flow works via curl
- [ ] `X-Request-Id` header present in all responses
- [ ] `trace_id` in response body matches `X-Request-Id` header
- [ ] Error responses include `error_code` and `trace_id`
- [ ] Frontend loads at `http://localhost:3000`
- [ ] Frontend login flow works (tokens stored correctly)
- [ ] Frontend console shows trace logs on API errors
- [ ] `/api/v1/hackathons` returns hackathon list
- [ ] `/api/v1/teams/list` returns team list (with auth)
- [ ] Replay protection returns 409 on duplicate request_id

---

## 11. Contract Schema Exports

The following machine-readable contracts are available in `docs/contracts/`:

| Contract | File | Purpose |
|----------|------|---------|
| API Response | `api_response_contract.json` | Canonical response envelope schema |
| Event Payload | `event_payload.json` | Event emission schema |
| Judging Contract | `judging_contract.json` | AI judging result schema |
| Replay Event | `replay_event.json` | Replay verification schema |
| Submission Contract | `submission_contract.json` | Submission input schema |

These contracts are designed for TANTRA ecosystem consumption and can be imported by any governed workflow participant.
