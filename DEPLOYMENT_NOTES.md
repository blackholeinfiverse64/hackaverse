# HackaVerse — Deployment Notes

> **Canonical deployment reference for Render (backend) and Vercel (frontend).**
> Last updated: 2026-05-11

---

## Architecture

```
[Developer] → git push → [GitHub] → [Render / Vercel auto-deploy]
                                          │
                                          ▼
                              [MongoDB Atlas - shared]
```

---

## Backend Deployment (Render)

### Configuration

| Setting | Value |
|---------|-------|
| **Platform** | Render |
| **Service Type** | Web Service |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `uvicorn src.main:app --host 0.0.0.0 --port $PORT` |
| **Health Check** | `GET /system/ready` |
| **Plan** | Free tier |
| **Root Directory** | `hackathon/` |
| **Render YAML** | `hackathon/render.yaml` |

### Environment Variables (Set in Render Dashboard)

> ⚠️ Do NOT commit secrets to render.yaml — use Render's dashboard.

| Variable | Source |
|----------|--------|
| `MONGODB_URI` | Dashboard secret |
| `GROQ_API_KEY` | Dashboard secret |
| `API_KEY` | Dashboard secret |
| `SECURITY_SECRET_KEY` | Dashboard secret |
| `AUTHOR_PASSWORD` | Dashboard secret |
| `ALLOWED_ORIGINS` | Dashboard env var |
| `ENV` | `production` |

### Cold Start Behavior

- Render free tier **sleeps after 15 minutes** of no inbound requests
- First request after sleep = **30–60 second delay** (cold start)
- Frontend has `API_TIMEOUT=30000` (30s) to accommodate this
- The `/system/ready` health check keeps the service warm during Render's health checks

### Deploy Trigger

Push to the connected GitHub branch → Render auto-deploys.

---

## Frontend Deployment (Vercel)

### Configuration

| Setting | Value |
|---------|-------|
| **Platform** | Vercel |
| **Framework** | Vite |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Root Directory** | `hackaverse-frontend/` |
| **Vercel Config** | `hackaverse-frontend/vercel.json` |

### vercel.json

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ]
}
```

This ensures all routes are handled by the SPA router (React Router).

### Environment Variables (Set in Vercel Dashboard)

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `https://ai-agent-x2iw.onrender.com` |
| `VITE_API_KEY` | Must match backend API_KEY |
| `VITE_NODE_ENV` | `production` |

### Build Optimizations

From `vite.config.js`:
- `sourcemap: false` — no source maps in production
- `drop_console: true` — console.log stripped via Terser
- `manualChunks` — vendor code split for caching

### Deploy Trigger

Push to the connected GitHub branch → Vercel auto-deploys.

---

## Deployment Checklist

### Pre-Deploy

- [ ] All environment variables set in Render/Vercel dashboards
- [ ] No hardcoded secrets in committed code
- [ ] Frontend `VITE_API_KEY` matches backend `API_KEY`
- [ ] `ALLOWED_ORIGINS` set to `https://hackaverse-mu.vercel.app`
- [ ] `AUTHOR_PASSWORD` changed from default

### Post-Deploy Verification

- [ ] Backend health: `curl https://ai-agent-x2iw.onrender.com/health`
- [ ] API docs: `https://ai-agent-x2iw.onrender.com/docs`
- [ ] Frontend loads: `https://hackaverse-mu.vercel.app`
- [ ] Auth flow works (register + login)
- [ ] No CORS errors in browser console

---

## Known Deployment Constraints

1. **Render free tier sleeps** — no guaranteed uptime
2. **No CI/CD pipeline** — deployment is git-push triggered only
3. **No staging environment** — dev and prod share the same MongoDB cluster
4. **No rollback mechanism** — manual git revert required
5. **No deployment notifications** — check Render/Vercel dashboards manually
