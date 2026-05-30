from src.agents.base_agent import BaseAgent

class DefaultAgent(BaseAgent):
    role = "default"

    async def handle(self, payload: dict):
        return {
            "agent": "default",
            "action": "handled",
            "result": "Processed with default agent"
        }