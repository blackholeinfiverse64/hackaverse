# SYSTEM_HANDOVER.md - Complete Technical Documentation

## TABLE OF CONTENTS
1. System Architecture
2. Technology Stack
3. Database Schema
4. API Routes
5. Authentication Flow
6. Judging Engine
7. Deployment
8. Troubleshooting

---

## 1. SYSTEM ARCHITECTURE

### High-Level Overview
```
┌─────────────────────────────────────────────────────────────┐
│                    HACKAVERSE SYSTEM                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────┐         ┌──────────────────┐        │
│  │   FRONTEND       │         │    BACKEND       │        │
│  │  (React/Vite)    │◄───────►│  (FastAPI)       │        │
│  │  Port: 3000      │         │  Port: 8000      │        │
│  └──────────────────┘         └──────────────────┘        │
│         │                             │                    │
│         │                             │                    │
│         └─────────────┬───────────────┘                    │
│                       │                                    │
│                       ▼                                    │
│         ┌──────────────────────────┐                      │
│         │   MONGODB ATLAS          │                      │
│         │   (Cloud Database)       │                      │
│         └──────────────────────────┘                      │
│                       │                                    │
│         ┌─────────────┴──────────────┐                    │
│         │                            │                    │
│         ▼                            ▼                    │
│    ┌─────────────┐          ┌──────────────┐             │
│    │  Groq LLM   │          │  Reward      │             │
│    │  (AI Judge) │          │  System      │             │
│    └─────────────┘          └──────────────┘             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Directory Structure
```
hackathon/
├── src/
│   ├── main.py                    # FastAPI entry point
│   ├── database.py                # MongoDB connection
│   ├── auth.py                    # Authentication logic
│   ├── models.py                  # Pydantic schemas
│   ├── routes/                    # API endpoints
│   │   ├── auth_routes.py         # Login/Register
│   │   ├── judge.py               # Judging endpoints
│   │   ├── teams_crud.py          # Team management
│   │   ├── submissions.py         # Submission handling
│   │   ├── leaderboard.py         # Rankings
│   │   ├── admin.py               # Admin controls
│   │   └── ... (10 more route files)
│   ├── judging/                   # AI Judging engine
│   │   ├── multi_agent_judge.py   # Main judging logic
│   │   ├── rubric.py              # Scoring criteria
│   │   └── consensus.py           # Score aggregation
│   ├── services/                  # Business logic
│   ├── schemas/                   # Response schemas
│   └── utils/                     # Helper functions
├── requirements.txt               # Python dependencies
├── .env.example                   # Environment template
└── render.yaml                    # Render deployment config

hackaverse-frontend/
├── src/
│   ├── main.jsx                   # React entry point
│   ├── App.jsx                    # Route definitions
│   ├── components/                # React components
│   │   ├── admin/                 # Admin dashboard
│   │   ├── judge/                 # Judge interface
│   │   ├── participant/           # Participant pages
│   │   ├── pages/                 # Public pages
│   │   └── ui/                    # Reusable UI
│   ├── services/
│   │   └── api.js                 # API client
│   ├── contexts/                  # React contexts
│   ├── hooks/                     # Custom hooks
│   └── utils/                     # Utilities
├── package.json                   # NPM dependencies
├── vite.config.js                 # Vite configuration
└── tailwind.config.js             # Tailwind CSS config
```

---

## 2. TECHNOLOGY STACK

### Backend
| Technology | Version | Purpose |
|-----------|---------|---------|
| FastAPI | 0.118.0 | Web framework |
| Uvicorn | 0.22.0 | ASGI server |
| PyMongo | 4.15.3 | MongoDB driver |
| Groq | 0.32.0 | AI API client |
| LangChain | 0.3.78 | LLM orchestration |
| LangGraph | 0.2.39 | Agent framework |
| Python-dotenv | 1.0.0 | Environment config |
| Pydantic | (latest) | Data validation |

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 19.1.1 | UI framework |
| React Router | 7.9.4 | Routing |
| Vite | 7.1.7 | Build tool |
| Tailwind CSS | 3.4.0 | Styling |
| Axios | 1.6.0 | HTTP client |
| PostCSS | 8.5.6 | CSS processing |

### Infrastructure
| Service | Purpose |
|---------|---------|
|---------|---------|
| MongoDB Atlas | Cloud database |
| Render | Backend hosting |
| Vercel | Frontend hosting |
| Groq Cloud | AI model API |

---

## 3. DATABASE SCHEMA

### Collections in MongoDB

#### users
```json
{
  "_id": ObjectId,
  "email": "user@example.com",
  "password_hash": "hashed_password",
  "name": "User Name",
  "role": "participant|judge|admin",
  "created_at": 1234567890,
  "updated_at": 1234567890
}
```

#### teams
```json
{
  "_id": ObjectId,
  "team_name": "Team Alpha",
  "team_lead": "user_id",
  "members": ["user_id_1", "user_id_2"],
  "hackathon_id": "hackathon_id",
  "created_at": 1234567890,
  "status": "active|inactive"
}
```

#### submissions
```json
{
  "_id": ObjectId,
  "submission_text": "Project description...",
  "team_id": "team_id",
  "submission_hash": "abc123...",
  "tenant_id": "default",
  "event_id": "default_event",
  "timestamp": 1234567890
}
```

#### judgments
```json
{
  "_id": ObjectId,
  "submission_hash": "abc123...",
  "team_id": "team_id",
  "clarity": 8.5,
  "quality": 7.8,
  "innovation": 8.2,
  "total_score": 78.5,
  "confidence": 0.92,
  "trace": "Reasoning explanation...",
  "version": 1,
  "timestamp": 1234567890
}
```

#### provenance
```json
{
  "_id": ObjectId,
  "actor": "team_42",
  "event": "submission_save",
  "payload": { ... },
  "event_id": "default_event",
  "outcome": "success",
  "timestamp": 1234567890
}
```

#### notifications
```json
{
  "_id": ObjectId,
  "user_id": "user_id",
  "message": "Your submission was judged",
  "type": "submission|team|reward",
  "read": false,
  "created_at": 1234567890
}
```

---

## 4. API ROUTES

### Route Files and Endpoints

#### auth_routes.py
```
POST   /auth/login              - User login
POST   /auth/register           - User registration
POST   /auth/logout             - User logout
POST   /auth/refresh            - Refresh JWT token
```

#### judge.py
```
POST   /judge/submit            - Submit and score
POST   /judge/score             - Score only
GET    /judge/queue             - Get pending submissions
GET    /judge/scores            - Get all scores
GET    /judge/rubric            - Get scoring criteria
POST   /judge/batch             - Batch judge
GET    /judge/rank              - Get rankings
```

#### teams_crud.py
```
GET    /teams                   - List all teams
POST   /teams                   - Create team
GET    /teams/{id}              - Get team details
PATCH  /teams/{id}              - Update team
DELETE /teams/{id}              - Delete team
POST   /teams/{id}/join         - Join team
POST   /teams/{id}/leave        - Leave team
```

#### submissions.py
```
GET    /submissions             - List submissions
POST   /submissions             - Create submission
GET    /submissions/{id}        - Get submission
PATCH  /submissions/{id}        - Update submission
```

#### leaderboard.py
```
GET    /leaderboard/{id}        - Get leaderboard
GET    /leaderboard/track/{track} - Get by track
```

#### admin.py
```
GET    /admin/dashboard         - Admin dashboard
POST   /admin/invite-participant - Invite user
GET    /admin/logs              - View logs
```

#### system.py
```
GET    /health                  - Health check
GET    /system/db-status        - Database status
GET    /system/ready            - System ready check
```

---

## 5. AUTHENTICATION FLOW

### JWT Token Flow
```
1. User enters email/password
   ↓
2. Frontend POST /auth/login
   ↓
3. Backend validates credentials
   ↓
4. Backend generates JWT tokens:
   - access_token (15 min expiry)
   - refresh_token (7 day expiry)
   ↓
5. Frontend stores tokens in localStorage
   ↓
6. Frontend adds Authorization header:
   Authorization: Bearer {access_token}
   ↓
7. Backend validates token on each request
   ↓
8. If token expired, frontend calls /auth/refresh
   ↓
9. Backend returns new access_token
```

### Protected Routes
```python
# In main.py
@app.get("/protected")
async def protected_route(current_user = Depends(get_current_user)):
    return {"user": current_user}
```

### Roles
- **admin**: Full system access
- **judge**: Can score submissions
- **participant**: Can create teams, submit projects

---

## 6. JUDGING ENGINE

### Multi-Agent Judging Flow
```
1. Submission received
   ↓
2. Call evaluate_submission_multi_agent()
   ↓
3. Groq LLM evaluates on 3 criteria:
   - Clarity (0-10)
   - Tech Depth (0-10)
   - Innovation (0-10)
   ↓
4. Calculate consensus score:
   total = (clarity + tech_depth + innovation) / 3 * 10
   ↓
5. Return scores + reasoning
   ↓
6. Save to judgments collection
   ↓
7. Calculate reward based on score
   ↓
8. Log event to provenance
```

### Scoring Rubric
```
Clarity (0-10):
  - 0-3: Unclear, hard to understand
  - 4-6: Somewhat clear
  - 7-10: Very clear and well-explained

Tech Depth (0-10):
  - 0-3: Basic implementation
  - 4-6: Good technical depth
  - 7-10: Advanced/sophisticated

Innovation (0-10):
  - 0-3: Standard approach
  - 4-6: Some novel ideas
  - 7-10: Highly innovative
```

### Fallback Mechanism
- If Groq API fails: Return score of 50 with `"fallback": true`
- If database fails: Still return score but don't persist
- If replay detected: Return 409 Conflict error

---

## 7. DEPLOYMENT

### Backend Deployment (Render)
```bash
# 1. Push code to GitHub
git push origin main

# 2. Render auto-deploys from GitHub
# Backend: https://github.com/Sejal060/hackathon.git
# 3. Render runs: pip install -r requirements.txt
# 4. Render runs: python -m uvicorn hackathon.src.main:app --host 0.0.0.0 --port 8000

# Environment variables set in Render dashboard:
MONGODB_URI=mongodb+srv://sejalfinal:Sejal%40123@cluster0.jrcmlaq.mongodb.net/hackaverse_db?retryWrites=true&w=majority
GROQ_API_KEY=...
AUTHOR_PASSWORD=...
```

# Deployed at: https://ai-agent-x2iw.onrender.com

### Frontend Deployment (Vercel)
```bash
# 1. Push code to GitHub
git push origin main

# 2. Vercel auto-deploys from GitHub
# Frontend: https://github.com/blackholeinfiverse66/hackaverse.git
# 3. Vercel runs: npm install
# 4. Vercel runs: npm run build
# 5. Vercel serves from dist/ folder

# Environment variables set in Vercel dashboard:
VITE_API_BASE_URL=https://ai-agent-x2iw.onrender.com
VITE_API_KEY=...
```

# Deployed at: https://hackaverse-mu.vercel.app/

### Database (MongoDB Atlas)
```
1. Cluster: cluster0
2. Database: hackaverse_db
3. Connection string: mongodb+srv://sejalfinal:Sejal%40123@cluster0.jrcmlaq.mongodb.net/hackaverse_db?retryWrites=true&w=majority
4. Already configured and ready to use
```

---

## 8. TROUBLESHOOTING

### Backend Won't Start
```
Error: ModuleNotFoundError: No module named 'hackathon'

Solution:
1. cd hackathon
2. pip install -r requirements.txt
3. python -m uvicorn src.main:app --reload
```

### Database Connection Failed
```
Error: ❌ MongoDB Connection Failed

Solution:
1. Check MONGODB_URI in .env
2. Verify MongoDB Atlas IP whitelist
3. Test connection: mongosh "mongodb+srv://..."
4. Check credentials are correct
```

### Groq API Error
```
Error: Groq API rate limit exceeded

Solution:
1. Check GROQ_API_KEY in .env
2. Wait 60 seconds before retrying
3. Check Groq dashboard for quota
4. Fallback score (50) will be returned
```

### Frontend Can't Connect to Backend
```
Error: Network error: No response from server

Solution:
1. Check VITE_API_BASE_URL in .env
2. Verify backend is running: curl http://localhost:8000/health
3. Check CORS settings in main.py
4. Check browser console for exact error
```

### Tokens Not Working
```
Error: 401 Unauthorized

Solution:
1. Clear localStorage: localStorage.clear()
2. Login again
3. Check token expiry: jwt.decode(token)
4. Verify JWT_SECRET in backend .env
```

---

## CRITICAL FILES TO KNOW

| File | Purpose | Edit When |
|------|---------|-----------|
| `main.py` | Backend entry | Adding new routes |
| `database.py` | DB connection | Changing MongoDB URI |
| `judge.py` | Judging logic | Changing scoring |
| `auth.py` | Authentication | Changing auth flow |
| `App.jsx` | Frontend routes | Adding new pages |
| `api.js` | API client | Adding new endpoints |
| `.env` | Configuration | Changing API keys |
| `requirements.txt` | Dependencies | Adding Python packages |
| `package.json` | Dependencies | Adding NPM packages |

---

## QUICK REFERENCE

### Start Backend
```bash
cd hackathon
python -m uvicorn src.main:app --reload
```

### Start Frontend
```bash
cd hackaverse-frontend
npm run dev
```

### View API Docs
```
http://localhost:8000/docs
```

### Check Health
```bash
curl http://localhost:8000/health
```

### View Logs
```bash
tail -f hackathon/data/logs.txt
```

### Reset Database
```bash
# Delete all collections in MongoDB Atlas
# Or run seed_data.py to reset with sample data
python hackathon/seed_data.py
```

