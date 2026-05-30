# HackaVerse — Onboarding FAQ

> **Answers to common questions for new developers joining the project.**
> Last updated: 2026-05-11

---

### Q1: How do I run HackaVerse locally?
See [DEVELOPMENT.md](./DEVELOPMENT.md) — follow Backend Setup → Frontend Setup → Health Checks in that order.

### Q2: Where do I get the MongoDB connection string?
Go to [MongoDB Atlas](https://cloud.mongodb.com) → Your Cluster → Connect → Drivers → Copy the connection string. Replace `<password>` with your actual password.

### Q3: Where do I get a Groq API key?
Go to [console.groq.com](https://console.groq.com) → API Keys → Create new key. Free tier is sufficient for development.

### Q4: What happens if I don't set MONGODB_URI?
The backend starts in **degraded mode** — it runs but can't persist data. Auth, teams, submissions won't work. The `/health` endpoint will show `"status": "degraded"`.

### Q5: What happens if I don't set GROQ_API_KEY?
AI judging returns fallback scores (50/100) with `"fallback": true`. Manual judging still works.

### Q6: The frontend shows a blank white page — what's wrong?
1. Check browser console for errors
2. Verify backend is running: `curl http://localhost:8000/health`
3. Verify `VITE_API_URL` in frontend `.env` matches backend URL
4. Check for CORS errors — ensure `ALLOWED_ORIGINS=*` in backend `.env`

### Q7: I'm getting 401 errors on API calls
1. Check that `VITE_API_KEY` in frontend `.env` matches `API_KEY` in backend `.env`
2. If using auth endpoints, ensure you're sending the Bearer token in the Authorization header
3. Check that the API key is not empty or `default_key`

### Q8: Where is the judging logic?
- **AI Judging Engine:** `hackathon/src/judging/multi_agent_judge.py`
- **Consensus Logic:** `hackathon/src/judging/consensus.py`
- **Scoring Rubric:** `hackathon/src/judging/rubric.py`
- **Judge Routes:** `hackathon/src/routes/judge.py`

### Q9: How do I add a new API route?
1. Create route file in `hackathon/src/routes/`
2. Import and register in `hackathon/src/main.py`:
   ```python
   from .routes.my_route import router as my_router
   app.include_router(my_router)
   ```
3. Add corresponding frontend API method in `hackaverse-frontend/src/services/api.js`

### Q10: How do I change the scoring criteria?
Edit `JUDGING_CRITERIA` in backend `.env`. Default: `usefulness,creativity,teamwork,tech_stack,clarity`

### Q11: Why are there two API clients in the frontend?
Historical artifact. `api.js` (apiService) is the primary client. `apiClient.js` is a secondary client used by some admin components. Both now use the centralized `getApiKey()` from `constants/apiKey.js`.

### Q12: How do I deploy changes?
- **Backend:** Push to the backend GitHub repo → Render auto-deploys
- **Frontend:** Push to the frontend GitHub repo → Vercel auto-deploys
See [DEPLOYMENT_NOTES.md](./DEPLOYMENT_NOTES.md) for details.

### Q13: What is BHIV / Bucket logging?
BHIV (BlackHole InfiVerse) is the parent ecosystem. HackaVerse logs structured events (KSML format) to local JSON files in `./data/bucket/`. This is audit trail logging, not runtime authority.

### Q14: What is the `data/` directory for?
It contains:
- `bucket/` — structured audit log files (JSON)
- `teams.json`, `projects.json` — seed/fallback data
- Various runtime log files

### Q15: How do I run tests?
```bash
cd hackathon
pytest  # Note: test suite needs to be rebuilt
```
Currently there are no automated tests. Test infrastructure (pytest) is in `requirements.txt` but test files need to be created.

### Q16: What is TANTRA?
TANTRA is the future ecosystem orchestration layer. HackaVerse is a **participant** in TANTRA, not an orchestrator. See [TANTRA_ALIGNMENT.md](./TANTRA_ALIGNMENT.md).

### Q17: What database collections exist?
- `users` — User accounts
- `sessions` — Auth refresh tokens
- `teams` — Team data
- `hackathons` — Hackathon events
- `submissions` — Project submissions
- `judgments` — AI scoring results
- `provenance_logs` — Audit trail
- `notifications` — User notifications

### Q18: How do I debug a failing API call?
1. Check backend terminal for error logs
2. Check `data/bucket/` for recent log files
3. Use `/docs` (Swagger UI) to test the endpoint directly
4. Check MongoDB Atlas for data state

### Q19: What Python version should I use?
Python 3.10+. Recommended: 3.11 or 3.12. The project uses type hints and f-strings extensively.

### Q20: Can I use a local MongoDB instead of Atlas?
Yes. Set `MONGODB_URI=mongodb://localhost:27017/hackaverse_db` in your `.env`. You'll need MongoDB running locally.
