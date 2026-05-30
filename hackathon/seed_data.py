#!/usr/bin/env python3
"""
Seed Data Script for HackaVerse
Initializes database with test data after reset
"""

import os
import sys
from pathlib import Path
from datetime import datetime, timedelta
from dotenv import load_dotenv
from pymongo import MongoClient
import hashlib
import secrets

# Load environment
env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path, override=True)

MONGODB_URI = os.getenv("MONGODB_URI")
DB_NAME = os.getenv("BUCKET_DB_NAME", "hackaverse_db")

if not MONGODB_URI:
    print("❌ ERROR: MONGODB_URI not set in .env")
    sys.exit(1)

print(f"\n{'='*70}")
print(f"[SEED] Connecting to MongoDB: {DB_NAME}")
print(f"{'='*70}\n")

try:
    client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
    client.admin.command("ping")
    db = client[DB_NAME]
    print("✅ Connected to MongoDB\n")
except Exception as e:
    print(f"❌ Failed to connect: {e}")
    sys.exit(1)

# Collection names
COLLECTIONS = {
    "users": "users",
    "sessions": "sessions",
    "hackathons": "hackathons",
    "teams": "teams",
    "user_teams": "user_teams",
    "submissions": "submissions",
}

def hash_password(password: str) -> str:
    """Hash password using SHA-256"""
    return hashlib.sha256(password.encode()).hexdigest()

def generate_token(length: int = 32) -> str:
    """Generate random token"""
    return secrets.token_urlsafe(length)

# ============================================================================
# SEED DATA
# ============================================================================

print("[SEED] Creating collections...\n")

# 1. Create Admin User
print("[SEED] Creating admin user...")
admin_user = {
    "user_id": "user_admin_001",
    "email": "admin@hackaverse.com",
    "name": "Admin User",
    "role": "admin",
    "password_hash": hash_password("admin@123"),
    "profile_completion": 100,
    "skills": ["Python", "FastAPI", "MongoDB"],
    "bio": "System Administrator",
    "created_at": datetime.now().isoformat(),
    "updated_at": datetime.now().isoformat()
}

db[COLLECTIONS["users"]].delete_one({"email": "admin@hackaverse.com"})
admin_result = db[COLLECTIONS["users"]].insert_one(admin_user)
print(f"✅ Admin user created: {admin_user['email']}\n")

# 2. Create Participant User
print("[SEED] Creating participant user...")
participant_user = {
    "user_id": "user_participant_001",
    "email": "participant@hackaverse.com",
    "name": "John Participant",
    "role": "participant",
    "password_hash": hash_password("participant@123"),
    "profile_completion": 50,
    "skills": ["JavaScript", "React", "Node.js"],
    "bio": "Full-stack developer",
    "created_at": datetime.now().isoformat(),
    "updated_at": datetime.now().isoformat()
}

db[COLLECTIONS["users"]].delete_one({"email": "participant@hackaverse.com"})
participant_result = db[COLLECTIONS["users"]].insert_one(participant_user)
print(f"✅ Participant user created: {participant_user['email']}\n")

# 3. Create Judge User
print("[SEED] Creating judge user...")
judge_user = {
    "user_id": "user_judge_001",
    "email": "judge@hackaverse.com",
    "name": "Jane Judge",
    "role": "judge",
    "password_hash": hash_password("judge@123"),
    "profile_completion": 75,
    "skills": ["AI", "ML", "Data Science"],
    "bio": "AI/ML Expert",
    "created_at": datetime.now().isoformat(),
    "updated_at": datetime.now().isoformat()
}

db[COLLECTIONS["users"]].delete_one({"email": "judge@hackaverse.com"})
judge_result = db[COLLECTIONS["users"]].insert_one(judge_user)
print(f"✅ Judge user created: {judge_user['email']}\n")

# 4. Create Hackathon
print("[SEED] Creating hackathon...")
hackathon_id = f"hack_{datetime.now().timestamp()}"
hackathon = {
    "id": hackathon_id,
    "name": "HackaVerse 2025",
    "description": "Build innovative solutions using AI and modern technologies",
    "start_date": (datetime.now() + timedelta(days=7)).isoformat(),
    "end_date": (datetime.now() + timedelta(days=9)).isoformat(),
    "min_team_size": 2,
    "max_team_size": 5,
    "status": "active",
    "track": "Open Innovation",
    "participant_count": 0,
    "created_at": datetime.now().isoformat(),
    "updated_at": datetime.now().isoformat()
}

db[COLLECTIONS["hackathons"]].delete_one({"name": "HackaVerse 2025"})
hackathon_result = db[COLLECTIONS["hackathons"]].insert_one(hackathon)
print(f"✅ Hackathon created: {hackathon['name']}")
print(f"   ID: {hackathon_id}\n")

# 5. Create Team
print("[SEED] Creating team...")
team_id = f"team_{datetime.now().timestamp()}"
team = {
    "team_id": team_id,
    "hackathon_id": hackathon_id,
    "team_name": "Team Alpha",
    "project_title": "AI-Powered Chat Assistant",
    "leader_id": "user_participant_001",
    "members": ["user_participant_001"],
    "created_at": datetime.now().isoformat(),
    "updated_at": datetime.now().isoformat()
}

db[COLLECTIONS["teams"]].delete_one({"team_name": "Team Alpha"})
team_result = db[COLLECTIONS["teams"]].insert_one(team)
print(f"✅ Team created: {team['team_name']}")
print(f"   ID: {team_id}\n")

# 6. Create User-Team Mapping
print("[SEED] Creating user-team mapping...")
user_team = {
    "user_id": "user_participant_001",
    "team_id": team_id,
    "role": "leader",
    "joined_at": datetime.now().isoformat()
}

db[COLLECTIONS["user_teams"]].delete_one({"user_id": "user_participant_001", "team_id": team_id})
user_team_result = db[COLLECTIONS["user_teams"]].insert_one(user_team)
print(f"✅ User-team mapping created\n")

# 7. Create Submission
print("[SEED] Creating submission...")
submission_id = f"sub_{datetime.now().timestamp()}"
submission = {
    "submission_id": submission_id,
    "team_id": team_id,
    "hackathon_id": hackathon_id,
    "title": "AI Chat Assistant",
    "description": "An intelligent chatbot powered by GPT and custom training",
    "github_link": "https://github.com/example/ai-chat",
    "demo_link": "https://demo.example.com/ai-chat",
    "submitted_by": "user_participant_001",
    "submitted_at": datetime.now().isoformat(),
    "status": "submitted",
    "score": None,
    "created_at": datetime.now().isoformat()
}

db[COLLECTIONS["submissions"]].delete_one({"team_id": team_id})
submission_result = db[COLLECTIONS["submissions"]].insert_one(submission)
print(f"✅ Submission created: {submission['title']}\n")

# ============================================================================
# VERIFICATION
# ============================================================================

print(f"\n{'='*70}")
print("[SEED] VERIFICATION")
print(f"{'='*70}\n")

# Count documents
users_count = db[COLLECTIONS["users"]].count_documents({})
hackathons_count = db[COLLECTIONS["hackathons"]].count_documents({})
teams_count = db[COLLECTIONS["teams"]].count_documents({})
submissions_count = db[COLLECTIONS["submissions"]].count_documents({})

print(f"✅ Users: {users_count}")
print(f"✅ Hackathons: {hackathons_count}")
print(f"✅ Teams: {teams_count}")
print(f"✅ Submissions: {submissions_count}\n")

# ============================================================================
# TEST CREDENTIALS
# ============================================================================

print(f"{'='*70}")
print("[SEED] TEST CREDENTIALS")
print(f"{'='*70}\n")

print("Admin Account:")
print(f"  Email: admin@hackaverse.com")
print(f"  Password: admin@123")
print(f"  Role: admin\n")

print("Participant Account:")
print(f"  Email: participant@hackaverse.com")
print(f"  Password: participant@123")
print(f"  Role: participant\n")

print("Judge Account:")
print(f"  Email: judge@hackaverse.com")
print(f"  Password: judge@123")
print(f"  Role: judge\n")

print("Hackathon:")
print(f"  Name: {hackathon['name']}")
print(f"  ID: {hackathon_id}")
print(f"  Status: {hackathon['status']}\n")

print("Team:")
print(f"  Name: {team['team_name']}")
print(f"  ID: {team_id}")
print(f"  Leader: participant@hackaverse.com\n")

# ============================================================================
# CLEANUP
# ============================================================================

client.close()

print(f"{'='*70}")
print("✅ SEED DATA CREATED SUCCESSFULLY")
print(f"{'='*70}\n")

print("Next Steps:")
print("1. Start backend: python -m src.main")
print("2. Start frontend: npm run dev")
print("3. Login with test credentials")
print("4. Test the complete flow\n")
