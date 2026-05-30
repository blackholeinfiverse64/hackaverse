from abc import ABC, abstractmethod

class BaseAgent(ABC):
    role: str

    @abstractmethod
    async def handle(self, payload: dict) -> dict:
        pass