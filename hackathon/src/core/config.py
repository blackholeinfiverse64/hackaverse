"""
Configuration module for HackaAIverse - AI Agent-Based Hackathon System
"""

import os
from dotenv import load_dotenv
from typing import Dict, List

# Load environment variables
load_dotenv()

class Config:
    """Configuration class for the hackathon system"""
    
    # Groq API Configuration
    GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL = os.getenv("GROQ_MODEL", "llama3-8b-8192")
    
    # Firebase Configuration
    FIREBASE_KEY = os.getenv("FIREBASE_KEY", "")
    
    # Application Configuration
    AUTHOR_PASSWORD = os.getenv("AUTHOR_PASSWORD", "author@123")
    HACKATHON_NAME = os.getenv("HACKATHON_NAME", "HackaAIverse 2024")
    HACKATHON_THEME = os.getenv("HACKATHON_THEME", "AI for Real Life")
    
    # Email Configuration
    SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
    EMAIL_USER = os.getenv("EMAIL_USER", "")
    EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD", "")
    
    # Discord Bot Configuration
    DISCORD_BOT_TOKEN = os.getenv("DISCORD_BOT_TOKEN", "")
    
    # Database Configuration
    DATABASE_TYPE = os.getenv("DATABASE_TYPE", "json")
    DATA_DIR = os.getenv("DATA_DIR", "data")
    
    # Judging Configuration
    JUDGING_CRITERIA = os.getenv("JUDGING_CRITERIA", "usefulness,creativity,teamwork,tech_stack,clarity").split(",")
    MAX_SCORE_PER_CRITERIA = int(os.getenv("MAX_SCORE_PER_CRITERIA", "10"))
    JUDGE_MODE = os.getenv("JUDGE_MODE", "ai")  # "ai" or "demo"
    
    # Event Configuration
    EVENT_DATE = os.getenv("EVENT_DATE", "2024-08-15")
    REGISTRATION_DEADLINE = os.getenv("REGISTRATION_DEADLINE", "2024-08-10")
    SUBMISSION_DEADLINE = os.getenv("SUBMISSION_DEADLINE", "2024-08-15T18:00:00")
    
    # File paths
    PROBLEM_FILE = os.path.join(DATA_DIR, "problems.json")
    TEAMS_FILE = os.path.join(DATA_DIR, "teams.json")
    PROJECTS_FILE = os.path.join(DATA_DIR, "projects.json")
    SCORES_FILE = os.path.join(DATA_DIR, "scores.json")
    OUTREACH_FILE = os.path.join(DATA_DIR, "outreach.json")
    
    @classmethod
    def validate_config(cls) -> Dict[str, bool]:
        """Validate configuration settings"""
        validation = {
            "groq_api_key": bool(cls.GROQ_API_KEY),
            "data_directory": os.path.exists(cls.DATA_DIR),
            "email_config": bool(cls.EMAIL_USER and cls.EMAIL_PASSWORD),
            "firebase_config": bool(cls.FIREBASE_KEY) if cls.DATABASE_TYPE == "firebase" else True
        }
        return validation
    
    @classmethod
    def create_data_directory(cls):
        """Create data directory if it doesn't exist"""
        os.makedirs(cls.DATA_DIR, exist_ok=True)
        
        # Create empty JSON files if they don't exist
        for file_path in [cls.PROBLEM_FILE, cls.TEAMS_FILE, cls.PROJECTS_FILE, cls.SCORES_FILE, cls.OUTREACH_FILE]:
            if not os.path.exists(file_path):
                with open(file_path, 'w') as f:
                    import json
                    json.dump([], f)

# Competition categories
COMPETITION_CATEGORIES = [
    "AI/ML",
    "Gaming", 
    "Web3/Blockchain",
    "Open Innovation"
]

# Default problem statements
DEFAULT_PROBLEMS = [
    {
        "id": "prob_001",
        "title": "Mental Health Analyzer",
        "description": "Create a machine learning model that analyzes text messages or voice notes to detect signs of stress, anxiety, or depression among college students.",
        "category": "AI/ML",
        "difficulty": "Medium",
        "tech_stack": ["Python", "NLP", "Machine Learning", "API"]
    },
    {
        "id": "prob_002", 
        "title": "EduGame: Learn While You Play",
        "description": "Build a mini browser game (quiz/puzzle) that teaches AI/ML basics interactively.",
        "category": "Gaming",
        "difficulty": "Easy",
        "tech_stack": ["JavaScript", "HTML5", "CSS3", "Game Development"]
    },
    {
        "id": "prob_003",
        "title": "EcoTrack: AI for Daily Sustainability", 
        "description": "People want to track their carbon footprint but don't know how. Create a tool that scans a product or activity (like commuting, using plastic), and estimates its environmental impact using AI.",
        "category": "AI/ML",
        "difficulty": "Hard",
        "tech_stack": ["Computer Vision", "API Integration", "Mobile Development"]
    },
    {
        "id": "prob_004",
        "title": "AI-Powered Career Guide",
        "description": "Build a recommender system that suggests career paths based on user interests, academic scores, and uploaded resumes.",
        "category": "AI/ML", 
        "difficulty": "Medium",
        "tech_stack": ["NLP", "Recommendation Systems", "PDF Processing"]
    }
]

# Hackathon schedule template
HACKATHON_SCHEDULE = {
    "09:00-09:30": "Registration & Welcome Coffee",
    "09:30-10:00": "Opening Ceremony & Rules Explanation",
    "10:00-10:30": "Team Formation & Problem Statement Selection",
    "10:30-12:30": "Development Phase 1 (with Mentor Support)",
    "12:30-13:30": "Lunch Break & Networking",
    "13:30-16:30": "Development Phase 2 (Intensive Coding)",
    "16:30-17:00": "Project Submission & Demo Preparation",
    "17:00-18:00": "Team Presentations (5 min each)",
    "18:00-18:30": "Judging & Evaluation",
    "18:30-19:00": "Results Announcement & Closing Ceremony"
}

# Initialize configuration
Config.create_data_directory()
