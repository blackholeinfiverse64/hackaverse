import os
import sys
from datetime import datetime

# Ensure we can import from src
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.append(parent_dir)

from src.database import connect_to_db, get_db
from src.db_models import COLLECTIONS
from src.routes.auth_routes import hash_password

SEED_USERS = [
    {
        "email": "admin@hackaverse.com",
        "name": "System Administrator",
        "password": "admin@123",
        "role": "admin"
    },
    {
        "email": "judge@hackaverse.com",
        "name": "Head Judge",
        "password": "judge@123",
        "role": "judge"
    },
    {
        "email": "participant@hackaverse.com",
        "name": "Demo Participant",
        "password": "participant@123",
        "role": "participant"
    }
]

def seed():
    print("Starting seed script...")
    if not connect_to_db():
        print("Failed to connect to the database. Ensure MongoDB is running and MONGODB_URI is set.")
        sys.exit(1)
    
    db = get_db()
    if db is None:
        print("Database object is None.")
        sys.exit(1)

    users_collection = db[COLLECTIONS["users"]]

    for u in SEED_USERS:
        email = u["email"]
        password = u["password"]
        role = u["role"]
        name = u["name"]

        password_hash = hash_password(password)

        existing_user = users_collection.find_one({"email": email})

        if existing_user:
            print(f"Updating existing user: {email} to role: {role}")
            users_collection.update_one(
                {"_id": existing_user["_id"]},
                {"$set": {
                    "role": role,
                    "password_hash": password_hash,
                    "updated_at": datetime.now().isoformat()
                }}
            )
        else:
            print(f"Creating new user: {email} with role: {role}")
            user_id = f"user_{datetime.now().timestamp()}"
            user_data = {
                "user_id": user_id,
                "email": email,
                "name": name,
                "role": role,
                "password_hash": password_hash,
                "profile_completion": 0,
                "skills": [],
                "bio": None,
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            }
            users_collection.insert_one(user_data)
            
    print("Seeding completed successfully.")

if __name__ == "__main__":
    seed()
