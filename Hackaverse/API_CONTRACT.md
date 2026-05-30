# API_CONTRACT.md - Complete API Specification

## TABLE OF CONTENTS
1. Authentication Endpoints
2. Judging Endpoints
3. Team Endpoints
4. Submission Endpoints
5. Leaderboard Endpoints
6. Admin Endpoints
7. System Endpoints
8. Response Format
9. Error Codes

---

## 1. AUTHENTICATION ENDPOINTS

### POST /auth/login
**Purpose:** User login with email and password

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "user_id": "user_123",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "participant"
    }
  }
}
```

**Error (401 Unauthorized):**
```json
{
  "success": false,
  "message": "Invalid email or password",
  "data": null
}
```

---

### POST /auth/register
**Purpose:** Create new user account

**Request:**
```json
{
  "email": "newuser@example.com",
  "password": "password123",
  "name": "Jane Doe"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user_id": "user_456",
    "email": "newuser@example.com",
    "name": "Jane Doe",
    "role": "participant"
  }
}
```

**Error (400 Bad Request):**
```json
{
  "success": false,
  "message": "Email already exists",
  "data": null
}
```

---

### POST /auth/logout
**Purpose:** Logout user and invalidate tokens

**Request:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logout successful",
  "data": null
}
```

---

### POST /auth/refresh
**Purpose:** Get new access token using refresh token

**Request:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Token refreshed",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

---

## 2. JUDGING ENDPOINTS

### POST /judge/submit
**Purpose:** Submit project and get AI judgment

**Headers:**
```
Authorization: Bearer {access_token}
X-API-Key: {api_key}
Content-Type: application/json
```

**Request:**
```json
{
  "submission_text": "Our AI chatbot uses GPT-4 and RAG for customer support. It can handle 100+ queries per minute with 95% accuracy.",
  "team_id": "team_42",
  "tenant_id": "default",
  "event_id": "default_event",
  "workspace_id": null,
  "request_id": "req_12345"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Submission judged successfully",
  "data": {
    "submission_hash": "abc123def456ghi789...",
    "team_id": "team_42",
    "judging_result": {
      "individual_scores": {},
      "consensus_score": 78.5,
      "criteria_scores": {
        "clarity": 8.5,
        "tech_depth": 7.8,
        "innovation": 8.2
      },
      "reasoning_chain": "Strong technical implementation with good innovation. Clear explanation of architecture. Could improve on scalability discussion.",
      "confidence": 0.92,
      "version": 1
    }
  }
}
```

**Error (409 Conflict - Replay Detected):**
```json
{
  "success": false,
  "message": "Duplicate submission detected",
  "data": {
    "request_id": "req_12345"
  }
}
```

---

### POST /judge/score
**Purpose:** Score a submission without saving

**Headers:**
```
Authorization: Bearer {access_token}
X-API-Key: {api_key}
```

**Request:**
```json
{
  "submission_text": "Project description...",
  "team_id": "team_42",
  "tenant_id": "default",
  "event_id": "default_event"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Submission scored",
  "data": {
    "clarity": 8.5,
    "quality": 7.8,
    "innovation": 8.2,
    "total_score": 78.5,
    "confidence": 0.92,
    "trace": "Reasoning explanation...",
    "team_id": "team_42"
  }
}
```

---

### GET /judge/queue
**Purpose:** Get pending submissions for judging

**Query Parameters:**
```
tenant_id: string (default: "default")
event_id: string (default: "default_event")
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Retrieved 5 submissions",
  "data": [
    {
      "submission_id": "sub_001",
      "team_id": "team_42",
      "submission_hash": "abc123...",
      "timestamp": 1234567890
    },
    {
      "submission_id": "sub_002",
      "team_id": "team_43",
      "submission_hash": "def456...",
      "timestamp": 1234567891
    }
  ]
}
```

---

### GET /judge/scores
**Purpose:** Get all judged scores

**Query Parameters:**
```
tenant_id: string (default: "default")
event_id: string (default: "default_event")
limit: integer (default: 50, max: 100)
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Retrieved 10 scores",
  "data": [
    {
      "team_id": "team_42",
      "total_score": 85.5,
      "clarity": 8.5,
      "quality": 8.2,
      "innovation": 8.8,
      "confidence": 0.92,
      "timestamp": 1234567890
    }
  ]
}
```

---

### GET /judge/rubric
**Purpose:** Get judging criteria and weights

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Judging criteria retrieved",
  "data": {
    "criteria": {
      "clarity": {
        "description": "How clear is the explanation?",
        "max": 10
      },
      "tech_depth": {
        "description": "Technical depth and sophistication",
        "max": 10
      },
      "innovation": {
        "description": "How innovative is the solution?",
        "max": 10
      }
    },
    "weights": {
      "clarity": 0.33,
      "tech_depth": 0.33,
      "innovation": 0.34
    },
    "total_possible_score": 100
  }
}
```

---

### POST /judge/batch
**Purpose:** Judge multiple submissions in batch

**Request:**
```json
{
  "submissions": [
    {
      "submission_text": "Project 1 description...",
      "team_id": "team_42",
      "request_id": "req_001"
    },
    {
      "submission_text": "Project 2 description...",
      "team_id": "team_43",
      "request_id": "req_002"
    }
  ],
  "tenant_id": "default",
  "event_id": "default_event",
  "workspace_id": null
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Batch judging completed for 2 submissions",
  "data": {
    "results": [
      {
        "team_id": "team_42",
        "consensus_score": 78.5,
        "criteria_scores": {
          "clarity": 8.5,
          "tech_depth": 7.8,
          "innovation": 8.2
        }
      },
      {
        "team_id": "team_43",
        "consensus_score": 82.3,
        "criteria_scores": {
          "clarity": 8.2,
          "tech_depth": 8.5,
          "innovation": 8.1
        }
      }
    ],
    "total_count": 2
  }
}
```

---

### GET /judge/rank
**Purpose:** Get ranked leaderboard

**Query Parameters:**
```
tenant_id: string (default: "default")
event_id: string (default: "default_event")
limit: integer (default: 50, max: 100)
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Rankings retrieved for 5 teams",
  "data": {
    "rankings": [
      {
        "rank": 1,
        "team_id": "team_42",
        "total_score": 85.5,
        "clarity": 8.5,
        "quality": 8.2,
        "innovation": 8.8,
        "confidence": 0.92
      },
      {
        "rank": 2,
        "team_id": "team_43",
        "total_score": 82.3,
        "clarity": 8.2,
        "quality": 8.5,
        "innovation": 8.1,
        "confidence": 0.88
      }
    ],
    "total_count": 5
  }
}
```

---

## 3. TEAM ENDPOINTS

### GET /teams
**Purpose:** List all teams

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Retrieved 10 teams",
  "data": [
    {
      "team_id": "team_42",
      "team_name": "Team Alpha",
      "team_lead": "user_123",
      "members": ["user_123", "user_124", "user_125"],
      "hackathon_id": "hack_001",
      "created_at": 1234567890,
      "status": "active"
    }
  ]
}
```

---

### POST /teams
**Purpose:** Create new team

**Request:**
```json
{
  "team_name": "Team Alpha",
  "members": ["user_123", "user_124"]
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Team created",
  "data": {
    "team_id": "team_42",
    "team_name": "Team Alpha",
    "team_lead": "user_123",
    "members": ["user_123", "user_124"]
  }
}
```

---

### GET /teams/{id}
**Purpose:** Get team details

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Team retrieved",
  "data": {
    "team_id": "team_42",
    "team_name": "Team Alpha",
    "team_lead": "user_123",
    "members": ["user_123", "user_124", "user_125"],
    "created_at": 1234567890
  }
}
```

---

### PATCH /teams/{id}
**Purpose:** Update team details

**Request:**
```json
{
  "team_name": "Team Alpha Updated"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Team updated",
  "data": {
    "team_id": "team_42",
    "team_name": "Team Alpha Updated"
  }
}
```

---

### DELETE /teams/{id}
**Purpose:** Delete team

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Team deleted",
  "data": null
}
```

---

### POST /teams/{id}/join
**Purpose:** Join a team

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Joined team",
  "data": {
    "team_id": "team_42",
    "members": ["user_123", "user_124", "user_125", "user_126"]
  }
}
```

---

### POST /teams/{id}/leave
**Purpose:** Leave a team

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Left team",
  "data": null
}
```

---

## 4. SUBMISSION ENDPOINTS

### GET /submissions
**Purpose:** List all submissions

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Retrieved 5 submissions",
  "data": [
    {
      "submission_id": "sub_001",
      "team_id": "team_42",
      "submission_text": "Project description...",
      "created_at": 1234567890
    }
  ]
}
```

---

### POST /submissions
**Purpose:** Create new submission

**Request:**
```json
{
  "submission_text": "Our AI chatbot uses GPT-4...",
  "team_id": "team_42"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Submission created",
  "data": {
    "submission_id": "sub_001",
    "team_id": "team_42",
    "created_at": 1234567890
  }
}
```

---

### GET /submissions/{id}
**Purpose:** Get submission details

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Submission retrieved",
  "data": {
    "submission_id": "sub_001",
    "team_id": "team_42",
    "submission_text": "Project description...",
    "created_at": 1234567890
  }
}
```

---

### PATCH /submissions/{id}
**Purpose:** Update submission

**Request:**
```json
{
  "submission_text": "Updated project description..."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Submission updated",
  "data": {
    "submission_id": "sub_001",
    "updated_at": 1234567891
  }
}
```

---

## 5. LEADERBOARD ENDPOINTS

### GET /leaderboard/{hackathon_id}
**Purpose:** Get leaderboard for hackathon

**Query Parameters:**
```
limit: integer (default: 50)
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Leaderboard retrieved",
  "data": {
    "rankings": [
      {
        "rank": 1,
        "team_id": "team_42",
        "team_name": "Team Alpha",
        "total_score": 85.5,
        "members": 3
      },
      {
        "rank": 2,
        "team_id": "team_43",
        "team_name": "Team Beta",
        "total_score": 82.3,
        "members": 3
      }
    ]
  }
}
```

---

## 6. ADMIN ENDPOINTS

### GET /admin/dashboard
**Purpose:** Get admin dashboard data

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Dashboard data retrieved",
  "data": {
    "total_teams": 10,
    "total_submissions": 15,
    "total_participants": 30,
    "average_score": 75.5,
    "pending_judgments": 5
  }
}
```

---

### POST /admin/invite-participant
**Purpose:** Invite participant to hackathon

**Request:**
```json
{
  "email": "participant@example.com",
  "hackathon_id": "hack_001"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Invitation sent",
  "data": {
    "email": "participant@example.com",
    "invitation_token": "inv_abc123..."
  }
}
```

---

### GET /admin/logs
**Purpose:** Get system logs

**Query Parameters:**
```
limit: integer (default: 50)
level: string (INFO, WARNING, ERROR)
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logs retrieved",
  "data": [
    {
      "timestamp": "2024-01-15T10:30:00Z",
      "level": "INFO",
      "message": "User logged in",
      "user_id": "user_123"
    }
  ]
}
```

---

## 7. SYSTEM ENDPOINTS

### GET /health
**Purpose:** Health check endpoint

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Service is healthy",
  "data": {
    "status": "ok",
    "database": "Connected",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

**Response (503 Service Unavailable - Degraded Mode):**
```json
{
  "success": true,
  "message": "Service is healthy",
  "data": {
    "status": "degraded",
    "database": "Not Connected",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

---

### GET /system/db-status
**Purpose:** Get database connection status

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Database status retrieved",
  "data": {
    "connected": true,
    "database": "hackaverse_db",
    "uri_set": true,
    "status": "✅ Connected"
  }
}
```

---

### GET /system/ready
**Purpose:** Check if system is ready

**Response (200 OK):**
```json
{
  "success": true,
  "message": "System is ready",
  "data": {
    "ready": true,
    "database": "connected",
    "api": "operational"
  }
}
```

---

## 8. RESPONSE FORMAT

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data here
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "data": null
}
```

### Pagination (if applicable)
```json
{
  "success": true,
  "message": "Data retrieved",
  "data": {
    "items": [...],
    "total": 100,
    "page": 1,
    "limit": 50
  }
}
```

---

## 9. ERROR CODES

| Code | Meaning | Example |
|------|---------|---------|
| 200 | OK | Request successful |
| 201 | Created | Resource created |
| 400 | Bad Request | Invalid input |
| 401 | Unauthorized | Missing/invalid token |
| 403 | Forbidden | No permission |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Duplicate/replay detected |
| 500 | Server Error | Internal error |
| 503 | Service Unavailable | Database down |

---

## AUTHENTICATION

All protected endpoints require:

**Header:**
```
Authorization: Bearer {access_token}
```

**Get token:**
```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

---

## RATE LIMITING

Currently NO rate limiting. To add:

```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@app.get("/api/endpoint")
@limiter.limit("10/minute")
async def endpoint(request: Request):
    return {"data": "..."}
```

---

## TESTING ENDPOINTS

Use Postman or curl:

```bash
# Test health
curl http://localhost:8000/health

# Test login
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'

# Test judging
curl -X POST http://localhost:8000/judge/submit \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"submission_text": "...", "team_id": "team_42"}'
```

