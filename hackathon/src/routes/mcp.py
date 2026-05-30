from fastapi import APIRouter
from ..mcp_router import route_message
from ..schemas.response import APIResponse

router = APIRouter(prefix="/mcp")

@router.post("/route")
async def route(payload: dict):
    agent_type = payload.get("agent_type", "default")
    result = await route_message(agent_type, payload)
    return APIResponse(success=True, message="routed", data=result)