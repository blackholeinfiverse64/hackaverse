# FAILURE_MAP.md - System Failure Scenarios & Recovery

## TABLE OF CONTENTS
1. Database Failures
2. Backend Failures
3. Frontend Failures
4. AI/Judging Failures
5. Authentication Failures
6. Network Failures
7. Deployment Failures
8. Data Corruption
9. Security Failures
10. Recovery Procedures

---

## 1. DATABASE FAILURES

### Scenario 1.1: MongoDB Connection Timeout

**What Happens:**
```
1. Backend tries to connect to MongoDB
2. Connection times out after 5 seconds
3. Backend prints: "❌ MongoDB Connection Failed"
4. DB_AVAILABLE = False
5. Backend continues in DEGRADED MODE
```

**What User Sees:**
- Features work but data not saved
- Submissions accepted but not persisted
- Leaderboard shows no data
- No error message (silent failure)

**Recovery:**
```bash
# Step 1: Check MongoDB Atlas status
# Go to: https://cloud.mongodb.com/v2/your-project-id

# Step 2: Verify connection string in .env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/db_name

# Step 3: Check IP whitelist
# MongoDB Atlas → Network Access → IP Whitelist
# Add your IP or 0.0.0.0/0 for development

# Step 4: Test connection locally
mongosh "mongodb+srv://user:pass@cluster.mongodb.net/db_name"

# Step 5: Restart backend
python -m uvicorn hackathon.src.main:app --reload
```

---

### Scenario 1.2: MongoDB Disk Full

**What Happens:**
```
1. MongoDB runs out of disk space
2. Write operations fail
3. Submissions can't be saved
4. Judgments can't be saved
5. System appears to work but data lost
```

**What User Sees:**
- Submission accepted
- No score returned
- No error message
- Data disappears

**Recovery:**
```bash
# Step 1: Check MongoDB Atlas storage
# MongoDB Atlas → Clusters → Storage

# Step 2: Delete old data
mongosh "mongodb+srv://user:pass@cluster.mongodb.net/db_name"
db.submissions.deleteMany({"timestamp": {$lt: 1234567890}})
db.judgments.deleteMany({"timestamp": {$lt: 1234567890}})

# Step 3: Upgrade MongoDB tier
# MongoDB Atlas → Clusters → Upgrade

# Step 4: Restart backend
python -m uvicorn hackathon.src.main:app --reload
```

---

### Scenario 1.3: MongoDB Authentication Failed

**What Happens:**
```
1. Backend tries to connect with wrong credentials
2. MongoDB rejects connection
3. Backend prints: "❌ MongoDB Connection Failed"
4. System runs in DEGRADED MODE
```

**What User Sees:**
- All features work but no data persistence
- Leaderboard empty
- Submissions not saved

**Recovery:**
```bash
# Step 1: Verify credentials in .env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/db_name

# Step 2: Check MongoDB Atlas user
# MongoDB Atlas → Database Access → Users
# Verify username and password

# Step 3: Reset password if needed
# MongoDB Atlas → Database Access → Edit User

# Step 4: Update .env with correct credentials

# Step 5: Restart backend
python -m uvicorn hackathon.src.main:app --reload
```

---

### Scenario 1.4: MongoDB Network Unreachable

**What Happens:**
```
1. Network connection to MongoDB lost
2. Backend can't reach MongoDB servers
3. Connection timeout after 5 seconds
4. System runs in DEGRADED MODE
```

**What User Sees:**
- Features work but no data saved
- Submissions accepted but lost
- No error message

**Recovery:**
```bash
# Step 1: Check internet connection
ping 8.8.8.8

# Step 2: Check MongoDB Atlas status
# Go to: https://cloud.mongodb.com/v2/your-project-id

# Step 3: Check firewall rules
# Verify port 27017 is not blocked

# Step 4: Check MongoDB Atlas IP whitelist
# Add your IP: MongoDB Atlas → Network Access

# Step 5: Restart backend
python -m uvicorn hackathon.src.main:app --reload
```

---

## 2. BACKEND FAILURES

### Scenario 2.1: Backend Crashes

**What Happens:**
```
1. Backend process crashes
2. Port 8000 becomes unavailable
3. Frontend can't connect
4. All API calls fail
```

**What User Sees:**
- "Cannot connect to server" error
- All features disabled
- Redirect to login page
- Toast notification: "Network error"

**Recovery:**
```bash
# Step 1: Check if backend is running
lsof -i :8000  # On Mac/Linux
netstat -ano | findstr :8000  # On Windows

# Step 2: Kill any stuck processes
kill -9 <PID>  # On Mac/Linux
taskkill /PID <PID> /F  # On Windows

# Step 3: Check logs for errors
tail -f hackathon/data/logs.txt

# Step 4: Restart backend
cd hackathon
python -m uvicorn src.main:app --reload

# Step 5: Verify health
curl http://localhost:8000/health
```

---

### Scenario 2.2: Backend Out of Memory

**What Happens:**
```
1. Backend process uses too much RAM
2. System kills process (OOM killer)
3. Backend crashes
4. Port 8000 becomes unavailable
```

**What User Sees:**
- "Cannot connect to server" error
- All features stop working

**Recovery:**
```bash
# Step 1: Check memory usage
ps aux | grep python  # On Mac/Linux
tasklist | findstr python  # On Windows

# Step 2: Identify memory leak
# Check logs for repeated allocations
tail -f hackathon/data/logs.txt

# Step 3: Restart backend
python -m uvicorn hackathon.src.main:app --reload

# Step 4: Monitor memory
watch -n 1 'ps aux | grep python'

# Step 5: If persists, check for:
# - Infinite loops
# - Unclosed database connections
# - Memory leaks in dependencies
```

---

### Scenario 2.3: Backend Port Already in Use

**What Happens:**
```
1. Another process using port 8000
2. Backend can't start
3. Error: "Address already in use"
```

**What User Sees:**
- Backend won't start
- Error in terminal

**Recovery:**
```bash
# Step 1: Find process using port 8000
lsof -i :8000  # On Mac/Linux
netstat -ano | findstr :8000  # On Windows

# Step 2: Kill the process
kill -9 <PID>  # On Mac/Linux
taskkill /PID <PID> /F  # On Windows

# Step 3: Start backend on different port
python -m uvicorn hackathon.src.main:app --port 8001

# Step 4: Update frontend .env
VITE_API_BASE_URL=http://localhost:8001
```

---

### Scenario 2.4: Backend Import Error

**What Happens:**
```
1. Missing Python dependency
2. Backend fails to import module
3. Backend won't start
4. Error: "ModuleNotFoundError"
```

**What User Sees:**
- Backend won't start
- Error in terminal

**Recovery:**
```bash
# Step 1: Check error message
# Look for: ModuleNotFoundError: No module named 'xxx'

# Step 2: Install missing dependency
pip install xxx

# Step 3: Or reinstall all dependencies
pip install -r requirements.txt

# Step 4: Restart backend
python -m uvicorn hackathon.src.main:app --reload
```

---

## 3. FRONTEND FAILURES

### Scenario 3.1: Frontend Won't Load

**What Happens:**
```
1. Frontend build fails
2. Vite can't compile JSX
3. Browser shows blank page
4. Console shows error
```

**What User Sees:**
- Blank white page
- Browser console shows error

**Recovery:**
```bash
# Step 1: Check browser console (F12)
# Look for error message

# Step 2: Clear cache
# Browser → Settings → Clear browsing data

# Step 3: Restart frontend
npm run dev

# Step 4: Check for syntax errors
# Look for red squiggly lines in IDE

# Step 5: If persists, rebuild
npm run build
npm run preview
```

---

### Scenario 3.2: Frontend Can't Connect to Backend

**What Happens:**
```
1. Frontend makes API call
2. Backend not responding
3. Request times out
4. Error: "Network error"
```

**What User Sees:**
- "Cannot connect to server" toast
- Features disabled
- Redirect to login

**Recovery:**
```bash
# Step 1: Check backend is running
curl http://localhost:8000/health

# Step 2: Check VITE_API_BASE_URL in .env
VITE_API_BASE_URL=http://localhost:8000

# Step 3: Check CORS settings in main.py
# Should have: allow_origins=["*"]

# Step 4: Check browser console for CORS error
# If CORS error, update main.py

# Step 5: Restart frontend
npm run dev
```

---

### Scenario 3.3: Frontend JavaScript Error

**What Happens:**
```
1. React component throws error
2. Error boundary catches it
3. Page shows error message
4. Feature stops working
```

**What User Sees:**
- "Something went wrong" error
- Feature disabled
- Error details in console

**Recovery:**
```bash
# Step 1: Open browser console (F12)
# Look for error message

# Step 2: Check which component failed
# Error boundary shows component name

# Step 3: Check recent changes
# git diff

# Step 4: Revert changes if needed
# git checkout -- src/components/xxx.jsx

# Step 5: Restart frontend
npm run dev
```

---

## 4. AI/JUDGING FAILURES

### Scenario 4.1: Groq API Rate Limited

**What Happens:**
```
1. Too many requests to Groq API
2. Groq returns 429 Too Many Requests
3. Judging fails
4. System returns fallback score (50)
```

**What User Sees:**
- Submission scored as 50/100
- Response includes: "fallback": true
- No error message

**Recovery:**
```bash
# Step 1: Check Groq API quota
# Go to: https://console.groq.com/keys

# Step 2: Wait 60 seconds before retrying
# Rate limit resets automatically

# Step 3: Upgrade Groq plan if needed
# https://console.groq.com/billing

# Step 4: Implement request queuing
# Add to judge.py:
from queue import Queue
judging_queue = Queue()

# Step 5: Restart backend
python -m uvicorn hackathon.src.main:app --reload
```

---

### Scenario 4.2: Groq API Key Invalid

**What Happens:**
```
1. GROQ_API_KEY in .env is wrong
2. Groq returns 401 Unauthorized
3. Judging fails
4. System returns fallback score (50)
```

**What User Sees:**
- Submission scored as 50/100
- Response includes: "fallback": true

**Recovery:**
```bash
# Step 1: Check GROQ_API_KEY in .env
GROQ_API_KEY=your_actual_key

# Step 2: Get correct key from Groq
# Go to: https://console.groq.com/keys

# Step 3: Update .env with correct key

# Step 4: Restart backend
python -m uvicorn hackathon.src.main:app --reload

# Step 5: Test judging
curl -X POST http://localhost:8000/judge/score \
  -H "Content-Type: application/json" \
  -d '{"submission_text": "test", "team_id": "team_1"}'
```

---

### Scenario 4.3: Groq API Timeout

**What Happens:**
```
1. Groq API takes too long to respond
2. Request times out after 30 seconds
3. Judging fails
4. System returns fallback score (50)
```

**What User Sees:**
- Long wait (30 seconds)
- Submission scored as 50/100
- Response includes: "fallback": true

**Recovery:**
```bash
# Step 1: Check Groq API status
# Go to: https://status.groq.com

# Step 2: Reduce submission text length
# Shorter text = faster processing

# Step 3: Increase timeout in judge.py
# Change: timeout=30 to timeout=60

# Step 4: Implement async processing
# Use background tasks for judging

# Step 5: Restart backend
python -m uvicorn hackathon.src.main:app --reload
```

---

### Scenario 4.4: Groq API Model Unavailable

**What Happens:**
```
1. Groq model (llama-3.1-8b-instant) unavailable
2. Groq returns 503 Service Unavailable
3. Judging fails
4. System returns fallback score (50)
```

**What User Sees:**
- Submission scored as 50/100
- Response includes: "fallback": true

**Recovery:**
```bash
# Step 1: Check Groq status
# Go to: https://status.groq.com

# Step 2: Try different model
# Edit .env:
GROQ_MODEL=mixtral-8x7b-32768

# Step 3: Update judge.py to use new model

# Step 4: Restart backend
python -m uvicorn hackathon.src.main:app --reload

# Step 5: Wait for Groq to recover
# Usually resolves within 1 hour
```

---

## 5. AUTHENTICATION FAILURES

### Scenario 5.1: JWT Token Expired

**What Happens:**
```
1. User's access token expires (15 min)
2. Frontend makes API call with expired token
3. Backend returns 401 Unauthorized
4. Frontend calls /auth/refresh
5. Backend returns new token
6. Frontend retries original request
```

**What User Sees:**
- Seamless experience (automatic refresh)
- No interruption

**Recovery:**
```bash
# Step 1: Check token expiry
# In browser console:
const token = localStorage.getItem('authToken');
const decoded = jwt_decode(token);
console.log(decoded.exp);

# Step 2: If expired, login again
# Frontend will handle automatically

# Step 3: If refresh fails, clear storage
localStorage.clear();

# Step 4: Login again
```

---

### Scenario 5.2: Refresh Token Invalid

**What Happens:**
```
1. Access token expired
2. Frontend tries to refresh
3. Refresh token invalid/expired
4. Backend returns 401
5. Frontend redirects to login
```

**What User Sees:**
- Redirected to login page
- Session expired message

**Recovery:**
```bash
# Step 1: Clear localStorage
localStorage.clear();

# Step 2: Login again
# Go to: http://localhost:3000

# Step 3: Enter credentials
# Email and password

# Step 4: New tokens generated
```

---

### Scenario 5.3: Wrong Password

**What Happens:**
```
1. User enters wrong password
2. Backend validates password
3. Password hash doesn't match
4. Backend returns 401 Unauthorized
```

**What User Sees:**
- Error: "Invalid email or password"
- Login fails

**Recovery:**
```bash
# Step 1: Check email is correct
# Verify spelling

# Step 2: Check password is correct
# Verify caps lock is off

# Step 3: Reset password if forgotten
# Click "Forgot Password" link
# (If implemented)

# Step 4: Try again
```

---

## 6. NETWORK FAILURES

### Scenario 6.1: Internet Connection Lost

**What Happens:**
```
1. User loses internet connection
2. Frontend can't reach backend
3. API call fails
4. Error: "Network error"
```

**What User Sees:**
- "Network error: No response from server"
- Features disabled
- Offline indicator (if implemented)

**Recovery:**
```bash
# Step 1: Restore internet connection
# Check WiFi or mobile data

# Step 2: Refresh page
# Browser → Refresh (Ctrl+R)

# Step 3: Retry operation
# Click button again
```

---

### Scenario 6.2: Slow Network

**What Happens:**
```
1. Network is very slow
2. API requests take 30+ seconds
3. Frontend timeout (default 30s)
4. Error: "Request timeout"
```

**What User Sees:**
- Long wait
- "Request timeout" error
- Feature fails

**Recovery:**
```bash
# Step 1: Check internet speed
# speedtest.net

# Step 2: Increase timeout in api.js
// Change: timeout: 30000 to timeout: 60000

# Step 3: Restart frontend
npm run dev

# Step 4: Retry operation
```

---

## 7. DEPLOYMENT FAILURES

### Scenario 7.1: Render Deployment Failed

**What Happens:**
```
1. Push code to GitHub
2. Render tries to deploy
3. Build fails (missing dependency, syntax error)
4. Deployment cancelled
5. Old version still running
```

**What User Sees:**
- Old version still works
- New features not available

**Recovery:**
```bash
# Step 1: Check Render logs
# Render Dashboard → Logs

# Step 2: Fix error locally
# Run: python -m uvicorn hackathon.src.main:app --reload

# Step 3: Commit and push fix
git add .
git commit -m "Fix deployment error"
git push origin main

# Step 4: Render auto-redeploys
# Check Render Dashboard → Deployments
```

---

### Scenario 7.2: Vercel Deployment Failed

**What Happens:**
```
1. Push code to GitHub
2. Vercel tries to build
3. Build fails (npm error, syntax error)
4. Deployment cancelled
5. Old version still running
```

**What User Sees:**
- Old version still works
- New features not available

**Recovery:**
```bash
# Step 1: Check Vercel logs
# Vercel Dashboard → Deployments → Logs

# Step 2: Fix error locally
npm run build

# Step 3: Commit and push fix
git add .
git commit -m "Fix build error"
git push origin main

# Step 4: Vercel auto-redeploys
# Check Vercel Dashboard → Deployments
```

---

## 8. DATA CORRUPTION

### Scenario 8.1: Duplicate Submission (Replay Attack)

**What Happens:**
```
1. User submits same project twice
2. System detects duplicate (same hash)
3. Returns 409 Conflict
4. Submission not saved
```

**What User Sees:**
- Error: "Duplicate submission detected"
- Submission rejected

**Recovery:**
```bash
# Step 1: Modify submission slightly
# Change text or add timestamp

# Step 2: Resubmit
# System accepts new submission

# Step 3: Or wait 1 hour
# Replay protection expires after 1 hour
```

---

### Scenario 8.2: Corrupted Database Record

**What Happens:**
```
1. Database record corrupted
2. Query returns invalid data
3. Frontend displays error
4. Feature fails
```

**What User Sees:**
- Error message
- Feature disabled

**Recovery:**
```bash
# Step 1: Connect to MongoDB
mongosh "mongodb+srv://user:pass@cluster.mongodb.net/db_name"

# Step 2: Find corrupted record
db.submissions.find({"_id": ObjectId("...")})

# Step 3: Delete corrupted record
db.submissions.deleteOne({"_id": ObjectId("...")})

# Step 4: Restart backend
python -m uvicorn hackathon.src.main:app --reload
```

---

## 9. SECURITY FAILURES

### Scenario 9.1: API Key Leaked

**What Happens:**
```
1. API key exposed in GitHub
2. Attacker uses key to make requests
3. System receives unauthorized requests
4. Quota exceeded
```

**What User Sees:**
- API rate limited
- Features slow or unavailable

**Recovery:**
```bash
# Step 1: Rotate API key
# Go to: https://console.groq.com/keys
# Delete old key, create new key

# Step 2: Update .env
GROQ_API_KEY=new_key

# Step 3: Restart backend
python -m uvicorn hackathon.src.main:app --reload

# Step 4: Remove key from GitHub history
git filter-branch --tree-filter 'rm -f .env' HEAD
git push origin main --force
```

---

### Scenario 9.2: SQL Injection (Not Applicable - Using MongoDB)

**What Happens:**
```
MongoDB uses BSON, not SQL, so SQL injection not possible.
But NoSQL injection is possible if not careful.
```

**Recovery:**
```python
# WRONG - Vulnerable to NoSQL injection
db.users.find({"email": user_input})

# RIGHT - Use Pydantic validation
from pydantic import BaseModel, EmailStr

class UserQuery(BaseModel):
    email: EmailStr

# Then use validated data
db.users.find({"email": query.email})
```

---

## 10. RECOVERY PROCEDURES

### Full System Recovery

**If everything is broken:**

```bash
# Step 1: Stop all services
# Kill backend: Ctrl+C
# Kill frontend: Ctrl+C

# Step 2: Clear caches
# Frontend: localStorage.clear()
# Backend: rm -rf __pycache__

# Step 3: Reinstall dependencies
cd hackathon
pip install -r requirements.txt --force-reinstall

cd ../hackaverse-frontend
npm install --force

# Step 4: Reset database (if needed)
# MongoDB Atlas → Delete all collections
# Or run: python hackathon/seed_data.py

# Step 5: Restart services
# Terminal 1: cd hackathon && python -m uvicorn src.main:app --reload
# Terminal 2: cd hackaverse-frontend && npm run dev

# Step 6: Verify health
curl http://localhost:8000/health
curl http://localhost:3000
```

---

### Backup & Restore

**Backup MongoDB:**
```bash
# Export all data
mongodump --uri="mongodb+srv://user:pass@cluster.mongodb.net/db_name" --out=./backup

# Or use MongoDB Atlas backup
# MongoDB Atlas → Backup → Create Backup
```

**Restore MongoDB:**
```bash
# Import data
mongorestore --uri="mongodb+srv://user:pass@cluster.mongodb.net/db_name" ./backup
```

---

### Monitoring & Alerts

**To prevent failures, monitor:**

```bash
# Backend health
watch -n 5 'curl -s http://localhost:8000/health | jq'

# Database connection
watch -n 5 'curl -s http://localhost:8000/system/db-status | jq'

# System logs
tail -f hackathon/data/logs.txt

# Memory usage
watch -n 1 'ps aux | grep python'

# Disk usage
watch -n 5 'df -h'
```

---

## EMERGENCY CONTACTS

| Issue | Contact | Response Time |
|-------|---------|----------------|
| Database down | MongoDB Support | 1 hour |
| Backend down | Render Support | 30 min |
| Frontend down | Vercel Support | 30 min |
| AI API down | Groq Support | 1 hour |
| Security breach | Your team | Immediate |

---

## FAILURE CHECKLIST

When something breaks:

- [ ] Check error message in console/logs
- [ ] Verify all services are running
- [ ] Check internet connection
- [ ] Check API keys and credentials
- [ ] Check database connection
- [ ] Check firewall/network settings
- [ ] Restart affected service
- [ ] Clear caches (browser, npm, pip)
- [ ] Check recent code changes
- [ ] Revert if needed
- [ ] Contact support if still broken

