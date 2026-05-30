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
    if not MONGODB_URI:
        logger.error("[DB] MONGODB_URI environment variable is NOT SET — add to .env")
        DB_AVAILABLE = False
        return False
    
    # Check if URI is valid format
    if not MONGODB_URI.startswith(("mongodb://", "mongodb+srv://")):
        logger.error(f"[DB] MONGODB_URI has invalid format — expected mongodb:// or mongodb+srv://")
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
