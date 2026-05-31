# HackaVerse — Role Activation (Production)

This document describes how users obtain **admin**, **judge**, and **participant** roles after the P0 fixes.

## Participant (default)

- **How:** Sign up or register via the public landing page (`/`).
- **Backend:** `POST /auth/register` always sets `role: participant` (intentional security control).
- **Redirect after login:** `/app`

## Admin

- **How:** Pre-seeded account in MongoDB — **not** available via self-registration.
- **Setup (required once per environment):**

```bash
cd hackathon
# Ensure MONGODB_URI and BUCKET_DB_NAME match your deployment database
python seed_data.py
```

- **Default seeded credentials (change passwords after first login in production):**

| Email | Password | Role |
|-------|----------|------|
| admin@hackaverse.com | admin@123 | admin |

- **Redirect after login:** `/admin`

## Judge

### Option A — Seeded judge (fastest for QA / staging)

Run `seed_data.py` as above.

| Email | Password | Role |
|-------|----------|------|
| judge@hackaverse.com | judge@123 | judge |

- **Redirect after login:** `/judge`

### Option B — Admin invitation flow (production)

1. Log in as **admin**.
2. Open **Admin → Settings** (or Admin Home) → **Invite Judge**.
3. Enter judge email → backend sends invitation (`POST /judge/invitations/send`).
4. Judge opens link: `/judge/accept?token=...`
5. Judge enters **name + password** → account created with `role: judge`, JWT issued, redirected to `/judge`.

## Security model (unchanged)

- Self-registration cannot elevate to admin or judge.
- Admin/judge access requires either **database seeding** or **admin-sent judge invitation**.
- Frontend `ProtectedRoute` enforces role per route prefix.

## Production checklist

- [ ] Run `python hackathon/seed_data.py` against **production** MongoDB (or create admin/judge users manually with bcrypt `password_hash` and matching `judges` record for judges).
- [ ] Rotate default passwords from seed script.
- [ ] Set `VITE_API_URL` and `VITE_API_KEY` on Vercel to match Render backend.
- [ ] Verify login: admin → `/admin`, judge → `/judge`, participant → `/app`.
