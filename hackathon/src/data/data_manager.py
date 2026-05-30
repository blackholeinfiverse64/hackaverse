"""
Data Management Module for HackaAIverse
Handles JSON-based data storage and retrieval
"""

import json
import os
import uuid
from datetime import datetime
from typing import Dict, List, Any, Optional
from config import Config
import logging

_logger = logging.getLogger(__name__)

class DataManager:
    """Handles all data operations for the hackathon system"""
    
    def __init__(self):
        Config.create_data_directory()
    
    def load_json(self, file_path: str) -> List[Dict[str, Any]]:
        """Load data from JSON file"""
        try:
            if os.path.exists(file_path):
                with open(file_path, 'r', encoding='utf-8') as f:
                    return json.load(f)
            return []
        except Exception as e:
            _logger.error(f"Error loading {file_path}: {e}")
            return []
    
    def save_json(self, file_path: str, data: List[Dict[str, Any]]) -> bool:
        """Save data to JSON file"""
        try:
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            return True
        except Exception as e:
            _logger.error(f"Error saving {file_path}: {e}")
            return False
    
    # Problem Statements Management
    def get_problems(self) -> List[Dict[str, Any]]:
        """Get all problem statements"""
        return self.load_json(Config.PROBLEM_FILE)
    
    def add_problem(self, title: str, description: str, category: str = "Open Innovation", 
                   difficulty: str = "Medium", tech_stack: List[str] = None) -> str:
        """Add a new problem statement"""
        problems = self.get_problems()
        problem_id = str(uuid.uuid4())[:8]
        
        new_problem = {
            "id": problem_id,
            "title": title,
            "description": description,
            "category": category,
            "difficulty": difficulty,
            "tech_stack": tech_stack or [],
            "created_at": datetime.now().isoformat()
        }
        
        problems.append(new_problem)
        self.save_json(Config.PROBLEM_FILE, problems)
        return problem_id
    
    def get_problem_by_id(self, problem_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific problem by ID"""
        problems = self.get_problems()
        return next((p for p in problems if p.get("id") == problem_id), None)
    
    # Team Management
    def get_teams(self) -> List[Dict[str, Any]]:
        """Get all registered teams"""
        return self.load_json(Config.TEAMS_FILE)
    
    def register_team(self, team_name: str, members: List[str], email: str, 
                     college: str = "", contact_number: str = "") -> str:
        """Register a new team"""
        teams = self.get_teams()
        
        # Check if team name already exists
        if any(team.get("team_name") == team_name for team in teams):
            raise ValueError(f"Team name '{team_name}' already exists")
        
        team_id = str(uuid.uuid4())[:8]
        new_team = {
            "id": team_id,
            "team_name": team_name,
            "members": members,
            "email": email,
            "college": college,
            "contact_number": contact_number,
            "registered_at": datetime.now().isoformat(),
            "status": "registered"
        }
        
        teams.append(new_team)
        self.save_json(Config.TEAMS_FILE, teams)
        return team_id
    
    def get_team_by_name(self, team_name: str) -> Optional[Dict[str, Any]]:
        """Get team by name"""
        teams = self.get_teams()
        return next((t for t in teams if t.get("team_name") == team_name), None)
    
    # Project Submissions Management
    def get_projects(self) -> List[Dict[str, Any]]:
        """Get all project submissions"""
        return self.load_json(Config.PROJECTS_FILE)
    
    def submit_project(self, team_name: str, project_title: str, description: str,
                      github_link: str = "", demo_link: str = "", tech_stack: List[str] = None,
                      problem_id: str = "") -> str:
        """Submit a project"""
        projects = self.get_projects()
        
        # Check if team exists
        team = self.get_team_by_name(team_name)
        if not team:
            raise ValueError(f"Team '{team_name}' not found")
        
        # Check if team already submitted
        existing_project = next((p for p in projects if p.get("team_name") == team_name), None)
        if existing_project:
            # Update existing submission
            existing_project.update({
                "project_title": project_title,
                "description": description,
                "github_link": github_link,
                "demo_link": demo_link,
                "tech_stack": tech_stack or [],
                "problem_id": problem_id,
                "updated_at": datetime.now().isoformat()
            })
            submission_id = existing_project["id"]
        else:
            # Create new submission
            submission_id = str(uuid.uuid4())[:8]
            new_project = {
                "id": submission_id,
                "team_name": team_name,
                "project_title": project_title,
                "description": description,
                "github_link": github_link,
                "demo_link": demo_link,
                "tech_stack": tech_stack or [],
                "problem_id": problem_id,
                "submitted_at": datetime.now().isoformat(),
                "status": "submitted"
            }
            projects.append(new_project)
        
        self.save_json(Config.PROJECTS_FILE, projects)
        return submission_id
    
    def get_project_by_team(self, team_name: str) -> Optional[Dict[str, Any]]:
        """Get project submission by team name"""
        projects = self.get_projects()
        return next((p for p in projects if p.get("team_name") == team_name), None)
    
    # Scoring Management
    def get_scores(self) -> List[Dict[str, Any]]:
        """Get all scores"""
        return self.load_json(Config.SCORES_FILE)
    
    def submit_score(self, team_name: str, judge_name: str, scores: Dict[str, int],
                    comments: str = "") -> str:
        """Submit scores for a team"""
        all_scores = self.get_scores()
        score_id = str(uuid.uuid4())[:8]
        
        # Calculate total score
        total_score = sum(scores.values())
        
        new_score = {
            "id": score_id,
            "team_name": team_name,
            "judge_name": judge_name,
            "scores": scores,
            "total_score": total_score,
            "comments": comments,
            "submitted_at": datetime.now().isoformat()
        }
        
        all_scores.append(new_score)
        self.save_json(Config.SCORES_FILE, all_scores)
        return score_id
    
    def get_team_scores(self, team_name: str) -> List[Dict[str, Any]]:
        """Get all scores for a specific team"""
        all_scores = self.get_scores()
        return [score for score in all_scores if score.get("team_name") == team_name]
    
    def calculate_team_average_score(self, team_name: str) -> Dict[str, float]:
        """Calculate average scores for a team"""
        team_scores = self.get_team_scores(team_name)
        
        if not team_scores:
            return {"total_average": 0.0, "criteria_averages": {}}
        
        # Calculate averages for each criteria
        criteria_sums = {}
        criteria_counts = {}
        total_sum = 0
        
        for score_entry in team_scores:
            scores = score_entry.get("scores", {})
            total_sum += score_entry.get("total_score", 0)
            
            for criteria, score in scores.items():
                if criteria not in criteria_sums:
                    criteria_sums[criteria] = 0
                    criteria_counts[criteria] = 0
                criteria_sums[criteria] += score
                criteria_counts[criteria] += 1
        
        criteria_averages = {
            criteria: criteria_sums[criteria] / criteria_counts[criteria]
            for criteria in criteria_sums
        }
        
        total_average = total_sum / len(team_scores)
        
        return {
            "total_average": round(total_average, 2),
            "criteria_averages": {k: round(v, 2) for k, v in criteria_averages.items()},
            "judge_count": len(team_scores)
        }
    
    def get_leaderboard(self) -> List[Dict[str, Any]]:
        """Generate leaderboard with team rankings"""
        teams = self.get_teams()
        leaderboard = []
        
        for team in teams:
            team_name = team["team_name"]
            project = self.get_project_by_team(team_name)
            score_data = self.calculate_team_average_score(team_name)
            
            leaderboard_entry = {
                "team_name": team_name,
                "members": team.get("members", []),
                "college": team.get("college", ""),
                "project_title": project.get("project_title", "Not Submitted") if project else "Not Submitted",
                "total_average": score_data.get("total_average", 0),
                "criteria_averages": score_data.get("criteria_averages", {}),
                "judge_count": score_data.get("judge_count", 0),
                "has_submission": bool(project)
            }
            leaderboard.append(leaderboard_entry)
        
        # Sort by total average score (descending)
        leaderboard.sort(key=lambda x: x["total_average"], reverse=True)
        
        # Add rankings
        for i, entry in enumerate(leaderboard, 1):
            entry["rank"] = i
        
        return leaderboard
    
    # Outreach Management
    def get_outreach_data(self) -> List[Dict[str, Any]]:
        """Get outreach campaign data"""
        return self.load_json(Config.OUTREACH_FILE)
    
    def add_outreach_contact(self, college_name: str, contact_person: str, 
                           contact_email: str, contact_phone: str = "",
                           outreach_method: str = "", status: str = "contacted") -> str:
        """Add outreach contact information"""
        outreach_data = self.get_outreach_data()
        contact_id = str(uuid.uuid4())[:8]
        
        new_contact = {
            "id": contact_id,
            "college_name": college_name,
            "contact_person": contact_person,
            "contact_email": contact_email,
            "contact_phone": contact_phone,
            "outreach_method": outreach_method,
            "status": status,
            "contacted_at": datetime.now().isoformat(),
            "responses": []
        }
        
        outreach_data.append(new_contact)
        self.save_json(Config.OUTREACH_FILE, outreach_data)
        return contact_id
    
    def update_outreach_status(self, contact_id: str, status: str, response_note: str = "") -> bool:
        """Update outreach contact status"""
        outreach_data = self.get_outreach_data()
        
        for contact in outreach_data:
            if contact.get("id") == contact_id:
                contact["status"] = status
                if response_note:
                    contact["responses"].append({
                        "note": response_note,
                        "timestamp": datetime.now().isoformat()
                    })
                self.save_json(Config.OUTREACH_FILE, outreach_data)
                return True
        
        return False
    
    # Statistics and Analytics
    def get_statistics(self) -> Dict[str, Any]:
        """Get comprehensive statistics"""
        teams = self.get_teams()
        projects = self.get_projects()
        scores = self.get_scores()
        outreach = self.get_outreach_data()
        
        # Team statistics
        colleges = list(set(team.get("college", "Unknown") for team in teams))
        
        # Submission statistics
        submission_rate = len(projects) / len(teams) * 100 if teams else 0
        
        # Scoring statistics
        scored_teams = len(set(score.get("team_name") for score in scores))
        
        # Outreach statistics
        outreach_responses = len([c for c in outreach if c.get("status") == "responded"])
        
        return {
            "total_teams": len(teams),
            "total_colleges": len(colleges),
            "colleges_list": colleges,
            "total_submissions": len(projects),
            "submission_rate": round(submission_rate, 1),
            "scored_teams": scored_teams,
            "total_scores": len(scores),
            "outreach_contacts": len(outreach),
            "outreach_responses": outreach_responses,
            "last_updated": datetime.now().isoformat()
        }
