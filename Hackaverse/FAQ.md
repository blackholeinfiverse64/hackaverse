# FAQ.md - Frequently Asked Questions

## Q1: How do I run the project locally?

**A:** Follow these steps:

**Backend:**
```bash
cd hackathon
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your MongoDB URI and Groq API key
python -m uvicorn src.main:app --reload
```

**Frontend:**
```bash
cd hackaverse-frontend
npm install
cp .env.example .env
# Edit .env with API base URL
npm run dev
```

Backend runs on `http://localhost:8000`, frontend on `http://localhost:3000`.

---

## Q2: Where is the judging logic?

**A:** The judging logic is in three files:

1. **Main judging**: `hackathon/src/judging/multi_agent_judge.py`
   - Calls Groq LLM API
   - Evaluates submission on clarity/quality/innovation
   - Returns consensus score

2. **Endpoint handler**: `hackathon/src/routes/judge.py`
   - Receives submission from frontend
   - Calls judging engine
   - Saves to database
   - Returns response

3. **Scoring criteria**: `hackathon/src/judging/rubric.py`
   - Defines scoring weights
   - Sets max points per criteria
   - Defines evaluation prompts

**To change scoring:** Edit `rubric.py` and redeploy.

---

## Q3: How do I debug errors?

**A:** Use these methods:

**Backend Logs:**
```bash
# View real-time logs
tail -f hackathon/data/logs.txt

# Or check console output when running locally
python -m uvicorn src.main:app --reload --log-level debug
```

**Frontend Logs:**
```bash
# Open browser DevTools (F12)
# Check Console tab for errors
# Check Network tab for API calls
```

**Database Logs:**
```bash
# Connect to MongoDB
mongosh "mongodb+srv://sejalfinal:Sejal%40123@cluster0.jrcmlaq.mongodb.net/hackaverse_db?retryWrites=true&w=majority"

# View submissions
db.submissions.find().pretty()

# View judgments
db.judgments.find().pretty()

# View audit trail
db.provenance.find().pretty()
```

**API Testing:**
```bash
# Test backend health
curl http://localhost:8000/health

# View API docs
http://localhost:8000/docs

# Test endpoint
curl -X POST http://localhost:8000/judge/score \
  -H "Content-Type: application/json" \
  -d '{"submission_text": "test", "team_id": "team_1"}'
```

---

## Q4: How do I change the scoring criteria?

**A:** Edit `hackathon/src/judging/rubric.py`:

```python
# Current criteria
CRITERIA = {
    "clarity": {"max": 10, "weight": 0.33},
    "tech_depth": {"max": 10, "weight": 0.33},
    "innovation": {"max": 10, "weight": 0.34}
}

# To add new criteria:
CRITERIA = {
    "clarity": {"max": 10, "weight": 0.25},
    "tech_depth": {"max": 10, "weight": 0.25},
    "innovation": {"max": 10, "weight": 0.25},
    "teamwork": {"max": 10, "weight": 0.25}  # NEW
}

# Then update the Groq prompt in multi_agent_judge.py
```

After changes, redeploy backend.

---

## Q5: How do I add a new API endpoint?

**A:** Follow these steps:

**Step 1:** Create route file or add to existing file in `hackathon/src/routes/`

```python
# hackathon/src/routes/my_feature.py
from fastapi import APIRouter, Depends
from ..auth import get_api_key
from ..schemas.response import APIResponse

router = APIRouter(prefix="/my-feature", tags=["my-feature"])

@router.get("/hello")
async def hello(current_user = Depends(get_api_key)):
    return APIResponse(
        success=True,
        message="Hello!",
        data={"greeting": "Hello World"}
    )
```

**Step 2:** Register in `hackathon/src/main.py`

```python
# Add import
from .routes.my_feature import router as my_feature_router

# Add to app
app.include_router(my_feature_router)
```

**Step 3:** Test endpoint

```bash
curl http://localhost:8000/my-feature/hello
```

**Step 4:** Add to frontend `hackaverse-frontend/src/services/api.js`

```javascript
export const apiService = {
  myFeature: {
    hello: () => api.get('/my-feature/hello'),
  }
}
```

---

## Q6: How do I add a new database collection?

**A:** MongoDB is schema-less, so you can just insert data:

```python
# In any route file
from ..database import get_db

db = get_db()

# Insert document
db.my_collection.insert_one({
    "field1": "value1",
    "field2": "value2"
})

# Query documents
docs = db.my_collection.find({"field1": "value1"})

# Update document
db.my_collection.update_one(
    {"_id": ObjectId("...")},
    {"$set": {"field1": "new_value"}}
)

# Delete document
db.my_collection.delete_one({"_id": ObjectId("...")})
```

---

## Q7: How do I handle authentication?

**A:** The system uses JWT tokens:

**Backend:**
```python
from ..auth import get_current_user

@router.get("/protected")
async def protected_route(current_user = Depends(get_current_user)):
    # current_user is the authenticated user object
    return {"user_id": current_user["_id"]}
```

**Frontend:**
```javascript
// Token is automatically added to all requests
// See api.js interceptor

// To check if user is logged in
const token = localStorage.getItem('authToken');
if (!token) {
  // User not logged in
}

// To logout
localStorage.removeItem('authToken');
localStorage.removeItem('userData');
```

---

## Q8: How do I deploy to production?

**A:** The system auto-deploys from GitHub:

**Backend (Render):**
1. Push code to GitHub: `git push origin main`
2. Render auto-detects changes from: https://github.com/Sejal060/hackathon.git
3. Render runs: `pip install -r requirements.txt`
4. Render runs: `python -m uvicorn hackathon.src.main:app --host 0.0.0.0 --port 8000`
5. Backend available at: `https://ai-agent-x2iw.onrender.com`

**Frontend (Vercel):**
1. Push code to GitHub: `git push origin main`
2. Vercel auto-detects changes from: https://github.com/blackholeinfiverse66/hackaverse.git
3. Vercel runs: `npm install && npm run build`
4. Frontend available at: `https://hackaverse-mu.vercel.app/`

**Environment Variables:**
- Set in Render dashboard for backend
- Set in Vercel dashboard for frontend

---

## Q9: What happens if the database goes down?

**A:** The system has degraded mode:

```
1. Backend tries to connect to MongoDB
2. If connection fails:
   - Backend prints: "❌ MongoDB Connection Failed"
   - Backend sets DB_AVAILABLE = False
   - Backend still runs (degraded mode)
3. Features that work:
   - Authentication (if cached)
   - API responses (but no data persistence)
4. Features that don't work:
   - Saving submissions
   - Saving judgments
   - Leaderboard
5. When database comes back:
   - Restart backend
   - Backend reconnects automatically
```

---

## Q10: How do I test the judging engine?

**A:** Use the API docs or curl:

**Via API Docs:**
1. Go to `http://localhost:8000/docs`
2. Find `/judge/submit` endpoint
3. Click "Try it out"
4. Enter submission text
5. Click "Execute"

**Via curl:**
```bash
curl -X POST http://localhost:8000/judge/submit \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_api_key" \
  -d '{
    "submission_text": "Our AI chatbot uses GPT-4 and RAG for customer support",
    "team_id": "team_42",
    "tenant_id": "default",
    "event_id": "default_event"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Submission judged successfully",
  "data": {
    "judging_result": {
      "consensus_score": 78.5,
      "criteria_scores": {
        "clarity": 8.5,
        "tech_depth": 7.8,
        "innovation": 8.2
      },
      "confidence": 0.92
    }
  }
}
```

---

## Q11: How do I view the leaderboard?

**A:** Two ways:

**Frontend:**
1. Go to `https://hackaverse-mu.vercel.app/leaderboard`
2. View public rankings

**API:**
```bash
curl https://ai-agent-x2iw.onrender.com/leaderboard/default_event
```

**Response:**
```json
{
  "success": true,
  "data": {
    "rankings": [
      {
        "rank": 1,
        "team_id": "team_42",
        "total_score": 85.5,
        "clarity": 8.5,
        "quality": 8.2,
        "innovation": 8.8
      }
    ]
  }
}
```

---

## Q12: How do I invite judges?

**A:** Use the admin dashboard:

**Frontend:**
1. Login as admin
2. Go to `/admin`
3. Click "Invite Judge"
4. Enter judge email
5. System sends invitation link

**API:**
```bash
curl -X POST https://ai-agent-x2iw.onrender.com/judge/invitations/send \
  -H "Content-Type: application/json" \
  -d '{
    "email": "judge@example.com",
    "hackathon_name": "HackaAIverse 2025"
  }'
```

---

## Q13: How do I handle file uploads?

**A:** Currently NOT IMPLEMENTED. To add:

```python
# In a route file
from fastapi import File, UploadFile

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    # Save file to disk or cloud storage
    contents = await file.read()
    
    # Save to local disk
    with open(f"uploads/{file.filename}", "wb") as f:
        f.write(contents)
    
    return {"filename": file.filename}
```

---

## Q14: How do I add real-time notifications?

**A:** Currently using polling. To add WebSockets:

```python
# In main.py
from fastapi import WebSocket

@app.websocket("/ws/notifications/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await websocket.accept()
    try:
        while True:
            # Send notification
            await websocket.send_json({
                "type": "notification",
                "message": "New submission judged"
            })
    except Exception as e:
        await websocket.close()
```

---

## Q15: How do I reset the database?

**A:** Two options:

**Option 1: Delete all data**
```bash
# Connect to MongoDB
mongosh "mongodb+srv://sejalfinal:Sejal%40123@cluster0.jrcmlaq.mongodb.net/hackaverse_db?retryWrites=true&w=majority"

# Delete all collections
db.users.deleteMany({})
db.teams.deleteMany({})
db.submissions.deleteMany({})
db.judgments.deleteMany({})
db.provenance.deleteMany({})
```

**Option 2: Seed with sample data**
```bash
cd hackathon
python seed_data.py
```

---

## Q16: How do I change the hackathon name?

**A:** Edit `.env` file:

```
HACKATHON_NAME=HackaAIverse 2025
HACKATHON_THEME=AI for Real Life
```

Then restart backend.

---

## Q17: How do I enable email notifications?

**A:** Configure SMTP in `.env`:

```
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
```

Then use in code:
```python
import smtplib
from email.mime.text import MIMEText

msg = MIMEText("Your submission was judged!")
msg['Subject'] = "Judgment Complete"
msg['From'] = os.getenv("EMAIL_USER")
msg['To'] = "user@example.com"

with smtplib.SMTP(os.getenv("SMTP_SERVER"), int(os.getenv("SMTP_PORT"))) as server:
    server.starttls()
    server.login(os.getenv("EMAIL_USER"), os.getenv("EMAIL_PASSWORD"))
    server.send_message(msg)
```

---

## Q18: How do I view system logs?

**A:** Logs are stored in multiple places:

**Backend logs:**
```bash
# Real-time logs
tail -f hackathon/data/logs.txt

# Or in MongoDB
mongosh "mongodb+srv://sejalfinal:Sejal%40123@cluster0.jrcmlaq.mongodb.net/hackaverse_db?retryWrites=true&w=majority"
db.logs.find().pretty()
```

**Frontend logs:**
```bash
# Browser console (F12)
# Network tab shows API calls
```

**Deployment logs:**
- Render: Dashboard → Logs
- Vercel: Dashboard → Deployments → Logs

---

## Q19: How do I handle errors in production?

**A:** The system has error handling:

```python
# In main.py
from .middleware_handlers.error_handler import api_exception_handler

app.add_exception_handler(Exception, api_exception_handler)
```

**Error Response Format:**
```json
{
  "success": false,
  "message": "Error description",
  "data": null
}
```

**To add custom error handling:**
```python
from fastapi import HTTPException

@router.get("/something")
async def something():
    try:
        # Do something
        pass
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={
                "success": false,
                "message": str(e)
            }
        )
```

---

## Q20: How do I scale the system?

**A:** Current bottlenecks and solutions:

| Bottleneck | Current | Solution |
|-----------|---------|----------|
| Database | MongoDB Atlas | Upgrade tier |
| Backend | Single Render instance | Add load balancer |
| Frontend | Single Vercel instance | Already auto-scales |
| AI Judging | Groq API | Increase quota |
| Storage | MongoDB | Add S3 for files |

**To scale:**
1. Upgrade MongoDB Atlas tier
2. Add Redis for caching
3. Use message queue (RabbitMQ) for async jobs
4. Add CDN for frontend assets
5. Increase Groq API quota

