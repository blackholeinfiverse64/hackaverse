# HackaVerse — Contributing Guide

> **Rules and conventions for contributing to this codebase.**
> Last updated: 2026-05-11

---

## Code Organization

```
hackathon/                      # Backend (FastAPI)
├── src/
│   ├── main.py                 # Entry point, route registration
│   ├── database.py             # MongoDB connection
│   ├── security.py             # HMAC, nonce, rate limiting, KSML
│   ├── middleware.py            # SecurityMiddleware
│   ├── executor.py              # Groq AI execution
│   ├── auth.py                  # Auth helpers
│   ├── core/
│   │   └── config.py           # Application settings
│   ├── routes/                  # API route handlers
│   │   ├── auth_routes.py
│   │   ├── judge.py
│   │   ├── hackathon.py
│   │   ├── teams.py
│   │   ├── submissions.py
│   │   ├── leaderboard.py
│   │   ├── notifications.py
│   │   ├── admin.py
│   │   └── system.py
│   ├── judging/                 # AI judging engine
│   │   ├── multi_agent_judge.py
│   │   ├── consensus.py
│   │   └── rubric.py
│   └── integrations/            # External service connectors
│       └── bhiv_connectors.py
├── data/                        # Runtime data directory
├── requirements.txt
└── .env.example

hackaverse-frontend/             # Frontend (React + Vite)
├── src/
│   ├── main.jsx                 # Entry point
│   ├── App.jsx                  # Router + layout
│   ├── constants/
│   │   ├── appConstants.js      # API URL, timeout
│   │   └── apiKey.js            # Centralized API key accessor
│   ├── contexts/                # React contexts (Auth, Sync, Theme)
│   ├── services/                # API clients (api.js, apiClient.js)
│   ├── components/
│   │   ├── admin/
│   │   ├── judge/
│   │   ├── participant/
│   │   ├── pages/
│   │   └── ui/
│   └── hooks/                   # Custom React hooks
├── public/
├── package.json
└── .env.example
```

---

## Conventions

### Backend

1. **Route handlers** go in `src/routes/` — one file per domain
2. **Routes must be registered** in `src/main.py` via `app.include_router()`
3. **Environment variables** are read via `os.getenv()` with explicit defaults
4. **Never hardcode secrets** — always use `.env`
5. **Use KSML logging** for auditable events:
   ```python
   ksml_logger.log_event(intent="...", actor="...", context={...}, outcome="...")
   ```
6. **Structured responses** — all endpoints return `{"success": bool, "data": ..., "message": ...}`

### Frontend

1. **API keys** must use `getApiKey()` from `constants/apiKey.js` — never hardcode
2. **API URLs** must use `API_BASE_URL` from `constants/appConstants.js`
3. **Auth tokens** use `localStorage.getItem('authToken')`
4. **Components** follow the pattern: `components/<role>/<ComponentName>.jsx`
5. **Service methods** go in `services/api.js` under the `apiService` object

### General

1. **Preserve existing comments** — do not strip docstrings or inline comments
2. **No silent retry logic** — if something fails, log it and propagate
3. **No speculative features** — only build what's explicitly requested
4. **No architecture changes** without explicit approval
5. **Keep `.env.example` updated** when adding new environment variables

---

## Adding a New API Route

```python
# 1. Create src/routes/my_feature.py
from fastapi import APIRouter

router = APIRouter(tags=["my-feature"])

@router.get("/my-feature/items")
async def get_items():
    return {"success": True, "data": []}

# 2. Register in src/main.py
from .routes.my_feature import router as my_feature_router
app.include_router(my_feature_router)
```

---

## Adding a New Frontend Page

1. Create component in appropriate `components/<role>/` directory
2. Add route in `App.jsx`
3. Use `getApiKey()` for API calls — never hardcode keys
4. Use `API_BASE_URL` for backend URLs — never hardcode localhost

---

## Pull Request Checklist

- [ ] `.env.example` updated if new env vars added
- [ ] No hardcoded secrets, API keys, or credentials
- [ ] Route registered in `main.py` (if backend route)
- [ ] Existing comments and docstrings preserved
- [ ] No architecture changes without approval
- [ ] Tested locally (backend health + frontend loads)
