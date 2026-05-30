# HackaVerse — Execution Flow Analysis

> **Traces every major user flow from frontend trigger to database write.**
> Last updated: 2026-05-11

---

## Flow 1: User Registration

```
Frontend                    Backend                         Database
────────                    ───────                         ────────
Register form submit
  └─► POST /auth/register
      Headers: Content-Type, X-API-Key
      Body: {name, email, password, role}
                            auth_routes.py::register()
                            ├─ Validate input fields
                            ├─ Check email uniqueness
                            ├─ Hash password (SHA-256)     ── WARNING: No salt
                            ├─ Generate user_id (UUID)
                            ├─ Insert user document ──────► db.users.insert_one()
                            └─ Return {success, user_id}
  ◄── 200 OK
      Store token in localStorage
      Redirect to dashboard
```

---

## Flow 2: User Login

```
Frontend                    Backend                         Database
────────                    ───────                         ────────
Login form submit
  └─► POST /auth/login
      Body: {email, password}
                            auth_routes.py::login()
                            ├─ Find user by email ────────► db.users.find_one()
                            ├─ Compare hashed password
                            ├─ Generate JWT-like token     ── WARNING: Random signature
                            ├─ Create session ────────────► db.sessions.insert_one()
                            └─ Return {token, user}
  ◄── 200 OK
      Store authToken in localStorage
      Redirect by role (admin/judge/participant)
```

---

## Flow 3: AI Judging (Critical Path)

```
Frontend/API                Backend                                    External
────────────                ───────                                    ────────
POST /judge/score
  Body: {submission_text,
         team_id, tenant_id,
         event_id}
                            judge.py::score_submission()
                            ├─ Validate input
                            ├─ Load rubric ──── rubric.py::get_criteria()
                            │   └─ Returns: [usefulness, creativity, ...]
                            ├─ Execute multi-agent judge
                            │   └─ multi_agent_judge.py::evaluate()
                            │       ├─ Create 3 agent prompts
                            │       ├─ For each agent:
                            │       │   └─ POST to Groq API ──────────► Groq LLM
                            │       │       Model: llama-3.1-8b-instant
                            │       │       ◄── Response with scores
                            │       └─ Consensus calculation
                            │           └─ consensus.py::compute()
                            │               └─ Average agent scores
                            ├─ Store judgment ────────────► db.judgments.insert_one()
                            ├─ KSML bucket log ──────────► ./data/bucket/logs_*.json
                            ├─ Provenance entry ─────────► db.provenance_logs.insert_one()
                            └─ Return {scores, total, evaluation_text}
  ◄── 200 OK
      Display scores in UI

FALLBACK PATH (no Groq API key):
                            ├─ executor.py detects missing key
                            ├─ Returns fallback score (50/100)
                            └─ Marks response with fallback: true
```

---

## Flow 4: Team Creation

```
Frontend                    Backend                         Database
────────                    ───────                         ────────
Create Team form submit
  └─► POST /teams/create
      Headers: X-API-Key
      Body: {hackathon_id,
             team_name,
             project_title,
             leader_id}
                            teams.py::create_team()
                            ├─ Validate hackathon exists
                            ├─ Generate team_id
                            ├─ Create team document ──────► db.teams.insert_one()
                            └─ Return {team_id, success}
  ◄── 200 OK
      Store team_id in localStorage
      Redirect to /teams
```

---

## Flow 5: Project Submission

```
Frontend                    Backend                         Database
────────                    ───────                         ────────
Submission form submit
  └─► POST /submissions
      Headers: X-API-Key
      Body: {team_id, hackathon_id,
             title, description,
             github_link, demo_link}
                            submissions.py::create_submission()
                            ├─ Validate team exists
                            ├─ Generate submission_id
                            ├─ Insert submission ─────────► db.submissions.insert_one()
                            ├─ Auto-trigger judging?       (If configured)
                            │   └─ POST /judge/score       (Internal call)
                            └─ Return {submission_id, success}
  ◄── 200 OK
      Show success toast
```

---

## Flow 6: Leaderboard Query

```
Frontend                    Backend                         Database
────────                    ───────                         ────────
Page load / refresh
  └─► GET or POST /judge/rank
      Body: {tenant_id, event_id, limit}
                            judge.py::get_rankings()
                            ├─ Query judgments ───────────► db.judgments.aggregate()
                            ├─ Sort by total_score DESC
                            ├─ Apply limit
                            └─ Return {rankings: [...]}
  ◄── 200 OK
      Render leaderboard table
```

---

## Flow 7: Backend Startup

```
uvicorn starts
  └─► main.py loaded
      ├─ Load .env via dotenv
      ├─ Create FastAPI app
      ├─ Add CORS middleware (ALLOWED_ORIGINS)
      ├─ Add SecurityMiddleware
      ├─ Register all routers
      │   ├─ auth_routes (/auth)
      │   ├─ judge (/judge)
      │   ├─ hackathon (/hackathons, /api/hackathons)
      │   ├─ teams (/teams)
      │   ├─ submissions (/submissions)
      │   ├─ leaderboard (/leaderboard)
      │   ├─ notifications (/notifications)
      │   ├─ admin (/api/admin)
      │   ├─ system (/system)
      │   └─ mcp_router (/mcp)
      ├─ @app.on_event("startup")
      │   └─ connect_to_db()
      │       ├─ Parse MONGODB_URI
      │       ├─ Attempt connection (5s timeout)
      │       ├─ On success: log collections, set db reference
      │       └─ On failure: log warning, set db = None (degraded)
      └─ Server ready on PORT (default 8000)
```

---

## Flow 8: Request Security Validation

```
Every inbound request
  └─► SecurityMiddleware.dispatch()
      ├─ Check path exclusions (/health, /docs, /openapi.json)
      │   └─ If excluded → pass through
      ├─ Extract X-API-Key header
      ├─ Look up role in API_KEY_ROLES map
      │   ├─ If missing → 401 Unauthorized
      │   └─ If found → set role context
      ├─ If path starts with /workflows:
      │   ├─ Require X-Nonce header
      │   ├─ Require X-Signature header
      │   ├─ Verify nonce uniqueness
      │   ├─ Verify HMAC signature
      │   └─ On failure → 403 Forbidden
      ├─ Rate limit check (60 req/min/IP)
      │   └─ On exceeded → 429 Too Many Requests
      └─ Pass to route handler
```

---

## Data Flow Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                        USER BROWSER                              │
│  ┌─────────┐  ┌──────────┐  ┌────────┐  ┌────────────────────┐  │
│  │ Register │  │  Login   │  │ Submit │  │ View Leaderboard   │  │
│  └────┬─────┘  └────┬─────┘  └───┬────┘  └────────┬───────────┘  │
│       │              │            │                │              │
└───────┼──────────────┼────────────┼────────────────┼──────────────┘
        ▼              ▼            ▼                ▼
┌──────────────────────────────────────────────────────────────────┐
│                    FASTAPI BACKEND (Port 8000)                    │
│                                                                  │
│  SecurityMiddleware → Rate Limiter → Route Handler               │
│                                                                  │
│  ┌──────┐  ┌───────┐  ┌────────┐  ┌───────────┐  ┌───────────┐  │
│  │ Auth │  │ Teams │  │ Judge  │  │ Leaderboard│  │  Admin    │  │
│  └──┬───┘  └──┬────┘  └───┬────┘  └─────┬─────┘  └─────┬─────┘  │
│     │         │           │              │              │        │
│     ▼         ▼           ▼              ▼              ▼        │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │                    MongoDB Atlas                          │    │
│  │  users | teams | hackathons | submissions | judgments     │    │
│  │  sessions | provenance_logs | notifications              │    │
│  └──────────────────────────────────────────────────────────┘    │
│                         │                                        │
│                         ▼                                        │
│              ┌──────────────────┐    ┌─────────────────────┐     │
│              │   Groq LLM API   │    │ Bucket (./data/)    │     │
│              │  (AI Judging)     │    │ (Audit Logs)        │     │
│              └──────────────────┘    └─────────────────────┘     │
└──────────────────────────────────────────────────────────────────┘
```
