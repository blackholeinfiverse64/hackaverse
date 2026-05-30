from src.agents.base_agent import BaseAgent

class SystemAgent(BaseAgent):
    role = "system"

    async def handle(self, payload: dict):
        return {
            "agent": "system",
            "action": "processed",
            "result": "System maintenance completed"
        }