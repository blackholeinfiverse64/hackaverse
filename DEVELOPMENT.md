# HackaVerse — Development Guide

> **Canonical onboarding document for deterministic local setup and development.**
> Last updated: 2026-05-11

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture Summary](#architecture-summary)
3. [Prerequisites](#prerequisites)
4. [Backend Setup](#backend-setup)
5. [Frontend Setup](#frontend-setup)
6. [Startup Order](#startup-order)
7. [Health Checks & Verification](#health-checks--verification)
8. [API Verification](#api-verification)
9. [Troubleshooting](#troubleshooting)
10. [Deterministic Startup Checklist](#deterministic-startup-checklist)
11. [Degraded Mode Explanation](#degraded-mode-explanation)
12. [Onboarding Reproducibility](#onboarding-reproducibility)

---

## Project Overview

**HackaVerse** is an AI-powered hackathon management platform enabling:

- **Participant registration** and team formation
- **AI-assisted judging** via Groq LLM (multi-agent consensus scoring)
- **Leaderboard** and ranking systems
- **Admin dashboards** for hackathon management
- **Judge dashboards** for manual + AI-augmented scoring
- **Audit trail** with provenance logging (KSML structured events)

**Current Completion:** ~65–70%
**Deployment:** Render (backend) + Vercel (frontend) + MongoDB Atlas (database)

---

## Architecture Summary

```
┌──────────────────────────────────────────────────────────────┐
│                      HACKAVERSE SYSTEM                       │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  React/Vite Frontend          FastAPI Backend                │
│  Port: 3000 (dev)             Port: 8000 (dev)               │
│  Deployed: Vercel             Deployed: Render               │
│                                                              │
│  ├─ Admin Dashboard           ├─ Auth Routes (/auth/*)       │
│  ├─ Judge Interface           ├─ Judge Routes (/judge/*)     │
│  ├─ Participant Pages         ├─ Hackathon Routes            │
│  ├─ Leaderboard               ├─ Team Management             │
│  ├─ Team Management           ├─ Submissions                 │
│  └─ Notification Center       ├─ Leaderboard                 │
│                                ├─ Notifications              │
│                                ├─ Admin Routes               │
│                                ├─ System/Health              │
│                                └─ MCP Router                 │
│                                       │                      │
│                                       ▼                      │
│                              MongoDB Atlas                   │
│                              (hackaverse_db)                 │
│                                       │                      │
│                                       ▼                      │
│                              Groq LLM API                    │
│                              (AI Judging)                    │
│                                       │                      │
│                                       ▼                      │
│                          BHIV Bucket (local logs)            │
└──────────────────────────────────────────────────────────────┘
```

**Key data flows:**
1. Frontend → Backend via REST API (axios)
2. Backend → MongoDB for persistence
3. Backend → Groq API for AI judging
4. Backend → Local bucket for structured audit logging

---

## Prerequisites

| Dependency      | Required Version  | Verify Command             | Notes                          |
|-----------------|-------------------|----------------------------|--------------------------------|
| **Python**      | 3.10+             | `python --version`         | 3.11+ recommended              |
| **Node.js**     | 18.x+             | `node --version`           | 20.x LTS recommended           |
| **npm**         | 9.x+              | `npm --version`            | Comes with Node.js             |
| **Git**         | 2.x+              | `git --version`            | For version control             |
| **MongoDB**     | Atlas (cloud)     | N/A                        | No local MongoDB required       |
| **Groq API Key**| Current           | N/A                        | Optional: fallback mode exists  |

---

## Backend Setup

```bash
# 1. Navigate to backend directory
cd hackathon

# 2. Create Python virtual environment
python -m venv venv

# 3. Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# 4. Install dependencies
pip install -r requirements.txt

# 5. Create environment file
cp .env.example .env

# 6. Edit .env — fill in REQUIRED values:
#    - MONGODB_URI (get from MongoDB Atlas)
#    - GROQ_API_KEY (get from https://console.groq.com)
#    - API_KEY (generate: python -c "import secrets; print(secrets.token_hex(32))")

# 7. Start backend server
python -m uvicorn src.main:app --reload --port 8000
```

**Expected startup output:**
```
======================================================================
[STARTUP] HackaVerse Backend Starting...
======================================================================

🔄 Connecting to MongoDB...
   Database: hackaverse_db
   URI: mongodb+srv://...

✅ MongoDB Connected Successfully!
   Database: hackaverse_db
   Collections: <N>

[SUCCESS] Backend Ready!
   - Database: Connected
   - API Docs: http://localhost:8000/docs
======================================================================
```

If MongoDB connection fails, you'll see:
```
[WARNING] Backend Started in Degraded Mode
   - Database: NOT Connected
   - Some features may not work
```

---

## Frontend Setup

```bash
# 1. Navigate to frontend directory
cd hackaverse-frontend

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.example .env

# 4. Edit .env — fill in values:
#    - VITE_API_URL=http://localhost:8000
#    - VITE_API_KEY=<same API_KEY as backend>

# 5. Start frontend development server
npm run dev
```

**Expected output:**
```
  VITE v7.x.x  ready in XXX ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: http://x.x.x.x:3000/
```

---

## Startup Order

> **This order is deterministic and mandatory.**

| Step | Action                        | Validation                                         |
|------|-------------------------------|-----------------------------------------------------|
| 1    | Ensure MongoDB Atlas is active| Check https://cloud.mongodb.com                      |
| 2    | Start backend                 | `python -m uvicorn src.main:app --reload --port 8000`|
| 3    | Verify backend health         | `curl http://localhost:8000/health`                  |
| 4    | Start frontend                | `npm run dev` (from hackaverse-frontend/)             |
| 5    | Verify frontend               | Open http://localhost:3000 in browser                 |
| 6    | Verify API connectivity       | Check browser console for API errors                  |

---

## Health Checks & Verification

### Backend Health
```bash
curl http://localhost:8000/health
```
**Expected response (healthy):**
```json
{
  "success": true,
  "message": "Service is healthy",
  "data": {
    "status": "ok",
    "database": "✅ Connected",
    "timestamp": "2026-05-11T12:00:00.000000"
  }
}
```

### Database Status
```bash
curl http://localhost:8000/system/db-status
```

### API Documentation
Open in browser: http://localhost:8000/docs (Swagger UI)

---

## API Verification

### Test Authentication
```bash
# Register a test user
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"test123456","role":"participant"}'

# Login
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123456"}'
```

### Test AI Judging
```bash
curl -X POST http://localhost:8000/judge/score \
  -H "Content-Type: application/json" \
  -H "X-API-Key: <your_api_key>" \
  -d '{"submission_text":"Our AI chatbot uses GPT-4 and RAG for customer support","team_id":"team_test","tenant_id":"default","event_id":"default_event"}'
```

---

## Troubleshooting

| Problem | Likely Cause | Solution |
|---------|-------------|----------|
| Backend won't start | Missing dependencies | `pip install -r requirements.txt` |
| `MONGODB_URI not set` | Missing .env | Copy .env.example → .env, fill in URI |
| `MongoDB Connection Failed` | Wrong URI or network | Check Atlas whitelist, verify URI format |
| Frontend blank page | Backend not running | Start backend first, check VITE_API_URL |
| CORS errors | Origin mismatch | Set `ALLOWED_ORIGINS=*` in backend .env |
| 401 on API calls | API key mismatch | Ensure VITE_API_KEY matches backend API_KEY |
| AI judging returns 50/100 | Missing GROQ_API_KEY | Add Groq API key to .env |
| `ModuleNotFoundError` | Wrong working directory | Run uvicorn from `hackathon/` directory |
| Port 8000 already in use | Another process | Kill process: `lsof -i :8000` or change PORT |

---

## Deterministic Startup Checklist

See full checklist: [DETERMINISTIC_STARTUP_CHECKLIST.md](./DETERMINISTIC_STARTUP_CHECKLIST.md)

Quick validation:
- [ ] `.env` files exist for both backend and frontend
- [ ] `MONGODB_URI` is set and valid
- [ ] Backend starts without errors
- [ ] `curl /health` returns `"status": "ok"`
- [ ] Frontend loads at http://localhost:3000
- [ ] Login/register works
- [ ] API key matches between frontend and backend

---

## Degraded Mode Explanation

HackaVerse is designed to start even when dependencies are unavailable:

| Dependency | Missing Behavior | Impact |
|-----------|-----------------|--------|
| MongoDB | Backend starts, logs warning | No data persistence, auth fails on login |
| Groq API | Judging returns fallback scores (50/100) | AI scoring unavailable, manual judging still works |
| BHIV Core | Executor logs warning, continues | Bucket logging works locally, Core relay skipped |
| Email/SMTP | Email sends silently skipped | No email notifications, all other features work |
| Discord Webhook | Webhook sends silently skipped | No Discord alerts, all other features work |
| WebSocket | No real-time push | Notifications still accessible via REST polling |

**Degraded mode is NOT production-safe.** It exists solely for development convenience.

---

## Onboarding Reproducibility

To verify a clean onboarding:

1. Clone the repo into a fresh directory
2. Follow Backend Setup (steps 1–7) exactly
3. Follow Frontend Setup (steps 1–5) exactly
4. Run all Health Checks
5. Every step should produce the expected output documented above

If any step diverges from documented behavior, file an issue with:
- Your OS and Python/Node versions
- Exact error message
- Contents of your `.env` (redact secrets)
