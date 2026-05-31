# Database Verification & Migration Audit Report

**Date:** 2026-05-31  
**Audit type:** Pre–Stage 2 verification (read-only audit + connectivity/seed smoke tests)  
**Target cluster:** `cluster0.oeh93tq.mongodb.net`  
**Target database name:** `hackaverse_db`  

> **Security:** Database credentials were shared in chat during this audit. **Rotate the MongoDB user password and Groq API key immediately** in Atlas and all deployment dashboards. Do not commit `hackathon/.env` to git.

---

## Executive summary

| Check | Result |
|-------|--------|
| New Atlas cluster reachable | **PASS** |
| Application code uses env-based URI (no hardcoded URI in `src/`) | **PASS** |
| `hackaverse_db` is correct database name | **PASS** (when `BUCKET_DB_NAME=hackaverse_db`) |
| Database was empty before seed | **CONFIRMED** |
| Seed data applied successfully | **PASS** (during this audit) |
| Admin / judge / participant accounts | **PASS** (after seed) |
| Local `hackathon/.env` present | **FAIL** — not on disk; must be created |
| Render `BUCKET_DB_NAME` in `render.yaml` | **FAIL** — wrong value (see migration issues) |
| Legacy MongoDB URIs in documentation | **FAIL** — many files still reference old cluster |
| Frontend connects to MongoDB directly | **N/A** — correctly uses backend API only |

**Verdict:** The **new MongoDB Atlas database is operational** and can be the single source of truth **after** you (1) set `MONGODB_URI` + `BUCKET_DB_NAME=hackaverse_db` everywhere (Render, local `.env`), (2) run or re-run seed on that cluster, and (3) stop using the legacy cluster documented in old handover files.

**Do not proceed to Stage 2** until Render/Vercel env vars point at this cluster (not the legacy `cluster0.jrcmlaq.mongodb.net` URI).

---

## 1. MongoDB connection locations (codebase)

### Runtime (production path)

| Location | Mechanism | Notes |
|----------|-----------|--------|
| `hackathon/src/database.py` | `MongoClient(os.getenv("MONGODB_URI"))` + `client[os.getenv("BUCKET_DB_NAME", "hackaverse_db")]` | **Single connection module** for the API |
| `hackathon/src/main.py` | `connect_to_db()` on startup | All routes use `get_db()` |

### Scripts & tooling

| Location | Mechanism |
|----------|-----------|
| `hackathon/seed_data.py` | `MongoClient(MONGODB_URI)` + `BUCKET_DB_NAME` |
| `hackathon/scripts/verify_database.py` | Same env vars (audit script) |
| `hackathon/scripts/test_auth_roles.py` | Uses `connect_to_db()` via auth routes |

### Test / adapter defaults (no real URI)

| Location | Default |
|----------|---------|
| `hackathon/tests/conftest.py` | `MONGODB_URI=""` |
| `hackathon/scripts/_http_adapter.py` | `MONGODB_URI=""` |

### Not used

| Technology | Found? |
|------------|--------|
| `motor` / async MongoDB driver | **No** |
| `database_url` env var | **No** |
| Hardcoded `mongodb+srv://` in `hackathon/src/` | **No** |

### Direct collection access (bypass `COLLECTIONS` dict)

`judge_invitations.py` uses `db.judge_invitations` and `db.judges` attribute access — collection **names** still resolve to `judge_invitations` / `judges` (same as `COLLECTIONS`). Not a separate database.

---

## 2. Hardcoded / legacy MongoDB references

### Application source (`hackathon/src/`)

**No embedded connection strings.** Connection is env-driven only.

### Legacy cluster in documentation (not used by code, migration risk)

These files still contain the **old** Atlas URI (`cluster0.jrcmlaq.mongodb.net`, user `sejalfinal`). They do **not** affect runtime unless someone copies them into Render `.env`:

- `INDEX.md`, `FAQ.md`, `HANDOVER_SUMMARY.md`, `SYSTEM_HANDOVER.md`
- `REVIEW_PACKET.md`, `COMPLETION_REPORT.txt`
- `Hackaverse/*` duplicates
- `CREDENTIAL_ROTATION_GUIDE.md`, `SECURITY_CLEANUP_REPORT.md`

**Action:** Treat as documentation debt; update or redact after migration.

### Render config mismatch (critical)

```yaml
# hackathon/render.yaml (line 28-29)
BUCKET_DB_NAME: "blackholeinifverse60_db_user"
```

This value looks like a **username**, not a database name. The app will connect to MongoDB using the URI, then select database `blackholeinifverse60_db_user` instead of `hackaverse_db`.

**Required fix:** Set `BUCKET_DB_NAME=hackaverse_db` on Render (and in `render.yaml`).

### Local environment

| File | Status |
|------|--------|
| `hackathon/.env` | **Missing** (not present during audit) |
| `hackathon/.env.example` | Template only; `MONGODB_URI=` empty |

---

## 3. Startup & health check verification

Tested with:

- `MONGODB_URI` → new cluster (`cluster0.oeh93tq.mongodb.net`)
- `BUCKET_DB_NAME=hackaverse_db`

| Test | Result |
|------|--------|
| `MongoClient` + `admin.command("ping")` | **PASS** |
| `connect_to_db()` from `database.py` | **PASS** — `connected: True`, `database: hackaverse_db` |
| Indexes created on startup | **PASS** (non-fatal warnings allowed) |

Health endpoints (when server runs):

- `GET /system/ready` — readiness
- `GET /system/health` or `/system/db-status` — DB status via `get_db_status()`

---

## 4. Collections verification

### After seed (current state on new cluster)

| Collection | Exists | Document count | Required for platform |
|------------|--------|----------------|------------------------|
| `users` | Yes | 3 | Yes |
| `judges` | Yes | 1 | Yes (judge APIs) |
| `hackathons` | Yes | 1 | Yes |
| `teams` | Yes | 1 | Yes |
| `user_teams` | Yes | 1 | Yes |
| `submissions` | Yes | 1 | Yes |
| `sessions` | Yes | 0 | Yes (created on login) |
| `notifications` | Yes | 0 | Yes |
| `webhooks` | Yes | 0 | Optional |
| `provenance_logs` | Yes | 0 | Optional |

### Not yet created (created on first use)

| Collection | Status |
|------------|--------|
| `judge_invitations` | Missing until first admin invite |
| `judge_assignments` | Missing until assignments used |
| `judgments` | Missing until AI/manual judging writes |
| `invitations` | Missing until team invites |
| `announcements` | Missing until admin announcement |
| `activities` | Missing until activity logger writes |
| `rewards` | Missing until reward endpoints used |
| `files` | Missing until uploads |
| `hackathon_participants` | Missing until join flow |
| `team_members` | Missing until member CRUD |

This is **normal** for MongoDB (collections appear on first insert).

### Defined in `COLLECTIONS` (`db_models.py`)

`users`, `sessions`, `hackathons`, `teams`, `invitations`, `submissions`, `judgments`, `hackathon_participants`, `user_teams`, `notifications`, `announcements`, `activities`, `team_members`, `files`, `provenance_logs`, `rewards`, `webhooks`, `judges`, `judge_invitations`, `judge_assignments`

---

## 5. `seed_data.py` verification

| Question | Answer |
|----------|--------|
| Which database? | `os.getenv("BUCKET_DB_NAME", "hackaverse_db")` on client from `MONGODB_URI` |
| Which URI? | `hackathon/.env` if present; otherwise shell env |
| Admin exists? | **Yes** — `admin@hackaverse.com`, `role=admin`, `user_id=user_admin_001` |
| Judge exists? | **Yes** — `judge@hackaverse.com`, `role=judge`, `user_id=user_judge_001` |
| Participant exists? | **Yes** — `participant@hackaverse.com`, `role=participant` |
| Judges collection row? | **Yes** — `user_id=user_judge_001` matches `users` |
| Password hashing | **bcrypt** (compatible with `auth_routes.verify_password`) |

**Pre-seed state (new cluster):** 0 users, empty platform data.  
**Post-seed state:** 3 users, 1 hackathon, 1 team, 1 submission, 1 judge profile.

---

## 6. Admin role verification

| Check | Status |
|-------|--------|
| Account exists | **PASS** — `admin@hackaverse.com` |
| `role` field | **PASS** — `admin` |
| `user_id` | `user_admin_001` |
| Password `admin@123` | **PASS** (bcrypt verify) |
| Login via API | Expected **PASS** when backend uses same `MONGODB_URI` |

---

## 7. Judge role verification

| Check | Status |
|-------|--------|
| User account exists | **PASS** — `judge@hackaverse.com`, `role=judge` |
| `judges` collection entry | **PASS** |
| `user_id` mapping | **PASS** — `user_judge_001` in both collections |
| Password `judge@123` | **PASS** |
| `require_judge()` / judge review APIs | Ready (P0 code uses `judges` + helper) |

---

## 8. Participant role verification

| Check | Status |
|-------|--------|
| Account exists | **PASS** — `participant@hackaverse.com` |
| `role` | **PASS** — `participant` |
| Team linkage | **PASS** — `user_teams` + `teams` seeded |
| Password `participant@123` | **PASS** |

---

## 9. Frontend → backend → MongoDB trace

```
Browser (React)
  └─ VITE_API_URL / VITE_API_BASE_URL  →  HTTP only (no MongoDB driver)
       └─ hackaverse-frontend/src/services/api.js
            └─ POST /auth/login, GET /teams, etc.
                 └─ FastAPI (hackathon/src/main.py)
                      └─ get_db() → hackathon/src/database.py
                           └─ MongoClient(MONGODB_URI)[BUCKET_DB_NAME]
                                └─ MongoDB Atlas (hackaverse_db)
```

| Layer | Uses MongoDB? | Config |
|-------|---------------|--------|
| Frontend | **No** | `VITE_API_URL` → backend URL only |
| Backend | **Yes** | `MONGODB_URI`, `BUCKET_DB_NAME` |
| Render production | **Yes** | Dashboard secrets (must match new cluster) |

**Single source of truth:** MongoDB selected by backend env. Frontend cannot point at a different database unless it calls a different backend URL.

---

## Data integrity issues

| Issue | Severity | Details |
|-------|----------|---------|
| Empty DB before seed | High (resolved) | New cluster had 0 users; platform unusable for admin/judge until seed |
| Legacy data not migrated | High | No automatic migration from old `jrcmlaq` cluster; only fresh seed run |
| `render.yaml` wrong `BUCKET_DB_NAME` | **Critical** | Would use wrong database name if deployed as-is |
| Docs contain old credentials | High (security) | Committed example URIs in multiple markdown files |
| `users` count in admin dashboard | Low | `admin.py` counts all users as “participants” in KPI label |

---

## Migration issues

| # | Issue | Required action |
|---|--------|-----------------|
| M1 | Render may still have **old** `MONGODB_URI` | Set to new `cluster0.oeh93tq.mongodb.net` URI in Render dashboard |
| M2 | `BUCKET_DB_NAME` on Render = `blackholeinifverse60_db_user` | Change to **`hackaverse_db`** |
| M3 | No local `hackathon/.env` | Create from `.env.example` with new URI (gitignored) |
| M4 | Vercel `VITE_API_URL` must hit backend that uses new URI | Verify Render env after M1 |
| M5 | Data on old cluster not copied | If old data needed: `mongodump` / `mongorestore`; else re-seed |
| M6 | GROQ key spacing | User message had `GROQ_API_KEY= gsk_...` (space after `=`); fix in `.env` |

---

## Deployment risks

| Risk | Impact |
|------|--------|
| Render uses old `MONGODB_URI` | Production still on legacy cluster; new DB unused |
| Wrong `BUCKET_DB_NAME` on Render | Connected to wrong/empty database |
| Seed not run on production DB | No admin/judge login in production |
| Secrets in git history / docs | Credential leak |
| Free-tier Render cold start | Timeouts if `API_TIMEOUT` too low |
| No `.env` in CI | Tests run degraded (empty `MONGODB_URI`) — expected |

---

## Required fixes (before Stage 2)

### P0 — Must do

1. **Create `hackathon/.env`** (never commit):
   ```env
   MONGODB_URI=<your-new-atlas-uri>
   BUCKET_DB_NAME=hackaverse_db
   GROQ_API_KEY=<no-space-after-equals>
   API_KEY=<match-frontend-VITE_API_KEY>
   JWT_SECRET=<strong-random-secret>
   ```

2. **Update Render environment variables:**
   - `MONGODB_URI` → new cluster URI
   - `BUCKET_DB_NAME` → `hackaverse_db`
   - `GROQ_API_KEY` → valid key

3. **Fix `hackathon/render.yaml`:**
   - Change `BUCKET_DB_NAME` from `blackholeinifverse60_db_user` to `hackaverse_db`

4. **Run seed on the database Render uses:**
   ```bash
   cd hackathon
   python seed_data.py
   ```
   (Or run once against production URI from a secure machine.)

5. **Rotate credentials** exposed in chat and old documentation.

### P1 — Should do

6. Redact/update legacy URIs in `INDEX.md`, `FAQ.md`, `HANDOVER_SUMMARY.md`, etc.  
7. Re-deploy backend after env change; verify `GET /system/db-status` shows `hackaverse_db` connected.  
8. Log in on production: admin, judge, participant test accounts (then change passwords).

### P2 — Optional

9. Remove unused `mongodb` pserv from `render.yaml` if using Atlas only.  
10. Add `judge_invitations` to seed smoke checklist after first admin invite.

---

## Verification commands (repeatable)

```bash
cd hackathon
# Set MONGODB_URI and BUCKET_DB_NAME in environment or .env
python scripts/verify_database.py
python seed_data.py   # only if users missing
```

Expected after seed:

- `users: 3`
- `judges: 1`
- All three default password checks: **PASS**

---

## Audit scripts added (for ops, not Stage 2 features)

| Script | Purpose |
|--------|---------|
| `hackathon/scripts/verify_database.py` | Connection, collections, roles, passwords |
| `hackathon/scripts/test_auth_roles.py` | Login smoke test (requires mock request headers for rate limiter) |

---

## Conclusion

The **new MongoDB Atlas database (`hackaverse_db` on `cluster0.oeh93tq.mongodb.net`) is connected, seeded, and structurally ready** for HackaVerse when `BUCKET_DB_NAME=hackaverse_db`.

It is **not yet proven as the production single source of truth** until:

1. Render/Vercel environment variables are updated away from any legacy URI, and  
2. `BUCKET_DB_NAME` is corrected on Render, and  
3. Seed (or data migration) is confirmed on the same cluster the live API uses.

**Recommendation:** Complete P0 fixes above, then re-run `verify_database.py` against the **Render** environment (via `/system/db-status` + login tests) before Stage 2 implementation.

---

*End of database verification report.*
