from src.agents.base_agent import BaseAgent

class MentorAgent(BaseAgent):
    role = "mentor"

    async def handle(self, payload: dict):
        return {
            "agent": "mentor",
            "action": "advised",
            "advice": "Focus on improving your UI/UX design"
        }