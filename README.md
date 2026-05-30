# HackaVerse — Beginner Setup Guide

This guide is written in **simple language**. You do not need to be an expert.  
Follow each step in order.

---

## What is this project?

HackaVerse is a **hackathon website** with two parts:

| Part | Folder name | What it does | Opens in browser at |
|------|-------------|--------------|---------------------|
| **Frontend** (what you see) | `hackaverse-frontend` | Buttons, pages, login screen | http://localhost:3000 |
| **Backend** (the brain / API) | `hackathon` | Saves data, login, teams, judging | http://localhost:8000 |

You must run **both** on your computer.  
The frontend talks to the backend. The backend talks to **MongoDB** (online database).

---

## What you need on your computer (before you start)

Install these once:

| Software | Why you need it | How to check if installed |
|----------|-----------------|---------------------------|
| **Python** 3.10 or newer | Runs the backend | Open terminal, type: `python --version` |
| **Node.js** 18 or newer | Runs the frontend | Type: `node --version` |
| **npm** | Installs frontend packages (comes with Node) | Type: `npm --version` |
| **Git** | To download the project | Type: `git --version` |

**Download links (if missing):**

- Python: https://www.python.org/downloads/ (check “Add Python to PATH” during install on Windows)
- Node.js: https://nodejs.org/ (choose LTS version)

You also need a **free MongoDB Atlas account** (online database).  
We explain that below — step by step.

---

## Project folder structure (where things live)

After you open the project on your PC, you will see something like this:

```
hackaverse_tantraphase1/          ← main project folder (open this in VS Code / Cursor)
│
├── hackathon/                    ← BACKEND lives here
│   ├── .env                      ← YOU CREATE THIS (secrets for backend)
│   ├── .env.example              ← copy this to make .env
│   ├── requirements.txt          ← list of Python packages
│   └── src/                      ← backend code
│
├── hackaverse-frontend/          ← FRONTEND lives here
│   ├── .env                      ← YOU CREATE THIS (settings for frontend)
│   ├── .env.example              ← copy this to make .env
│   ├── package.json              ← list of Node packages
│   └── src/                      ← website code
│
└── README.md                     ← this file
```

---

## Important: two `.env` files (read this carefully)

A **`.env` file** is a small text file that stores **passwords and URLs**.  
It is **not shared on GitHub** (for safety).

You need **two different `.env` files** in **two different folders**:

| File location | Who uses it |
|---------------|-------------|
| `hackathon/.env` | Backend only |
| `hackaverse-frontend/.env` | Frontend only |

**Never put your MongoDB password in the frontend `.env`.**  
MongoDB URL goes **only** in `hackathon/.env`.

---

## Step A — Get MongoDB URL (database link)

The backend stores users, teams, and submissions in **MongoDB Atlas** (cloud database).

### A1. Create free account

1. Go to https://cloud.mongodb.com  
2. Sign up (free tier is enough)  
3. Create a **free cluster** (click through the setup — default options are fine)

### A2. Create a database user

1. In Atlas, go to **Database Access** → **Add New Database User**  
2. Choose a **username** and **password** (save the password somewhere safe)  
3. Give the user permission: **Read and write to any database**

### A3. Allow your computer to connect

1. Go to **Network Access** → **Add IP Address**  
2. For learning at home, click **“Allow Access from Anywhere”** (`0.0.0.0/0`)  
   - For real production later, use only your real IP

### A4. Copy the connection string

1. Go to **Database** → your cluster → **Connect**  
2. Choose **Drivers**  
3. Copy the string. It looks like:

```
mongodb+srv://myuser:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

4. Replace `<password>` with your real database user password (no angle brackets)

**This full string is your `MONGODB_URI`.**  
You will paste it in `hackathon/.env` in the next section.

---

## Step B — Create backend `.env` file

### B1. Go to backend folder

**Windows (PowerShell or Command Prompt):**

```powershell
cd path\to\hackaverse_tantraphase1\hackathon
```

**Mac / Linux:**

```bash
cd path/to/hackaverse_tantraphase1/hackathon
```

Replace `path\to\...` with where you saved the project on your disk.

### B2. Copy the example file

**Windows:**

```powershell
copy .env.example .env
```

**Mac / Linux:**

```bash
cp .env.example .env
```

Now you have a file named `.env` inside the `hackathon` folder.

### B3. Open `hackathon/.env` in Notepad / VS Code / Cursor

Fill in at least these lines (remove empty values):

```env
# --- DATABASE (required for login, teams, etc.) ---
MONGODB_URI=mongodb+srv://YOUR_USER:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/?retryWrites=true&w=majority
BUCKET_DB_NAME=hackaverse_db

# --- SECURITY (required) ---
# Use the SAME random text for API_KEY on backend AND VITE_API_KEY on frontend
API_KEY=my-secret-api-key-12345
JWT_SECRET=my-jwt-secret-change-this-to-random-text

# --- APP SETTINGS ---
ENV=development
PORT=8000

# --- OPTIONAL: AI judging (if you have a Groq account) ---
# GROQ_API_KEY=your_groq_key_here
```

**Where to put MongoDB URL:**  
Only in this file → variable name **`MONGODB_URI`** → one line, no spaces around `=`.

**Tip — make a random API key (Windows):**

```powershell
python -c "import secrets; print(secrets.token_hex(32))"
```

Copy the output and use it as `API_KEY` and later as `VITE_API_KEY`.

Save the file.

---

## Step C — Create frontend `.env` file

### C1. Go to frontend folder

**Windows:**

```powershell
cd path\to\hackaverse_tantraphase1\hackaverse-frontend
```

**Mac / Linux:**

```bash
cd path/to/hackaverse_tantraphase1/hackaverse-frontend
```

### C2. Copy the example file

**Windows:**

```powershell
copy .env.example .env
```

**Mac / Linux:**

```bash
cp .env.example .env
```

### C3. Open `hackaverse-frontend/.env` and edit

```env
VITE_API_URL=http://localhost:8000
VITE_API_KEY=my-secret-api-key-12345
```

**Rules:**

- `VITE_API_URL` = where your backend runs (on your PC: `http://localhost:8000`)  
- `VITE_API_KEY` = **must be exactly the same** as `API_KEY` in `hackathon/.env`  
- Do **not** add `/api/v1` at the end — the app adds that automatically  

Save the file.

**After you change any `.env` file, restart the servers** (close terminal and start again).

---

## Step D — Install backend (first time only)

Open a terminal. Go to `hackathon` folder.

### D1. Create a virtual environment (keeps packages separate)

**Windows:**

```powershell
cd hackathon
python -m venv venv
.\venv\Scripts\activate
```

You should see `(venv)` at the start of your terminal line.

**Mac / Linux:**

```bash
cd hackathon
python3 -m venv venv
source venv/bin/activate
```

### D2. Install Python packages

```powershell
pip install -r requirements.txt
```

Wait until it finishes (may take a few minutes).

---

## Step E — Install frontend (first time only)

Open a **new** terminal (keep backend terminal closed for now, or use this as your first setup terminal).

**Windows / Mac / Linux:**

```powershell
cd hackaverse-frontend
npm install
```

Wait until it finishes.

---

## Step F — Run the project (every time you work)

You need **two terminal windows** open at the same time.

```
Terminal 1  →  Backend   (port 8000)
Terminal 2  →  Frontend  (port 3000)
```

**Always start backend first, then frontend.**

---

### Terminal 1 — Start backend

**Windows:**

```powershell
cd hackathon
.\venv\Scripts\activate
python -m uvicorn src.main:app --reload --host 127.0.0.1 --port 8000
```

**Mac / Linux:**

```bash
cd hackathon
source venv/bin/activate
python -m uvicorn src.main:app --reload --host 127.0.0.1 --port 8000
```

**Leave this terminal open.** Do not close it while you use the app.

#### How to know backend is OK

Look for these lines:

```
[DB] MongoDB Connected! Database: hackaverse_db
[SUCCESS] Backend Ready! Database: Connected | Docs: /docs
Uvicorn running on http://127.0.0.1:8000
```

Open in browser:

- API documentation: http://localhost:8000/docs  
- Health check: http://localhost:8000/health  

If you see **“Degraded Mode — Database NOT Connected”**:

- Check `MONGODB_URI` in `hackathon/.env`  
- Check password in the URL (no `<` or `>` characters)  
- Check Network Access in MongoDB Atlas  

---

### Terminal 2 — Start frontend

**Windows / Mac / Linux:**

```powershell
cd hackaverse-frontend
npm run dev
```

**Leave this terminal open too.**

#### How to know frontend is OK

You should see:

```
VITE ready
➜  Local:   http://localhost:3000/
```

Open in browser: **http://localhost:3000**

You should see the HackaVerse website. Try register / login.

---

## Quick checklist (am I running correctly?)

| # | Check | What you should see |
|---|--------|---------------------|
| 1 | Backend terminal | No crash; “Uvicorn running on http://127.0.0.1:8000” |
| 2 | http://localhost:8000/docs | Swagger API page loads |
| 3 | Frontend terminal | “Local: http://localhost:3000/” |
| 4 | http://localhost:3000 | Website loads |
| 5 | Same API key | `API_KEY` (backend) = `VITE_API_KEY` (frontend) |
| 6 | MongoDB | Backend log says “MongoDB Connected” |

If all 6 are good → **your project is running completely on your device.**

---

## Common problems (simple fixes)

### “Invalid API Key” or 401 error in browser

- Open `hackathon/.env` → copy `API_KEY` value  
- Open `hackaverse-frontend/.env` → paste same value into `VITE_API_KEY`  
- Restart **both** terminals  

### “Database unavailable” or cannot register / login

- `MONGODB_URI` is missing or wrong in `hackathon/.env`  
- Fix the URL, save file, restart backend  

### Website opens but nothing loads / network errors

- Backend must be running **before** you use the website  
- Check `VITE_API_URL=http://localhost:8000` in frontend `.env`  

### “Port 8000 already in use”

- Another program is using port 8000  
- Close old backend terminal, or restart your PC  
- Or run on another port: `--port 8001` and set `VITE_API_URL=http://localhost:8001`  

### “Port 3000 already in use”

```powershell
cd hackaverse-frontend
npm run dev:3001
```

Then open http://localhost:3001  

### Changed `.env` but nothing changed

- You **must restart** backend and frontend after editing `.env`  
- Stop with `Ctrl + C` in each terminal, then run the start commands again  

### `python` command not found (Windows)

- Reinstall Python and tick **“Add Python to PATH”**  
- Or try `py` instead of `python`  

### `npm` command not found

- Install Node.js from https://nodejs.org/ and restart terminal  

---

## All commands in one place

### Backend (`hackathon` folder)

| When | Command |
|------|---------|
| First time setup | `python -m venv venv` then activate venv, then `pip install -r requirements.txt` |
| Every day — start server | `python -m uvicorn src.main:app --reload --host 127.0.0.1 --port 8000` |
| Run tests | `python -m pytest tests/ -v` |
| Stop server | Press `Ctrl + C` in backend terminal |

### Frontend (`hackaverse-frontend` folder)

| When | Command |
|------|---------|
| First time setup | `npm install` |
| Every day — start website | `npm run dev` |
| Build for production | `npm run build` |
| Run tests | `npm test` |
| Stop server | Press `Ctrl + C` in frontend terminal |

---

## What each important setting means (simple)

| Name | File | Meaning in plain English |
|------|------|---------------------------|
| `MONGODB_URI` | `hackathon/.env` | Address + password for your online database |
| `BUCKET_DB_NAME` | `hackathon/.env` | Name of the database (default: `hackaverse_db`) |
| `API_KEY` | `hackathon/.env` | Secret password the frontend sends to the backend |
| `JWT_SECRET` | `hackathon/.env` | Secret used when users log in |
| `VITE_API_URL` | `hackaverse-frontend/.env` | Where the website finds the backend |
| `VITE_API_KEY` | `hackaverse-frontend/.env` | Same secret as `API_KEY` |
| `GROQ_API_KEY` | `hackathon/.env` | Optional — for AI judging features |
| `ENV` | `hackathon/.env` | `development` on your PC, `production` on live server |

---

## Optional: run tests to confirm code is healthy

**Backend** (backend terminal, venv activated):

```powershell
cd hackathon
python -m pytest tests/ -v
```

**Frontend:**

```powershell
cd hackaverse-frontend
npm test
```

---

## Where to get more help

| Document | What it is |
|----------|------------|
| [DEVELOPMENT.md](./DEVELOPMENT.md) | Longer technical guide |
| [ENV_REFERENCE.md](./ENV_REFERENCE.md) | Every environment variable explained |
| `hackathon/.env.example` | Template for backend settings |
| `hackaverse-frontend/.env.example` | Template for frontend settings |

---

## Summary (3 sentences)

1. Put **MongoDB URL** and **API_KEY** in `hackathon/.env`.  
2. Put **same API_KEY** and **http://localhost:8000** in `hackaverse-frontend/.env`.  
3. Run **backend** in one terminal, **frontend** in another, then open **http://localhost:3000**.

That is everything you need to run HackaVerse on your own computer.
#   h a c k a v e r s e  
 