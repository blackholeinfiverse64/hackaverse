# src/database.py
# Simple MongoDB connection management for HackaVerse
import os
import logging
from pathlib import Path
from dotenv import load_dotenv
from pymongo import MongoClient

# CRITICAL: Load .env FIRST
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path, override=True)

logger = logging.getLogger(__name__)

# Global database connection variables
client = None
db = None
DB_AVAILABLE = False


def connect_to_db():
    """Connect to MongoDB - Simple and Clear"""
    global client, db, DB_AVAILABLE
    
    MONGODB_URI = os.getenv("MONGODB_URI")
    DB_NAME = os.getenv("BUCKET_DB_NAME", "hackaverse_db")
    
    # Check if URI is set
    if not MONGODB_URI or not MONGODB_URI.startswith(("mongodb://", "mongodb+srv://")):
        env_mode = os.getenv("ENV", "development").lower()
        if env_mode != "production":
            logger.warning("[DB] MONGODB_URI not configured — initializing mongomock in-memory database for local execution")
            return _init_in_memory_db(DB_NAME)
        logger.error("[DB] MONGODB_URI environment variable is NOT SET or invalid — add to .env")
        DB_AVAILABLE = False
        return False
    
    try:
        logger.info(f"[DB] Connecting to MongoDB... Database: {DB_NAME}")
        
        # Create connection with production-grade pooling
        client = MongoClient(
            MONGODB_URI,
            serverSelectionTimeoutMS=5000,
            connectTimeoutMS=5000,
            socketTimeoutMS=5000,
            maxPoolSize=50,
            minPoolSize=5,
            maxIdleTimeMS=30000,
            retryWrites=True,
        )
        
        # Test connection with ping
        client.admin.command("ping")
        
        # Set database
        db = client[DB_NAME]
        
        # Get collections count
        collections = db.list_collection_names()
        
        logger.info(f"[DB] MongoDB Connected! Database: {DB_NAME} | Collections: {len(collections)}")

        # Create indexes for performance and TTL cleanup
        try:
            # Sessions: auto-expire after 7 days
            db["sessions"].create_index("expires_at", expireAfterSeconds=0)
            # Users: unique email, fast lookup by user_id
            db["users"].create_index("email", unique=True, sparse=True)
            db["users"].create_index("user_id", unique=True, sparse=True)
            # Teams: fast lookup
            db["teams"].create_index("team_id", unique=True, sparse=True)
            db["teams"].create_index("hackathon_id")
            # Submissions
            db["submissions"].create_index("team_id")
            db["submissions"].create_index("hackathon_id")
            # Notifications: fast per-user lookup
            db["notifications"].create_index([("user_id", 1), ("created_at", -1)])
            # Webhooks
            db["webhooks"].create_index("webhook_id", unique=True, sparse=True)
            # Provenance
            db["provenance_logs"].create_index("timestamp")
            logger.info("[DB] Indexes created/verified")
        except Exception as idx_err:
            logger.warning(f"[DB] Index creation warning (non-fatal): {idx_err}")
        
        DB_AVAILABLE = True
        return True
        
    except Exception as e:
        logger.error(f"[DB] MongoDB Connection Failed! {type(e).__name__}: {str(e)}")
        env_mode = os.getenv("ENV", "development").lower()
        if env_mode != "production":
            logger.warning("[DB] Falling back to mongomock in-memory database for development")
            return _init_in_memory_db(DB_NAME)
        DB_AVAILABLE = False
        return False


def _init_in_memory_db(db_name: str) -> bool:
    """Initialize in-memory MongoDB mock with seed data for dev/test runtime"""
    global client, db, DB_AVAILABLE
    try:
        import mongomock
        import bcrypt
        from datetime import datetime

        client = mongomock.MongoClient()
        db = client[db_name]

        def hash_pw(pw: str) -> str:
            return bcrypt.hashpw(pw.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

        now = datetime.now().isoformat()
        users_col = db["users"]
        if users_col.count_documents({}) == 0:
            # Seed default accounts
            users_col.insert_many([
                {
                    "user_id": "user_admin_001",
                    "email": "admin@hackaverse.com",
                    "name": "System Administrator",
                    "role": "admin",
                    "password_hash": hash_pw("admin@123"),
                    "created_at": now,
                    "updated_at": now
                },
                {
                    "user_id": "user_judge_001",
                    "email": "judge@hackaverse.com",
                    "name": "Head Judge",
                    "role": "judge",
                    "password_hash": hash_pw("judge@123"),
                    "created_at": now,
                    "updated_at": now
                },
                {
                    "user_id": "user_participant_001",
                    "email": "participant@hackaverse.com",
                    "name": "Demo Participant",
                    "role": "participant",
                    "password_hash": hash_pw("participant@123"),
                    "created_at": now,
                    "updated_at": now
                }
            ])
            db["judges"].insert_one({
                "user_id": "user_judge_001",
                "name": "Head Judge",
                "email": "judge@hackaverse.com",
                "status": "active"
            })
            db["hackathons"].insert_one({
                "hackathon_id": "hackathon_default_001",
                "name": "HackaVerse 2026",
                "title": "HackaVerse 2026",
                "status": "active",
                "is_active": True,
                "created_at": now
            })
            db["teams"].insert_one({
                "team_id": "team_demo_001",
                "name": "Alpha Builders",
                "team_name": "Alpha Builders",
                "project_title": "AI BioSentinel",
                "project_description": "AI-powered biotechnology intelligence platform",
                "hackathon_id": "hackathon_default_001",
                "leader_id": "user_participant_001",
                "members": [{"user_id": "user_participant_001", "email": "participant@hackaverse.com", "role": "leader"}],
                "created_at": now
            })
            db["user_teams"].insert_one({
                "user_id": "user_participant_001",
                "team_id": "team_demo_001",
                "role": "leader"
            })
            db["submissions"].insert_one({
                "submission_id": "sub_demo_001",
                "team_id": "team_demo_001",
                "hackathon_id": "hackathon_default_001",
                "title": "AI BioSentinel",
                "description": "Automated stability analysis and biosimilarity audit platform",
                "repo_url": "https://github.com/BHIV-Engineering-Exchange/bhiv-Hackaverse",
                "created_at": now
            })
            db["judgments"].insert_one({
                "hackathon_id": "hackathon_default_001",
                "team_id": "team_demo_001",
                "submission_id": "sub_demo_001",
                "total_score": 92.5,
                "clarity": 9.0,
                "quality": 9.5,
                "innovation": 9.2,
                "confidence": 0.95,
                "created_at": now
            })
            logger.info("[DB] In-memory database seeded with default users, hackathons, teams, and submissions")

        DB_AVAILABLE = True
        return True
    except Exception as mock_err:
        logger.error(f"[DB] In-memory database initialization failed: {mock_err}")
        DB_AVAILABLE = False
        return False


def close_db():
    """Close database connection"""
    global client, db
    if client is not None:
        try:
            client.close()
            logger.info("Database connection closed")
        except Exception as e:
            logger.warning(f"Error closing database: {e}")
        finally:
            db = None
            client = None


def get_db():
    """Get database object - returns None if not connected"""
    global db
    return db


def get_db_status():
    """Get database status for health checks"""
    global DB_AVAILABLE
    
    MONGODB_URI = os.getenv("MONGODB_URI")
    DB_NAME = os.getenv("BUCKET_DB_NAME", "hackaverse_db")
    
    return {
        "connected": DB_AVAILABLE,
        "database": DB_NAME,
        "uri_set": bool(MONGODB_URI),
        "status": "Connected" if DB_AVAILABLE else "Not Connected"
    }
