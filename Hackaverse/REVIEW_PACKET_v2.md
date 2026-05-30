# HackaVerse — Review Packet v2 (Production-Hardened)

> **Future Engineer Survival Kit — everything you need to understand, run, verify, and extend HackaVerse.**
> Generated: 2026-05-11 | Sprint: Full Production Hardening

---

## Table of Contents

1. [System Identity](#1-system-identity)
2. [Architecture Overview](#2-architecture-overview)
3. [Technology Stack](#3-technology-stack)
4. [Startup Flow](#4-startup-flow)
5. [Environment Map](#5-environment-map)
6. [API Surface](#6-api-surface)
7. [Execution Flows](#7-execution-flows)
8. [Security Architecture](#8-security-architecture)
9. [Data Model](#9-data-model)
10. [Failure Modes](#10-failure-modes)
11. [Deployment](#11-deployment)
12. [Ecosystem Position (TANTRA)](#12-ecosystem-position)
13. [Proof of Functionality](#13-proof-of-functionality)
14. [Current Status — Resolved vs Remaining](#14-current-status)
15. [Quick Start](#15-quick-start)
16. [Document Index](#16-document-index)

---

## 1. System Identity

| Attribute | Value |
|-----------|-------|
| **Name** | HackaVerse |
| **Purpose** | AI-powered hackathon management platform |
| **Completion** | ~85–90% |
| **Stage** | Production-hardened, deployed |
| **Maintainer** | BHIV (BlackHole InfiVerse) ecosystem |
| **License** | Private |

### What HackaVerse Does
- Manages hackathon events (create, activate, close)
- Handles participant registration and team formation
- Collects project submissions with **file uploads**
- Performs AI-assisted judging via multi-agent LLM consensus
- Displays rankings on a leaderboard
- Sends **email notifications** (SMTP) and **Discord webhook** alerts
- Provides **real-time WebSocket** push notifications
- Maintains structured audit trail (KSML logging)

### What HackaVerse Does NOT Do
- Payment processing
- Video conferencing
- Cross-platform SSO
- Ecosystem orchestration (it's a participant, not an orchestrator)

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        HACKAVERSE                               │
│                                                                 │
│  ┌──────────────────┐         ┌──────────────────────────────┐  │
│  │  React Frontend   │ ◄────► │     FastAPI Backend           │  │
│  │  (Vite + React)   │  REST  │     (Python 3.10+)            │  │
│  │  Port: 3000       │  +WS   │     Port: 8000                │  │
│  │  Deploy: Vercel   │        │     Deploy: Render            │  │
│  └──────────────────┘         └──────────┬───────────────────┘  │
│                                          │                      │
│                          ┌───────────────┼───────────────┐      │
│                          ▼               ▼               ▼      │
│                    ┌──────────┐   ┌──────────┐   ┌──────────┐   │
│                    │ MongoDB  │   │ Groq API │   │ Bucket   │   │
│                    │ Atlas    │   │ (LLM)    │   │ (Local)  │   │
│                    └──────────┘   └──────────┘   └──────────┘   │
│                          │                                      │
│               ┌──────────┼──────────┐                           │
│               ▼          ▼          ▼                           │
│         ┌──────────┐ ┌────────┐ ┌──────────┐                   │
│         │ SMTP     │ │Discord │ │ File     │                   │
│         │ Email    │ │Webhook │ │ Storage  │                   │
│         └──────────┘ └────────┘ └──────────┘                   │
└─────────────────────────────────────────────────────────────────┘
```

**Key architectural decisions:**
- Monolithic backend (single FastAPI app, not microservices)
- MongoDB as sole persistence layer
- Groq for LLM inference (not OpenAI — cheaper, faster)
- **Proper JWT** (PyJWT with HMAC-SHA256) for authentication
- **bcrypt** for password hashing (backward-compatible with legacy SHA-256)
- Local file-based audit logging (KSML structured events)
- WebSocket endpoint for real-time notifications

---

## 3. Technology Stack

### Backend
| Component | Technology | Version |
|-----------|-----------|---------|
| Framework | FastAPI | 0.118.0 |
| Runtime | Python | 3.10+ |
| Database | MongoDB Atlas | Cloud |
| AI/LLM | Groq (via langchain) | API |
| Auth | **PyJWT** (HMAC-SHA256) | >=2.8.0 |
| Password Hashing | **bcrypt** | >=4.0.0 |
| Email | aiosmtplib | >=3.0.0 |
| WebSocket | Built-in FastAPI | — |
| Security | HMAC signatures, nonce replay protection | Custom |
| Logging | KSML structured logging | Custom |
| Testing | pytest + pytest-asyncio | 7.4.0 |
| CI/CD | GitHub Actions | — |

### Frontend
| Component | Technology | Version |
|-----------|-----------|---------|
| Framework | React | 18+ |
| Build Tool | Vite | 7+ |
| HTTP Client | Axios | Latest |
| Routing | React Router | v6 |
| Styling | Tailwind CSS + Custom CSS | — |
| Icons | Unicons | CDN |

### Infrastructure
| Component | Technology |
|-----------|-----------|
| Backend Hosting | Render (free tier) |
| Frontend Hosting | Vercel |
| Database | MongoDB Atlas (free tier) |
| AI Inference | Groq API (free tier) |
| CI/CD | GitHub Actions |

---

## 4. Startup Flow

### Backend Startup Sequence
```
1. uvicorn loads src/main.py
2. Load .env (dotenv from hackathon/.env)
3. Create FastAPI app
4. Parse ALLOWED_ORIGINS env var → configure CORS
5. Add SecurityMiddleware
6. Register all 19 route modules (including file uploads)
7. Register WebSocket endpoint (/ws/{user_id})
8. @app.on_event("startup"):
   └─ connect_to_db()
       ├─ Success: "✅ MongoDB Connected"
       └─ Failure: "⚠️ Degraded Mode"
9. Server ready on PORT
```

### Frontend Startup Sequence
```
1. Vite loads index.html
2. main.jsx initializes React
3. AuthProvider checks localStorage for token
4. App.jsx renders based on auth state
5. SyncContext fetches initial data from backend
6. UI renders
```

### Startup Order (Mandatory)
1. Ensure MongoDB Atlas is reachable
2. Start backend: `python -m uvicorn src.main:app --reload --port 8000`
3. Verify: `curl http://localhost:8000/health`
4. Start frontend: `npm run dev` (from `hackaverse-frontend/`)
5. Verify: Open `http://localhost:3000`

---

## 5. Environment Map

### Backend (`hackathon/.env`)

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `MONGODB_URI` | **Yes** | *(none)* | Database connection |
| `GROQ_API_KEY` | **Yes** (AI) | *(none)* | LLM inference |
| `API_KEY` | Recommended | `default_key` | API authentication |
| `JWT_SECRET` | **Yes** (prod) | `hackaverse-dev-...` | JWT token signing |
| `JWT_EXPIRY_HOURS` | No | `24` | Token lifetime |
| `AUTHOR_PASSWORD` | No | `change_me_in_production` | Admin password |
| `ALLOWED_ORIGINS` | **Yes** (prod) | `*` | CORS config (comma-separated) |
| `SMTP_SERVER` | No | `smtp.gmail.com` | Email notifications |
| `EMAIL_USER` | No | *(empty)* | SMTP username |
| `EMAIL_PASSWORD` | No | *(empty)* | SMTP password |
| `DISCORD_WEBHOOK_URL` | No | *(empty)* | Discord notifications |
| `UPLOAD_DIR` | No | `./data/uploads` | File upload storage |
| `MAX_UPLOAD_SIZE_MB` | No | `10` | Max file upload size |
| `PORT` | No | `8000` | Server port |
| `ENV` | No | `development` | Environment flag |

### Frontend (`hackaverse-frontend/.env`)

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `VITE_API_URL` | **Yes** | `localhost:8000` | Backend URL |
| `VITE_API_KEY` | Recommended | *(empty)* | API authentication |

**Full reference:** See [ENV_REFERENCE.md](./ENV_REFERENCE.md)

---

## 6. API Surface

### Route Map (19 registered modules)

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/auth/register` | None | User registration |
| POST | `/auth/login` | None | User login |
| GET | `/auth/profile` | Bearer | Get current user |
| POST | `/judge/score` | API Key | AI-assisted scoring |
| POST | `/judge/rank` | API Key | Get rankings |
| GET | `/hackathons/active` | API Key | Active hackathons |
| GET | `/api/hackathons` | API Key | All hackathons |
| POST | `/teams/create` | API Key + Bearer | Create team |
| GET | `/teams/list` | API Key | List teams |
| GET | `/user/profile` | Bearer | User profile |
| PUT | `/user/profile` | Bearer | Update profile |
| POST | `/submissions` | API Key + Bearer | Submit project |
| GET | `/submissions` | API Key | List submissions |
| GET | `/leaderboard` | API Key | View leaderboard |
| POST | `/uploads` | API Key + Bearer | Upload file |
| GET | `/uploads/{id}` | None | Download file |
| GET | `/health` | None | Health check |
| GET | `/system/db-status` | None | DB status |
| WS | `/ws/{user_id}` | None | WebSocket real-time |
| GET | `/docs` | None | Swagger UI |

### Authentication Model
```
Frontend Request
  ├─ X-API-Key: <from VITE_API_KEY>        → Validates API consumer identity
  ├─ Authorization: Bearer <JWT token>     → Validates user identity (PyJWT signed)
  └─ Content-Type: application/json
```

---

## 7. Execution Flows

### Critical Path: AI Judging
```
User submits → POST /judge/score
  → Load scoring rubric (5 criteria)
  → Spawn 3 AI agents (Groq LLM)
  → Each agent scores independently
  → Consensus engine averages scores
  → Store judgment in MongoDB
  → Write KSML log to bucket
  → Send email notification (if SMTP configured)
  → Send Discord notification (if webhook configured)
  → Push WebSocket event to user
  → Return scores to frontend
```

### Fallback Path (No Groq Key)
```
User submits → POST /judge/score
  → Detect missing GROQ_API_KEY
  → Return fallback score (50/100)
  → Mark response: fallback: true
```

### File Upload Flow
```
User uploads → POST /uploads (multipart/form-data)
  → Validate file extension (png,jpg,pdf,zip,md,txt)
  → Validate file size (<= 10 MB)
  → Generate unique file ID
  → Store file to UPLOAD_DIR
  → Store metadata in MongoDB (files collection)
  → Return file_id and download_url
```

**Full flow documentation:** See [EXECUTION_FLOW_ANALYSIS.md](./EXECUTION_FLOW_ANALYSIS.md)

---

## 8. Security Architecture

### Layers (7-deep)
1. **CORS** — Origin validation via `ALLOWED_ORIGINS` env var (locked to specific domains in production)
2. **API Key** — Consumer identity via `X-API-Key` header
3. **Bearer Token** — User identity via proper **PyJWT** (HMAC-SHA256 signed, expiry enforced)
4. **Password Hashing** — **bcrypt** with auto-salt (backward compat with legacy SHA-256, auto-rehash on login)
5. **Rate Limiter** — 60 requests/minute/IP
6. **HMAC Signatures** — Request integrity for `/workflows` endpoints
7. **Nonce Replay Protection** — Prevents request replay on `/workflows`

### Security Fixes — All Completed ✅

| Issue | Status | Fix |
|-------|--------|-----|
| Hardcoded API keys (17 instances) | ✅ Fixed | Centralized `apiKey.js` module |
| SHA-256 password hashing (no salt) | ✅ Fixed | Migrated to bcrypt with auto-rehash on login |
| Non-cryptographic JWT (random signature) | ✅ Fixed | PyJWT with HMAC-SHA256 + `JWT_SECRET` env var |
| CORS wildcard in production | ✅ Fixed | `ALLOWED_ORIGINS` env var (comma-separated domains) |
| Hardcoded localhost URL | ✅ Fixed | Uses `VITE_API_URL` env var |
| Corrupted `.gitignore` | ✅ Fixed | UTF-16 null bytes removed |
| MongoDB credentials in git history | ⚠️ Documented | See [CREDENTIAL_ROTATION_GUIDE.md](./CREDENTIAL_ROTATION_GUIDE.md) |
| `default_key` grants admin | ⚠️ Documented | Requires explicit `API_KEY` in production |

---

## 9. Data Model

### MongoDB Collections (17)

| Collection | Purpose | Key Fields |
|-----------|---------|------------|
| `users` | User accounts | `user_id`, `email`, `password_hash` (bcrypt), `role` |
| `sessions` | Auth sessions | `user_id`, `token`, `expires_at` |
| `teams` | Team data | `team_id`, `hackathon_id`, `members[]` |
| `hackathons` | Event definitions | `id`, `name`, `status`, `start_date`, `end_date` |
| `submissions` | Project submissions | `submission_id`, `team_id`, `title`, `description` |
| `judgments` | AI scoring results | `team_id`, `scores{}`, `total_score` |
| `provenance_logs` | Audit chain | `entry_hash`, `previous_hash`, `intent`, `actor` |
| `notifications` | User notifications | `user_id`, `title`, `message`, `read` |
| `invitations` | Team invitations | `team_id`, `invitee_email`, `status` |
| `hackathon_participants` | Enrollment | `hackathon_id`, `user_id` |
| `user_teams` | User-team mapping | `user_id`, `team_id` |
| `team_members` | Team membership | `team_id`, `user_id`, `role` |
| `announcements` | Admin announcements | `title`, `message`, `hackathon_id` |
| `activities` | Activity feed | `user_id`, `action`, `timestamp` |
| `files` | Uploaded files | `file_id`, `original_name`, `uploaded_by` |
| `rewards` | Rewards/badges | `team_id`, `reward_type` |

### Local Storage

| Directory | Purpose |
|-----------|---------|
| `data/bucket/` | KSML structured audit logs (JSON files) |
| `data/uploads/` | User-uploaded files (screenshots, PDFs, etc.) |
| `data/teams.json` | Seed/fallback team data |
| `data/projects.json` | Seed/fallback project data |

---

## 10. Failure Modes

| Failure | Detection | Impact | Recovery |
|---------|-----------|--------|----------|
| MongoDB down | `/health` → `"degraded"` | No data persistence | Fix connection, restart |
| Groq API down | Judge returns `fallback: true` | AI scoring unavailable | Add API key, check network |
| BHIV Core down | Logger warning | Local logging continues | Start BHIV or ignore |
| Wrong API key | HTTP 401 | All auth requests fail | Match VITE_API_KEY ↔ API_KEY |
| CORS error | Browser console | Frontend can't reach backend | Set ALLOWED_ORIGINS |
| JWT expired | HTTP 401 `"Token has expired"` | User must re-login | Frontend auto-redirects |
| SMTP not configured | Email silently skipped | No email notifications | Add EMAIL_USER + PASSWORD |
| Discord not configured | Webhook silently skipped | No Discord alerts | Add DISCORD_WEBHOOK_URL |
| Upload too large | HTTP 413 | File rejected | Increase MAX_UPLOAD_SIZE_MB |

**Full failure guide:** See [FAILURE_OBSERVABILITY.md](./FAILURE_OBSERVABILITY.md)

---

## 11. Deployment

| Component | Platform | Trigger | Health Check |
|-----------|----------|---------|-------------|
| Backend | Render | Git push | `GET /health` |
| Frontend | Vercel | Git push | Page loads |
| Database | MongoDB Atlas | Always on | Atlas dashboard |
| CI/CD | GitHub Actions | Push/PR to main | Actions tab |

**CI/CD Pipeline (`.github/workflows/ci.yml`):**
- ✅ Backend tests with coverage (pytest)
- ✅ Backend linting (flake8 + black + isort)
- ✅ Frontend build validation
- ✅ Security dependency audit (pip-audit + npm audit)

**Full deployment reference:** See [DEPLOYMENT_NOTES.md](./DEPLOYMENT_NOTES.md)

---

## 12. Ecosystem Position (TANTRA)

**HackaVerse is a leaf node in the TANTRA ecosystem topology.**

- It does NOT orchestrate other systems
- It does NOT enforce ecosystem policies
- It PROVIDES: judging engine, ranking system, audit trail
- It CONSUMES: MongoDB, Groq API (external services)

### Reusable Surfaces for Ecosystem

| Surface | Ready? | Potential Consumers |
|---------|--------|---------------------|
| AI Judging Pipeline | ✅ Yes | Gurukul, AIAIC, Marine, Workforce |
| Ranking Engine | ✅ Yes | Any system needing scored rankings |
| User Auth (JWT) | ✅ Yes | Now uses proper PyJWT + bcrypt |
| KSML Audit Trail | ✅ Yes | Any system needing structured logging |
| Email Notifications | ✅ Yes | Template-based, reusable |
| File Upload System | ✅ Yes | Any system needing file management |

### Integration Safety Rules
1. Always use `tenant_id` to isolate scoring contexts
2. Handle `"fallback": true` responses (Groq unavailable)
3. Respect rate limits (60 req/min/IP)
4. Use the API key contract — never bypass via direct DB access
5. Expect cold starts on Render free tier (15 min inactivity)

**Full alignment:** See [TANTRA_ALIGNMENT.md](./TANTRA_ALIGNMENT.md)
**Integration boundaries:** See [INTEGRATION_BOUNDARY_MAP.md](./INTEGRATION_BOUNDARY_MAP.md)

---

## 13. Proof of Functionality

### How to Verify the System Works

```bash
# 1. Backend boots
python -m uvicorn src.main:app --reload --port 8000
# Expected: "[SUCCESS] Backend Ready!" or "[WARNING] Degraded Mode"

# 2. Health check
curl http://localhost:8000/health
# Expected: {"success": true, "data": {"status": "ok", ...}}

# 3. API docs accessible
# Open: http://localhost:8000/docs
# Expected: Swagger UI with all 19+ route modules visible

# 4. Register a user (bcrypt hashing)
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"test123456","role":"participant"}'
# Expected: {"success": true, "data": {"access_token": "eyJ...", ...}}

# 5. Login (JWT issued)
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123456"}'
# Expected: {"success": true, "data": {"access_token": "eyJ...", ...}}

# 6. Frontend connects
npm run dev  # from hackaverse-frontend/
# Open: http://localhost:3000
# Expected: Login page loads, no console errors

# 7. Degraded mode (remove MONGODB_URI from .env)
# Expected: Backend starts with "[WARNING] Degraded Mode"
# /health returns {"data": {"status": "degraded"}}

# 8. Run automated tests
cd hackathon && python -m pytest tests/ -v
# Expected: All tests pass
```

### WebSocket Verification
```javascript
// In browser console:
const ws = new WebSocket("ws://localhost:8000/ws/test_user");
ws.onmessage = (e) => console.log("Received:", e.data);
ws.onopen = () => ws.send("ping");
// Expected: "pong" response
```

---

## 14. Current Status — Resolved vs Remaining

### ✅ RESOLVED (This Sprint)

| Issue | Resolution |
|-------|------------|
| 4 unregistered route files | All registered in `main.py` (teams, user_profile, submissions_crud, missing_endpoints) |
| SHA-256 password hashing | Migrated to **bcrypt** with backward-compatible auto-rehash |
| Non-cryptographic JWT | **PyJWT** with HMAC-SHA256 + configurable `JWT_SECRET` |
| CORS wildcard | `ALLOWED_ORIGINS` env var with production lockdown |
| No automated tests | **4 test modules** (40+ test cases): health, auth, endpoints, services |
| No CI/CD pipeline | **GitHub Actions** workflow: test, lint, build, security audit |
| No email notifications | **email_service.py** — async SMTP with HTML templates |
| No Discord integration | **discord_service.py** — webhook notifications with rich embeds |
| No file upload system | **file_uploads.py** — upload/download/list/delete with validation |
| No WebSocket | `/ws/{user_id}` endpoint for real-time push notifications |
| 17 hardcoded API keys | Centralized to `apiKey.js` (previous sprint) |
| Corrupted .gitignore | Fixed (previous sprint) |
| Scattered documentation | 20+ docs created and organized (previous sprint) |

### ⚠️ REMAINING (Manual Steps Required)

| Issue | Action | Guide |
|-------|--------|-------|
| MongoDB creds in git history | Rotate creds + BFG cleanup | [CREDENTIAL_ROTATION_GUIDE.md](./CREDENTIAL_ROTATION_GUIDE.md) |
| `render.yaml` has secrets | Move to Render dashboard env vars | Manual |
| No staging environment | Create staging branch + separate deployment | Team decision |
| No log aggregation | Add Datadog/Papertrail | Infrastructure |
| No monitoring/alerting | Add UptimeRobot/Better Stack | Infrastructure |

---

## 15. Quick Start

```bash
# Backend
cd hackathon
python -m venv venv && venv\Scripts\activate  # Windows
pip install -r requirements.txt
cp .env.example .env  # Edit: MONGODB_URI, API_KEY, JWT_SECRET
python -m uvicorn src.main:app --reload --port 8000

# Frontend (new terminal)
cd hackaverse-frontend
npm install
cp .env.example .env  # Edit: VITE_API_URL, VITE_API_KEY
npm run dev

# Verify
curl http://localhost:8000/health
# Open http://localhost:3000

# Run tests
cd hackathon
python -m pytest tests/ -v --cov=src
```

---

## 16. Document Index

| Document | Purpose |
|----------|---------|
| [DEVELOPMENT.md](./DEVELOPMENT.md) | Setup and onboarding guide |
| [ENV_REFERENCE.md](./ENV_REFERENCE.md) | Complete environment variable reference |
| [LOCAL_VS_PRODUCTION.md](./LOCAL_VS_PRODUCTION.md) | Environment differences |
| [SECURITY_CLEANUP_REPORT.md](./SECURITY_CLEANUP_REPORT.md) | Security audit (12 findings) |
| [DETERMINISTIC_STARTUP_CHECKLIST.md](./DETERMINISTIC_STARTUP_CHECKLIST.md) | Gate-based startup validation |
| [ONBOARDING_FAQ.md](./ONBOARDING_FAQ.md) | 20 common questions |
| [TANTRA_ALIGNMENT.md](./TANTRA_ALIGNMENT.md) | Ecosystem positioning |
| [INTEGRATION_BOUNDARY_MAP.md](./INTEGRATION_BOUNDARY_MAP.md) | Reusability analysis |
| [EXECUTION_FLOW_ANALYSIS.md](./EXECUTION_FLOW_ANALYSIS.md) | 8 execution flows traced |
| [FAILURE_OBSERVABILITY.md](./FAILURE_OBSERVABILITY.md) | Failure detection and recovery |
| [DEPLOYMENT_NOTES.md](./DEPLOYMENT_NOTES.md) | Render + Vercel deployment |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | Code conventions and PR rules |
| [CONVERGENCE_SUMMARY.md](./CONVERGENCE_SUMMARY.md) | Sprint completion report |
| [CREDENTIAL_ROTATION_GUIDE.md](./CREDENTIAL_ROTATION_GUIDE.md) | MongoDB credential rotation + BFG cleanup |
