# HackaVerse — Local vs Production Differences

> **Deterministic reference for understanding environment-specific behavior.**
> Last updated: 2026-05-11

---

## Environment Matrix

| Dimension | Local Development | Production |
|-----------|-------------------|------------|
| **Backend Host** | `localhost:8000` | `ai-agent-x2iw.onrender.com` |
| **Frontend Host** | `localhost:3000` | `hackaverse-mu.vercel.app` |
| **Database** | MongoDB Atlas (same cluster) | MongoDB Atlas (same cluster) |
| **AI Judging** | Groq API (direct) | Groq API (direct) |
| **CORS** | `ALLOWED_ORIGINS=*` | Should be `https://hackaverse-mu.vercel.app` |
| **Backend Runtime** | `uvicorn --reload` | `uvicorn` (no reload, Render managed) |
| **Frontend Build** | Vite dev server (HMR) | Vite build → static files via Vercel |
| **Console Logs** | Enabled | Stripped by Terser (`drop_console: true`) |
| **Source Maps** | Enabled (default) | Disabled (`sourcemap: false`) |
| **ENV flag** | `ENV=development` | `ENV=production` |

---

## Configuration Differences

### Backend `.env`

| Variable | Local Value | Production Value | Notes |
|----------|-------------|------------------|-------|
| `MONGODB_URI` | Your Atlas connection string | Set via Render env vars | Same Atlas cluster in both |
| `PORT` | `8000` | Set by Render (`$PORT`) | Render assigns dynamically |
| `ENV` | `development` | `production` | Controls logging behavior |
| `ALLOWED_ORIGINS` | `*` | Specific domain(s) | **Security-critical** |
| `API_KEY` | Dev key | Production key | **Must differ** |
| `SECURITY_SECRET_KEY` | Unset (optional security) | **Must be set** | Enforces request signing |
| `AUTHOR_PASSWORD` | Default | **Must be changed** | Admin access |

### Frontend `.env`

| Variable | Local Value | Production Value | Notes |
|----------|-------------|------------------|-------|
| `VITE_API_URL` | `http://localhost:8000` | `https://ai-agent-x2iw.onrender.com` | Backend API endpoint |
| `VITE_API_KEY` | Dev key | Production key | Must match backend |
| `VITE_NODE_ENV` | `development` | `production` | Build behavior |

---

## Behavioral Differences

### Hot Reload

| Environment | Backend | Frontend |
|-------------|---------|----------|
| Local | `--reload` flag restarts on file change | Vite HMR (instant) |
| Production | No reload. Process managed by Render | Static build served by Vercel CDN |

### Error Handling

| Behavior | Local | Production |
|----------|-------|------------|
| Stack traces | Shown in terminal | Logged but not exposed to client |
| Console output | Full debug logs | `console.log` stripped from frontend bundle |
| API error detail | Full error messages | Generic error messages recommended |

### Database

Both environments connect to the **same MongoDB Atlas cluster** by default. This means:
- Local development writes to production data unless you use a separate database
- **Recommendation:** Create a separate `hackaverse_dev_db` database for local development

### CORS

| Environment | Behavior |
|-------------|----------|
| Local | `ALLOWED_ORIGINS=*` — accepts all origins |
| Production | Should be `https://hackaverse-mu.vercel.app` only |

> ⚠️ **Current production has `ALLOWED_ORIGINS=*`** — this is a security gap documented in `SECURITY_CLEANUP_REPORT.md`.

### Render Cold Starts

- Render free tier puts the service to sleep after 15 minutes of inactivity
- First request after sleep takes 30–60 seconds (cold start)
- Frontend has `API_TIMEOUT=30000` (30s) to accommodate this
- This does NOT apply to local development

---

## Deployment Pipeline

### Backend (Render)

```
Git push to main → Render detects change → pip install → uvicorn starts
```

Configuration: `hackathon/render.yaml`
- Build: `pip install -r requirements.txt`
- Start: `uvicorn src.main:app --host 0.0.0.0 --port $PORT`
- Health check: `/system/ready`

### Frontend (Vercel)

```
Git push to main → Vercel detects change → npm install → vite build → deploy to CDN
```

Configuration: `hackaverse-frontend/vercel.json`
- SPA rewrites: all routes → `/index.html`
- Build output: `dist/`

---

## What To Verify After Each Deploy

| Check | Command / Action | Expected |
|-------|-----------------|----------|
| Backend alive | `curl https://ai-agent-x2iw.onrender.com/health` | `"status": "ok"` |
| API docs | Open `https://ai-agent-x2iw.onrender.com/docs` | Swagger UI loads |
| Frontend loads | Open `https://hackaverse-mu.vercel.app` | App renders |
| Auth flow | Register + Login | Token returned |
| DB writes | Create a team or submission | Data persists |
