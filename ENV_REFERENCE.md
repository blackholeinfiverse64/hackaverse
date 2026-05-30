# HackaVerse — Environment Variable Reference

> **Complete reference for every environment variable used across backend and frontend.**
> Last updated: 2026-05-11

---

## Backend Environment Variables

Located in: `hackathon/.env`

### Database

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MONGODB_URI` | **Yes** (for full mode) | *(none)* | MongoDB connection string. Without this, backend runs in degraded mode. Format: `mongodb+srv://<user>:<pass>@<cluster>/<db>?retryWrites=true&w=majority` |
| `BUCKET_DB_NAME` | No | `hackaverse_db` | Database name within the MongoDB cluster |

### AI / Judging

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GROQ_API_KEY` | **Yes** (for AI judging) | *(none)* | Groq API key. Without this, judging returns fallback score of 50/100 |
| `GROQ_MODEL` | No | `llama-3.1-8b-instant` | Groq model identifier |

### Application

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `AUTHOR_PASSWORD` | No | `author@123` | Admin author password. **MUST be changed in production** |
| `HACKATHON_NAME` | No | `HackaAIverse 2025` | Display name of the hackathon |
| `HACKATHON_THEME` | No | `AI for Real Life` | Hackathon theme string |
| `JUDGING_CRITERIA` | No | `usefulness,creativity,teamwork,tech_stack,clarity` | Comma-separated judging criteria |
| `MAX_SCORE_PER_CRITERIA` | No | `10` | Maximum score per criterion |
| `EVENT_DATE` | No | `2024-08-15` | Event date |
| `REGISTRATION_DEADLINE` | No | `2024-08-10` | Registration deadline |
| `SUBMISSION_DEADLINE` | No | `2024-08-15T18:00:00` | Submission deadline |

### Security

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `API_KEY` | Recommended | `default_key` | API key for X-API-Key header authentication. **MUST be set in production** |
| `SECURITY_SECRET_KEY` | No | `default_secret_for_dev` | HMAC secret for request signing. When set, enforces signature validation on `/workflows` endpoints |
| `ALLOWED_ORIGINS` | No | `*` | CORS allowed origins. **Set to specific domains in production** |

### BHIV Integration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `BHIV_CORE_URL` | No | `http://localhost:8002/reason` | BHIV Core reasoning endpoint. System degrades gracefully if unreachable |
| `BHIV_BUCKET_DIR` | No | `./data/bucket` | Local directory for bucket storage (audit logs) |

### Email (Not fully implemented)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SMTP_SERVER` | No | `smtp.gmail.com` | SMTP server address |
| `SMTP_PORT` | No | `587` | SMTP port |
| `EMAIL_USER` | No | *(none)* | SMTP username |
| `EMAIL_PASSWORD` | No | *(none)* | SMTP password / app password |

### Runtime

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `8000` | Server port. Render overrides this via `$PORT` |
| `ENV` | No | `development` | Environment flag: `development` or `production` |
| `DATABASE_TYPE` | No | `json` | Fallback storage type |
| `DATA_DIR` | No | `data` | Data directory for JSON fallback |

### Optional Services

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DISCORD_BOT_TOKEN` | No | *(none)* | Discord bot token (not implemented) |
| `FIREBASE_KEY` | No | *(none)* | Firebase service account key (not implemented) |

---

## Frontend Environment Variables

Located in: `hackaverse-frontend/.env`

> **All Vite environment variables MUST be prefixed with `VITE_`**

### API Connection

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_URL` | **Yes** | `http://localhost:8000` | **Primary** backend API URL. Takes precedence over `VITE_API_BASE_URL` |
| `VITE_API_BASE_URL` | No (legacy) | `http://localhost:8000` | Legacy alias. **Do NOT set both to different values** |
| `VITE_API_KEY` | Recommended | *(hardcoded fallback)* | API key matching backend's `API_KEY`. **MUST be set in production** |

### Application

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_APP_NAME` | No | `HackaVerse` | Application display name |
| `VITE_APP_VERSION` | No | `2.0.0` | Application version |
| `VITE_NODE_ENV` | No | `development` | Environment flag |

### Mock API

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_USE_MOCK_API` | No | `false` | Enable mock API for frontend-only dev |
| `VITE_MOCK_API_PORT` | No | `3002` | Mock API server port |

### PWA

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_PWA_ENABLED` | No | `true` | Enable PWA features |
| `VITE_PWA_THEME_COLOR` | No | `#00FFFF` | PWA theme color |
| `VITE_PWA_BACKGROUND_COLOR` | No | `#000000` | PWA background color |

### Feature Flags

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_FEATURE_ANIMATIONS` | No | `true` | Enable animations |
| `VITE_FEATURE_DARK_MODE` | No | `true` | Enable dark mode |
| `VITE_FEATURE_NOTIFICATIONS` | No | `true` | Enable notifications |

---

## Environment Variable Resolution

### Frontend API URL Resolution Order

The frontend resolves the backend API URL in this priority order:

```
1. VITE_API_URL           (preferred — set this)
2. VITE_API_BASE_URL      (legacy fallback)
3. "http://localhost:8000" (hardcoded default)
```

**Files that resolve this:**
- `src/constants/appConstants.js` — canonical resolution
- `src/services/apiClient.js` — secondary client (also resolves independently)

### API Key Resolution

**Backend:** `os.getenv("API_KEY", "default_key")`
**Frontend:** `import.meta.env.VITE_API_KEY || '<hardcoded_fallback>'`

> ⚠️ **WARNING:** The frontend currently has a hardcoded API key fallback in multiple files. This is a security anti-pattern documented in `SECURITY_CLEANUP_REPORT.md`.

---

## Startup Validation Expectations

On backend startup, the system validates:

1. **MONGODB_URI** → Must start with `mongodb://` or `mongodb+srv://`
2. **MONGODB_URI** → Attempts connection with 5-second timeout
3. **GROQ_API_KEY** → Checked lazily on first AI judging request
4. **PORT** → Defaults to 8000 if not set

**No hard failures on missing optional variables.** The system starts in degraded mode.
