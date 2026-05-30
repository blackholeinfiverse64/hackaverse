# HackaVerse — Deterministic Startup Checklist

> **Gate-based checklist. Every step must pass before proceeding to the next.**
> Last updated: 2026-05-11

---

## Pre-flight Checks

- [ ] **Git clone** is clean (no uncommitted changes from previous sessions)
- [ ] Python 3.10+ installed: `python --version`
- [ ] Node.js 18+ installed: `node --version`
- [ ] npm 9+ installed: `npm --version`

---

## Gate 1: Backend Environment

- [ ] `hackathon/.env` exists (copied from `.env.example`)
- [ ] `MONGODB_URI` is set and starts with `mongodb://` or `mongodb+srv://`
- [ ] `GROQ_API_KEY` is set (or you accept fallback scoring)
- [ ] `API_KEY` is set to a unique value (not `default_key`)
- [ ] `ALLOWED_ORIGINS` is set appropriately

**Validation:**
```bash
cd hackathon
cat .env | grep MONGODB_URI  # Should show a valid URI
cat .env | grep API_KEY       # Should NOT be empty or "default_key"
```

---

## Gate 2: Backend Dependencies

- [ ] Virtual environment created: `python -m venv venv`
- [ ] Virtual environment activated
- [ ] Dependencies installed: `pip install -r requirements.txt`
- [ ] No pip install errors

**Validation:**
```bash
python -c "import fastapi; print(fastapi.__version__)"
python -c "import pymongo; print(pymongo.version)"
```

---

## Gate 3: Backend Startup

- [ ] Backend starts without crash: `python -m uvicorn src.main:app --reload --port 8000`
- [ ] Startup banner shows `[STARTUP] HackaVerse Backend Starting...`
- [ ] MongoDB connection result shown (either ✅ Connected or ⚠️ Degraded)
- [ ] No import errors in console

**Validation:**
```bash
curl http://localhost:8000/health
# Expected: {"success": true, "data": {"status": "ok", ...}}
```

---

## Gate 4: Backend API Verification

- [ ] `/health` returns 200 with `"status": "ok"`
- [ ] `/docs` loads Swagger UI in browser
- [ ] `/auth/register` accepts POST with valid payload
- [ ] `/auth/login` returns access token

**Validation:**
```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"test123456"}'
```

---

## Gate 5: Frontend Environment

- [ ] `hackaverse-frontend/.env` exists (copied from `.env.example`)
- [ ] `VITE_API_URL` is set to `http://localhost:8000`
- [ ] `VITE_API_KEY` matches backend `API_KEY`

**Validation:**
```bash
cd hackaverse-frontend
cat .env | grep VITE_API_URL   # Should be http://localhost:8000
cat .env | grep VITE_API_KEY   # Should match backend API_KEY
```

---

## Gate 6: Frontend Startup

- [ ] Dependencies installed: `npm install`
- [ ] Frontend starts: `npm run dev`
- [ ] Vite shows `Local: http://localhost:3000/`
- [ ] Browser loads the app

**Validation:**
Open `http://localhost:3000` → app should render without blank screen

---

## Gate 7: End-to-End Verification

- [ ] Frontend can reach backend (no CORS errors in browser console)
- [ ] Login/Register works from the UI
- [ ] Health check visible in browser network tab
- [ ] API key is sent in `X-API-Key` header (check DevTools → Network)

---

## Gate 8: Degraded Mode Awareness

- [ ] You know what happens when MongoDB is unavailable (degraded mode)
- [ ] You know what happens when Groq API key is missing (fallback scores)
- [ ] You know what happens when BHIV Core is unreachable (silent skip)

---

## Completion

If all 8 gates pass, the system is **deterministically operational**.

| Gate | Status | Notes |
|------|--------|-------|
| 1. Backend Env | ☐ | |
| 2. Backend Deps | ☐ | |
| 3. Backend Start | ☐ | |
| 4. API Verify | ☐ | |
| 5. Frontend Env | ☐ | |
| 6. Frontend Start | ☐ | |
| 7. E2E Verify | ☐ | |
| 8. Degraded Mode | ☐ | |
