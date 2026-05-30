from src.agents.base_agent import BaseAgent

class JudgeAgent(BaseAgent):
    role = "judge"

    async def handle(self, payload: dict):
        return {
            "agent": "judge",
            "action": "scored",
            "score": 8.5
        }