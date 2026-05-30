"""
AI Agents for HackaAIverse - Groq-powered intelligent agents
"""

import json
import os
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import smtplib

import logging as _logging

try:
    from groq import Groq
except ImportError:
    _logging.getLogger(__name__).warning("Groq library not installed. Please install with: pip install groq")
    Groq = None

# Email imports with fallback
try:
    from email.mime.text import MimeText
    from email.mime.multipart import MimeMultipart
    EMAIL_AVAILABLE = True
except ImportError:
    # Fallback for email functionality
    MimeText = None
    MimeMultipart = None
    EMAIL_AVAILABLE = False

from config import Config

class GroqAgent:
    """Base class for all Groq-powered AI agents"""
    
    def __init__(self, agent_name: str, system_prompt: str):
        self.agent_name = agent_name
        self.system_prompt = system_prompt
        self.client = None
        
        if Groq and Config.GROQ_API_KEY:
            try:
                self.client = Groq(api_key=Config.GROQ_API_KEY)
            except Exception as e:
                _logging.getLogger(__name__).error(f"Failed to initialize Groq client: {e}")
    
    def generate_response(self, user_prompt: str, model: str = None) -> str:
        """Generate response using Groq API"""
        if not self.client:
            return f"[{self.agent_name}] Groq client not available. Please check your API key."

        # Use configured model if none specified
        if model is None:
            model = Config.GROQ_MODEL

        try:
            chat_completion = self.client.chat.completions.create(
                messages=[
                    {"role": "system", "content": self.system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                model=model,
                temperature=0.7,
                max_tokens=1024
            )
            return chat_completion.choices[0].message.content
        except Exception as e:
            return f"[{self.agent_name}] Error generating response: {str(e)}"

class MentorBot(GroqAgent):
    """AI Mentor for providing coding assistance and project guidance"""
    
    def __init__(self):
        system_prompt = """You are MentorBot, an expert AI mentor for hackathon participants. 
        You provide helpful coding assistance, project guidance, and technical advice.
        
        Your expertise includes:
        - Programming languages (Python, JavaScript, Java, C++, etc.)
        - Web development (React, Node.js, Django, Flask)
        - Machine Learning and AI (TensorFlow, PyTorch, scikit-learn)
        - Mobile development (React Native, Flutter)
        - Database design and APIs
        - Project architecture and best practices
        
        Always provide:
        1. Clear, actionable advice
        2. Code examples when relevant
        3. Alternative approaches
        4. Resource recommendations
        5. Encouragement and motivation
        
        Keep responses concise but comprehensive. Focus on helping teams succeed in their hackathon projects."""
        
        super().__init__("MentorBot", system_prompt)
    
    def get_coding_help(self, question: str, tech_stack: str = "") -> str:
        """Provide coding assistance"""
        prompt = f"""
        Question: {question}
        Tech Stack: {tech_stack}
        
        Please provide helpful coding guidance for this hackathon question.
        """
        return self.generate_response(prompt)
    
    def review_project_idea(self, project_description: str, category: str) -> str:
        """Review and provide feedback on project ideas"""
        prompt = f"""
        Project Description: {project_description}
        Category: {category}
        
        Please review this hackathon project idea and provide:
        1. Strengths of the idea
        2. Potential challenges
        3. Implementation suggestions
        4. Technology recommendations
        5. Scope advice for a 1-day hackathon
        """
        return self.generate_response(prompt)
    
    def suggest_improvements(self, current_progress: str, time_remaining: str) -> str:
        """Suggest improvements based on current progress"""
        prompt = f"""
        Current Progress: {current_progress}
        Time Remaining: {time_remaining}
        
        Based on the current progress and time constraints, suggest:
        1. Priority features to focus on
        2. Features to potentially cut
        3. Quick wins and optimizations
        4. Presentation tips
        """
        return self.generate_response(prompt)

class JudgingBot(GroqAgent):
    """AI Assistant for intelligent project evaluation and scoring"""
    
    def __init__(self):
        system_prompt = """You are JudgingBot, an expert AI assistant for hackathon project evaluation.
        You help judges assess projects fairly and consistently across multiple criteria.
        
        Evaluation Criteria:
        1. Usefulness (1-10): How practical and valuable is the solution?
        2. Creativity (1-10): How innovative and original is the approach?
        3. Teamwork (1-10): How well did the team collaborate and present?
        4. Tech Stack (1-10): How appropriate and well-implemented is the technology?
        5. Clarity (1-10): How clear and well-presented is the project?
        
        Provide:
        - Objective analysis based on project details
        - Specific feedback for each criteria
        - Suggested scores with justification
        - Constructive feedback for teams
        - Comparison insights when evaluating multiple projects
        
        Be fair, constructive, and encouraging while maintaining evaluation standards."""
        
        super().__init__("JudgingBot", system_prompt)
    
    def evaluate_project(self, project_data: Dict[str, Any]) -> Dict[str, Any]:
        """Evaluate a project and provide scoring recommendations"""
        prompt = f"""
        Project Details:
        Team: {project_data.get('team_name', 'Unknown')}
        Project Title: {project_data.get('title', 'Not provided')}
        Description: {project_data.get('description', 'Not provided')}
        Tech Stack: {project_data.get('tech_stack', 'Not provided')}
        Demo Link: {project_data.get('demo_link', 'Not provided')}
        GitHub Link: {project_data.get('github_link', 'Not provided')}
        
        Please evaluate this project and provide:
        1. Detailed analysis for each criteria (Usefulness, Creativity, Teamwork, Tech Stack, Clarity)
        2. Suggested scores (1-10) for each criteria with justification
        3. Overall strengths and areas for improvement
        4. Constructive feedback for the team
        
        Format your response as a structured evaluation.
        """
        
        response = self.generate_response(prompt)
        
        # Parse response and extract scores (simplified implementation)
        evaluation = {
            "team_name": project_data.get('team_name', 'Unknown'),
            "ai_analysis": response,
            "suggested_scores": {
                "usefulness": 7,  # Default scores - would be parsed from AI response
                "creativity": 7,
                "teamwork": 7,
                "tech_stack": 7,
                "clarity": 7
            },
            "total_score": 35,
            "evaluation_timestamp": datetime.now().isoformat()
        }
        
        return evaluation
    
    def compare_projects(self, projects: List[Dict[str, Any]]) -> str:
        """Compare multiple projects and provide ranking insights"""
        project_summaries = []
        for i, project in enumerate(projects, 1):
            summary = f"{i}. {project.get('team_name', 'Unknown')}: {project.get('title', 'No title')}"
            project_summaries.append(summary)
        
        prompt = f"""
        Projects to compare:
        {chr(10).join(project_summaries)}
        
        Please provide:
        1. Comparative analysis of these projects
        2. Ranking considerations
        3. Unique strengths of each project
        4. Overall competition insights
        """
        
        return self.generate_response(prompt)

class ChallengeGenerator(GroqAgent):
    """AI Agent for generating themed hackathon challenges"""
    
    def __init__(self):
        system_prompt = """You are ChallengeGenerator, an expert at creating engaging hackathon problem statements.
        
        You create challenges that are:
        - Relevant to current technology trends
        - Achievable in a 1-day hackathon format
        - Inspiring and motivating for students
        - Clear in requirements and scope
        - Diverse across different categories
        
        Categories: AI/ML, Gaming, Web3/Blockchain, Open Innovation
        Difficulty Levels: Easy, Medium, Hard
        
        Each challenge should include:
        1. Compelling title
        2. Clear problem description
        3. Target audience/use case
        4. Suggested technology stack
        5. Success criteria
        6. Bonus features (optional)
        
        Make challenges exciting and achievable while encouraging innovation."""
        
        super().__init__("ChallengeGenerator", system_prompt)
    
    def generate_challenges(self, theme: str, category: str, count: int = 3) -> List[Dict[str, Any]]:
        """Generate hackathon challenges based on theme and category"""
        prompt = f"""
        Theme: {theme}
        Category: {category}
        Number of challenges needed: {count}
        
        Generate {count} diverse hackathon challenges for the category "{category}" 
        with the theme "{theme}". Each challenge should be unique and engaging.
        
        For each challenge, provide:
        1. Title
        2. Description (2-3 sentences)
        3. Difficulty level (Easy/Medium/Hard)
        4. Suggested tech stack
        5. Success criteria
        """
        
        response = self.generate_response(prompt)
        
        # Simplified parsing - in production, would use more sophisticated parsing
        challenges = []
        for i in range(count):
            challenge = {
                "id": f"gen_{category.lower()}_{i+1}",
                "title": f"Generated Challenge {i+1}",
                "description": response,  # Would parse individual challenges
                "category": category,
                "difficulty": "Medium",
                "tech_stack": ["Python", "API"],
                "generated_at": datetime.now().isoformat()
            }
            challenges.append(challenge)
        
        return challenges

class ReminderBot(GroqAgent):
    """AI Agent for automated event communication and reminders"""
    
    def __init__(self):
        system_prompt = """You are ReminderBot, responsible for hackathon event communication.
        
        You create:
        - Registration reminders
        - Event schedule updates
        - Deadline notifications
        - Motivational messages
        - Technical announcements
        
        Your messages are:
        - Clear and actionable
        - Appropriately timed
        - Encouraging and supportive
        - Professional yet friendly
        - Include relevant details and links
        
        Adapt tone based on message type (urgent vs. informational vs. motivational)."""
        
        super().__init__("ReminderBot", system_prompt)
    
    def generate_reminder(self, reminder_type: str, details: Dict[str, Any]) -> str:
        """Generate reminder messages"""
        prompt = f"""
        Reminder Type: {reminder_type}
        Details: {json.dumps(details, indent=2)}
        
        Generate an appropriate reminder message for hackathon participants.
        """
        
        return self.generate_response(prompt)
    
    def send_email_reminder(self, recipients: List[str], subject: str, message: str) -> bool:
        """Send email reminders (if email is configured)"""
        if not Config.EMAIL_USER or not Config.EMAIL_PASSWORD:
            _logging.getLogger(__name__).warning("Email configuration not available")
            return False

        if not EMAIL_AVAILABLE:
            _logging.getLogger(__name__).warning("Email modules not available")
            return False

        try:
            msg = MimeMultipart()
            msg['From'] = Config.EMAIL_USER
            msg['Subject'] = subject
            msg.attach(MimeText(message, 'plain'))

            server = smtplib.SMTP(Config.SMTP_SERVER, Config.SMTP_PORT)
            server.starttls()
            server.login(Config.EMAIL_USER, Config.EMAIL_PASSWORD)

            for recipient in recipients:
                msg['To'] = recipient
                server.send_message(msg)
                del msg['To']

            server.quit()
            return True

        except Exception as e:
            _logging.getLogger(__name__).error(f"Failed to send email: {e}")
            return False

# Agent factory for easy instantiation
class AgentFactory:
    """Factory class for creating AI agents"""
    
    @staticmethod
    def create_mentor_bot() -> MentorBot:
        return MentorBot()
    
    @staticmethod
    def create_judging_bot() -> JudgingBot:
        return JudgingBot()
    
    @staticmethod
    def create_challenge_generator() -> ChallengeGenerator:
        return ChallengeGenerator()
    
    @staticmethod
    def create_reminder_bot() -> ReminderBot:
        return ReminderBot()
