# HackaVerse — Failure Observability Guide

> **What fails, where, how to detect it, and what happens when it does.**
> Last updated: 2026-05-11

---

## Failure Matrix

| Failure Point | Detection Method | Impact | Recovery |
|--------------|-----------------|--------|----------|
| MongoDB unreachable | Startup log: `MongoDB Connection Failed` | Auth, teams, submissions fail. Backend runs in degraded mode | Fix URI/network, restart backend |
| Groq API unreachable | Judge response: `fallback: true` | AI scoring returns 50/100 fallback | Set GROQ_API_KEY, verify network |
| BHIV Core unreachable | Logger: `Failed to connect to BHIV Core` | Bucket logging continues locally, Core relay skipped | Start BHIV Core or ignore |
| Invalid API key | HTTP 401 response | All authenticated requests fail | Set matching API_KEY in frontend/backend |
| Rate limit exceeded | HTTP 429 response | Requests blocked for cooldown period | Wait, reduce request frequency |
| CORS violation | Browser console: `CORS policy` | Frontend cannot reach backend | Set ALLOWED_ORIGINS in backend |
| Port conflict | Backend won't start: `Address already in use` | Backend can't bind to port | Kill conflicting process or change PORT |
| Missing dependencies | ImportError in backend logs | Backend crash on startup | `pip install -r requirements.txt` |
| Frontend build fail | Vite error output | Frontend won't start | Fix JS/JSX errors, `npm install` |
| JWT token expired | HTTP 401 on authenticated routes | User session ends | Re-login from frontend |

---

## Observable Health Indicators

### Backend Health
```bash
curl http://localhost:8000/health
```

| Response | Meaning |
|----------|---------|
| `{"status": "ok", "database": "✅ Connected"}` | Fully operational |
| `{"status": "ok", "database": "❌ Not Connected"}` | Degraded mode |
| Connection refused | Backend not running |
| Timeout | Backend starting or hung |

### Database Health
```bash
curl http://localhost:8000/system/db-status
```

Returns collection list and connection state.

### OpenAPI Spec
```bash
curl http://localhost:8000/openapi.json | python -m json.tool | head -20
```

If this returns valid JSON, the backend's route registration is healthy.

---

## Degraded Mode Behavior

When MongoDB is unavailable:

| Feature | Behavior |
|---------|----------|
| `/health` | Returns 200 with `database: "❌ Not Connected"` |
| `/auth/register` | Fails — cannot persist user |
| `/auth/login` | Fails — cannot query user |
| `/judge/score` | May fail if storing results to DB |
| `/leaderboard` | Returns empty rankings |
| Bucket logging | Still works (local filesystem) |

---

## Logging Locations

| Log Type | Location | Format |
|----------|----------|--------|
| Backend stdout | Terminal / Render logs | Plain text |
| KSML events | `./data/bucket/logs_*.json` | JSON |
| Provenance chain | MongoDB `provenance_logs` | BSON |
| Failed BHIV sends | Logger output | Plain text |
| Frontend errors | Browser console | JS console |

---

## Failure Escalation Path

1. **Check backend health:** `curl /health`
2. **Check backend logs:** Terminal output or Render dashboard
3. **Check MongoDB:** Atlas dashboard → Cluster → Monitoring
4. **Check bucket logs:** `ls -la ./data/bucket/`
5. **Check frontend console:** Browser DevTools → Console
6. **Check network:** Browser DevTools → Network tab
7. **Check environment:** Verify `.env` files match expected values

---

## Monitoring Gaps

| What's Missing | Impact |
|---------------|--------|
| No APM tool | Cannot track request latency or error rates |
| No log aggregation | Logs disappear on container restart (Render) |
| No alerting | No notification when service goes down |
| No structured error codes | Errors are strings, not machine-parseable |
| No Sentry/Rollbar | Frontend JS errors not captured |

These are acceptable for the current stage but should be addressed before production scaling.
