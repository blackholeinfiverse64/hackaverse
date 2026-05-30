# HackaVerse — Security Cleanup Report

> **Audit of security anti-patterns, credential exposure, and remediation recommendations.**
> Audit date: 2026-05-11 | Severity scale: CRITICAL / HIGH / MEDIUM / LOW

---

## Executive Summary

This report identifies **12 security issues** across the HackaVerse codebase, ranging from hardcoded credentials in tracked documentation to weak cryptographic practices. The most critical findings involve plaintext database credentials committed to version control in 7+ documentation files.

| Severity | Count | Status |
|----------|-------|--------|
| CRITICAL | 3 | Requires immediate remediation |
| HIGH | 4 | Requires remediation before production |
| MEDIUM | 3 | Should be addressed in next sprint |
| LOW | 2 | Acceptable for MVP, track for future |

---

## Findings

### SEC-001: Plaintext MongoDB Credentials in Version-Controlled Documentation

| Field | Value |
|-------|-------|
| **Severity** | 🔴 CRITICAL |
| **Affected Files** | `REVIEW_PACKET.md`, `HANDOVER_SUMMARY.md`, `INDEX.md`, `FAQ.md`, `COMPLETION_REPORT.txt`, `SYSTEM_HANDOVER.md` |
| **Issue** | Full MongoDB connection string with username and password (`mongodb+srv://sejalfinal:Sejal%40123@cluster0...`) is committed to 7+ files in version control |
| **Impact** | Anyone with repo access can read/write/delete the entire database. Credentials persist in git history even after removal |
| **Remediation** | 1. Rotate MongoDB credentials immediately 2. Remove credentials from all .md/.txt files 3. Reference credentials only via `.env` 4. Update MongoDB Atlas IP whitelist 5. Consider `git filter-branch` or BFG to purge from history |
| **Convergence Risk** | **EXTREME** — leaking database credentials into any integration or ecosystem partner is an unrecoverable trust violation |

---

### SEC-002: Hardcoded API Key in Frontend Source Code

| Field | Value |
|-------|-------|
| **Severity** | 🔴 CRITICAL |
| **Affected Files** | `hackaverse-frontend/src/services/api.js:21`, `apiClient.js:4`, `notificationService.js:6`, `SyncContext.jsx:27`, `ParticipantHome.jsx:31,50`, `JoinHackathonModal.jsx:50`, `CreateTeamModal.jsx:23`, `ProjectSubmissionForm.jsx:96`, `JudgeHome.jsx:32,51`, `AdminSubmissions.jsx:30`, `HackathonManagement.jsx:37,75,121,138,175` |
| **Issue** | API key `2b899caf7e3aea924c96761326bdded5162da31a9d1fdba59a2a451d2335c778` is hardcoded as a fallback in 15+ locations across frontend source. Also embedded in production `dist/` bundle |
| **Impact** | Key is visible in browser DevTools, git history, and built bundles. Any user can extract and reuse it |
| **Remediation** | 1. Replace all hardcoded instances with `import.meta.env.VITE_API_KEY` 2. Remove fallback hardcoded values 3. Ensure VITE_API_KEY is set in Vercel environment variables 4. Rotate the exposed API key 5. Rebuild and redeploy frontend |
| **Convergence Risk** | **HIGH** — hardcoded keys in client bundles cannot be trusted for any integration boundary |

---

### SEC-003: Production API Key in render.yaml

| Field | Value |
|-------|-------|
| **Severity** | 🔴 CRITICAL |
| **Affected Files** | `hackathon/render.yaml:16` |
| **Issue** | `API_KEY: "production_secret_key_2024"` is hardcoded in plain text in the deployment manifest committed to version control |
| **Impact** | Production API key exposed to all repo viewers |
| **Remediation** | 1. Remove hardcoded value from render.yaml 2. Set API_KEY as a Render environment variable (via dashboard) 3. Rotate the exposed key 4. Use `fromService` or dashboard-only secrets |
| **Convergence Risk** | **HIGH** — deployment manifests must never contain secrets |

---

### SEC-004: SHA-256 Password Hashing Without Salt

| Field | Value |
|-------|-------|
| **Severity** | 🟠 HIGH |
| **Affected Files** | `hackathon/src/routes/auth_routes.py:48-54` |
| **Issue** | Passwords are hashed using `hashlib.sha256(password.encode()).hexdigest()` — no salt, no key stretching |
| **Impact** | Vulnerable to rainbow table attacks. All users with the same password have identical hashes |
| **Remediation** | Replace with `bcrypt` or `argon2`: `pip install bcrypt` → `bcrypt.hashpw(password.encode(), bcrypt.gensalt())` |
| **Convergence Risk** | **MEDIUM** — weak auth undermines any trust chain |

---

### SEC-005: Non-Cryptographic JWT Implementation

| Field | Value |
|-------|-------|
| **Severity** | 🟠 HIGH |
| **Affected Files** | `hackathon/src/routes/auth_routes.py:60-81` |
| **Issue** | JWT tokens are created with a random string as signature instead of HMAC. The `create_jwt_token()` function uses `secrets.token_urlsafe(16)` as the signature — there is no verification of token integrity |
| **Impact** | Tokens cannot be validated server-side. Any base64-encoded payload with a valid `user_id` field will be accepted by `get_current_user_id()` |
| **Remediation** | Use `python-jose` or `PyJWT`: `pip install python-jose` → proper HMAC-SHA256 signing with a secret key |
| **Convergence Risk** | **HIGH** — unauthenticated access is possible if token format is known |

---

### SEC-006: Default Weak Passwords in Configuration

| Field | Value |
|-------|-------|
| **Severity** | 🟠 HIGH |
| **Affected Files** | `hackathon/src/core/config.py:23`, `hackathon/.env.example` (original) |
| **Issue** | `AUTHOR_PASSWORD` defaults to `author@123` — a trivially guessable credential |
| **Impact** | Admin/author operations accessible with default password if not changed |
| **Remediation** | Remove default value; require explicit setting. Validate password complexity |
| **Convergence Risk** | **MEDIUM** — default credentials are a common audit failure point |

---

### SEC-007: CORS Wildcard in Production

| Field | Value |
|-------|-------|
| **Severity** | 🟠 HIGH |
| **Affected Files** | `hackathon/src/main.py:71`, `hackathon/render.yaml:20` |
| **Issue** | `allow_origins=["*"]` is set in both development and production configurations |
| **Impact** | Any website can make authenticated API requests to the backend. Combined with cookie-based auth or embedded API keys, this enables CSRF-like attacks |
| **Remediation** | Set `ALLOWED_ORIGINS` to specific domains: `https://hackaverse-mu.vercel.app` in production |
| **Convergence Risk** | **HIGH** — wildcard CORS is incompatible with secure ecosystem integration |

---

### SEC-008: Corrupted .gitignore File

| Field | Value |
|-------|-------|
| **Severity** | 🟡 MEDIUM |
| **Affected Files** | `hackathon/.gitignore` |
| **Issue** | File contained null bytes (UTF-16 BOM corruption). Lines 4–17 were encoded with alternating null bytes, making them invisible to Git. Only `.env`, `__pycache__/`, and `*.pyc` were actually being ignored |
| **Impact** | `secrets.toml`, `*.log`, `data/bucket/`, `coverage.xml`, and other sensitive files were NOT being ignored by Git |
| **Remediation** | ✅ **FIXED** in this sprint — rewritten as clean UTF-8 |
| **Convergence Risk** | **LOW** (now fixed) — sensitive files may exist in git history |

---

### SEC-009: Insecure Default Security Secret

| Field | Value |
|-------|-------|
| **Severity** | 🟡 MEDIUM |
| **Affected Files** | `hackathon/src/security.py:39` |
| **Issue** | `SECURITY_SECRET_KEY` defaults to `"default_secret_for_dev"` — HMAC signatures can be forged |
| **Impact** | If `SECURITY_SECRET_KEY` is not explicitly set, request signatures can be trivially reproduced |
| **Remediation** | Remove default value. Require explicit setting in production. Fail startup if not set when `ENV=production` |
| **Convergence Risk** | **MEDIUM** — signature verification is meaningless with a known key |

---

### SEC-010: API Key Defaults to "default_key"

| Field | Value |
|-------|-------|
| **Severity** | 🟡 MEDIUM |
| **Affected Files** | `hackathon/src/security.py:203`, `hackathon/src/auth.py:53` |
| **Issue** | `API_KEY` defaults to `"default_key"` when not set. This key is mapped to `admin` role in `API_KEY_ROLES` |
| **Impact** | Without setting API_KEY, the string `"default_key"` grants admin access to all API endpoints |
| **Remediation** | Remove default. Reject requests with missing/unset API_KEY. Log warnings on startup |
| **Convergence Risk** | **HIGH** — default admin keys are a critical integration vulnerability |

---

### SEC-011: Placeholder OpenAI Key in render.yaml

| Field | Value |
|-------|-------|
| **Severity** | 🟢 LOW |
| **Affected Files** | `hackathon/render.yaml:18` |
| **Issue** | `OPENAI_API_KEY: "sk-placeholder-openai-key"` committed to version control |
| **Impact** | No immediate risk (placeholder), but establishes a pattern of committing API keys to manifests |
| **Remediation** | Remove from render.yaml. Set via Render dashboard only |
| **Convergence Risk** | **LOW** — pattern risk only |

---

### SEC-012: Frontend .gitignore Missing dist/ and Build Artifacts

| Field | Value |
|-------|-------|
| **Severity** | 🟢 LOW |
| **Affected Files** | `hackaverse-frontend/.gitignore` |
| **Issue** | `dist/` directory is not in .gitignore. Built bundles (with embedded API keys) may be committed |
| **Impact** | Built JavaScript files in `dist/` contain embedded environment variables and API keys |
| **Remediation** | Add `dist/` to `.gitignore`. Remove existing `dist/` from tracking: `git rm -r --cached dist/` |
| **Convergence Risk** | **LOW** — but builds should never be in version control |

---

## Remediation Priority Matrix

| Priority | Issue | Effort | Impact |
|----------|-------|--------|--------|
| 1 | SEC-001: Rotate MongoDB credentials | 30 min | Eliminates DB exposure |
| 2 | SEC-002: Remove hardcoded frontend API keys | 1 hour | Eliminates key exposure |
| 3 | SEC-003: Remove key from render.yaml | 15 min | Secures deployment |
| 4 | SEC-007: Fix CORS wildcard | 15 min | Closes CSRF vector |
| 5 | SEC-010: Remove default API key | 30 min | Closes admin access |
| 6 | SEC-005: Fix JWT implementation | 2 hours | Proper auth verification |
| 7 | SEC-004: Fix password hashing | 1 hour | Rainbow table protection |
| 8 | SEC-006: Remove default passwords | 30 min | Closes admin access |
| 9 | SEC-009: Fix security secret | 15 min | Meaningful signatures |
| 10 | SEC-008: .gitignore (FIXED) | ✅ Done | N/A |
| 11 | SEC-011: Remove placeholder key | 5 min | Pattern cleanup |
| 12 | SEC-012: Add dist/ to gitignore | 5 min | Build hygiene |
