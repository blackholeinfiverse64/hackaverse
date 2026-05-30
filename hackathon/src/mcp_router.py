"""
MCP Router - Routes messages to appropriate agents
"""
import logging
import os
from groq import Groq
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)

# Initialize Groq client
try:
    groq_api_key = os.getenv("GROQ_API_KEY")
    if not groq_api_key:
        logger.warning("[MCP] GROQ_API_KEY not found in environment")
        groq_client = None
    else:
        groq_client = Groq(api_key=groq_api_key)
        logger.info("[MCP] Groq client initialized successfully")
except Exception as e:
    logger.error(f"[MCP] Failed to initialize Groq client: {str(e)}")
    groq_client = None

async def route_message(agent_type: str, payload: dict) -> dict:
    """
    Route incoming messages to the appropriate agent handler
    
    Args:
        agent_type: Type of agent to route to (default, judge, mentor, system)
        payload: Message payload containing user input and context
    
    Returns:
        Agent response dictionary
    """
    try:
        message = payload.get("message", "")
        context = payload.get("context", {})
        
        logger.info(f"[MCP] Routing message to {agent_type} agent")
        logger.debug(f"[MCP] Message: {message[:100]}...")
        logger.debug(f"[MCP] Context: {context}")
        
        # Route to appropriate agent
        if agent_type == "judge":
            response = await handle_judge_agent(message, context)
        elif agent_type == "mentor":
            response = await handle_mentor_agent(message, context)
        elif agent_type == "system":
            response = await handle_system_agent(message, context)
        else:
            response = await handle_default_agent(message, context)
        
        logger.info(f"[MCP] Agent response generated successfully")
        return response
        
    except Exception as e:
        logger.error(f"[MCP] Error routing message: {str(e)}")
        return {
            "response": f"Error processing request: {str(e)}",
            "error": True
        }

async def handle_default_agent(message: str, context: dict) -> dict:
    """Handle default agent requests"""
    logger.info("[AGENT] Default agent handling message")
    
    if not groq_client:
        logger.warning("[AGENT] Groq client not available, using fallback response")
        response_text = f"I received your message: '{message}'. "
        user_role = context.get("role", "participant")
        if user_role == "admin":
            response_text += "As an admin, you have access to all system features."
        elif user_role == "judge":
            response_text += "As a judge, you can review and score submissions."
        elif user_role == "participant":
            response_text += "As a participant, you can create teams and submit projects."
        return {
            "response": response_text,
            "agent_type": "default",
            "success": True
        }
    
    try:
        # Get user role for context
        user_role = context.get("role", "participant")
        username = context.get("username", "User")
        
        # Build system prompt based on role
        system_prompt = f"""You are HackaAgent, an AI assistant for the HackaVerse hackathon platform.
        The user is a {user_role} named {username}.
        Provide helpful, concise responses about hackathons, team management, project submissions, and judging.
        Keep responses under 150 words."""
        
        # Call Groq API
        logger.info(f"[AGENT] Calling Groq API for default agent")
        chat_completion = groq_client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": system_prompt
                },
                {
                    "role": "user",
                    "content": message
                }
            ],
            model=os.getenv("GROQ_MODEL", "llama-3.1-8b-instant"),
            temperature=0.7,
            max_tokens=500
        )
        
        response_text = chat_completion.choices[0].message.content
        logger.info(f"[AGENT] Groq response received successfully")
        
        return {
            "response": response_text,
            "agent_type": "default",
            "success": True
        }
    except Exception as e:
        logger.error(f"[AGENT] Error calling Groq API: {str(e)}")
        return {
            "response": f"I encountered an error processing your request: {str(e)}",
            "agent_type": "default",
            "success": False,
            "error": str(e)
        }

async def handle_judge_agent(message: str, context: dict) -> dict:
    """Handle judge agent requests"""
    logger.info("[AGENT] Judge agent handling message")
    
    if not groq_client:
        logger.warning("[AGENT] Groq client not available, using fallback response")
        return {
            "response": f"Judge Agent: I'm here to help with judging tasks. You asked: '{message}'",
            "agent_type": "judge",
            "success": True
        }
    
    try:
        system_prompt = """You are a judging assistant for the HackaVerse hackathon platform.
        Help judges with scoring criteria, evaluation guidelines, and feedback on submissions.
        Focus on fairness, clarity, and constructive feedback.
        Keep responses under 150 words."""
        
        logger.info(f"[AGENT] Calling Groq API for judge agent")
        chat_completion = groq_client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": system_prompt
                },
                {
                    "role": "user",
                    "content": message
                }
            ],
            model=os.getenv("GROQ_MODEL", "llama-3.1-8b-instant"),
            temperature=0.7,
            max_tokens=500
        )
        
        response_text = chat_completion.choices[0].message.content
        logger.info(f"[AGENT] Groq response received successfully")
        
        return {
            "response": response_text,
            "agent_type": "judge",
            "success": True
        }
    except Exception as e:
        logger.error(f"[AGENT] Error calling Groq API: {str(e)}")
        return {
            "response": f"Error: {str(e)}",
            "agent_type": "judge",
            "success": False,
            "error": str(e)
        }

async def handle_mentor_agent(message: str, context: dict) -> dict:
    """Handle mentor agent requests"""
    logger.info("[AGENT] Mentor agent handling message")
    
    if not groq_client:
        logger.warning("[AGENT] Groq client not available, using fallback response")
        return {
            "response": f"Mentor Agent: I'm here to provide guidance. Your question: '{message}'",
            "agent_type": "mentor",
            "success": True
        }
    
    try:
        system_prompt = """You are a mentor assistant for the HackaVerse hackathon platform.
        Provide guidance on project development, team collaboration, technical challenges, and best practices.
        Be encouraging and supportive while offering practical advice.
        Keep responses under 150 words."""
        
        logger.info(f"[AGENT] Calling Groq API for mentor agent")
        chat_completion = groq_client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": system_prompt
                },
                {
                    "role": "user",
                    "content": message
                }
            ],
            model=os.getenv("GROQ_MODEL", "llama-3.1-8b-instant"),
            temperature=0.7,
            max_tokens=500
        )
        
        response_text = chat_completion.choices[0].message.content
        logger.info(f"[AGENT] Groq response received successfully")
        
        return {
            "response": response_text,
            "agent_type": "mentor",
            "success": True
        }
    except Exception as e:
        logger.error(f"[AGENT] Error calling Groq API: {str(e)}")
        return {
            "response": f"Error: {str(e)}",
            "agent_type": "mentor",
            "success": False,
            "error": str(e)
        }

async def handle_system_agent(message: str, context: dict) -> dict:
    """Handle system agent requests"""
    logger.info("[AGENT] System agent handling message")
    
    if not groq_client:
        logger.warning("[AGENT] Groq client not available, using fallback response")
        return {
            "response": f"System Agent: Processing system request: '{message}'",
            "agent_type": "system",
            "success": True
        }
    
    try:
        system_prompt = """You are a system assistant for the HackaVerse hackathon platform.
        Help with platform features, account management, technical issues, and general inquiries.
        Provide clear and concise information.
        Keep responses under 150 words."""
        
        logger.info(f"[AGENT] Calling Groq API for system agent")
        chat_completion = groq_client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": system_prompt
                },
                {
                    "role": "user",
                    "content": message
                }
            ],
            model=os.getenv("GROQ_MODEL", "llama-3.1-8b-instant"),
            temperature=0.7,
            max_tokens=500
        )
        
        response_text = chat_completion.choices[0].message.content
        logger.info(f"[AGENT] Groq response received successfully")
        
        return {
            "response": response_text,
            "agent_type": "system",
            "success": True
        }
    except Exception as e:
        logger.error(f"[AGENT] Error calling Groq API: {str(e)}")
        return {
            "response": f"Error: {str(e)}",
            "agent_type": "system",
            "success": False,
            "error": str(e)
        }
