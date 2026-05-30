# src/logger.py
# Micro Flow Logging (KSML) utility for HackaVerse
from typing import Dict, Any, Optional
from datetime import datetime
from .bucket_connector import relay_to_bucket
import logging
import os
import json

# Import provenance module
try:
    from .security import create_entry
    from .database import get_db
    PROVENANCE_AVAILABLE = True
except ImportError:
    PROVENANCE_AVAILABLE = False

# Set up module-specific logger
logger = logging.getLogger(__name__)

class KSMLLogger:
    """
    KSML (Karmic System Micro Logging) Logger
    Provides structured logging for all system operations following the KSML format:
    { "intent": "...", "actor": "...", "context": "...", "outcome": "..." }
    """
    
    @staticmethod
    def log_event(
        intent: str,
        actor: str,
        context: str,
        outcome: str,
        additional_data: Optional[Dict[str, Any]] = None,
        timestamp: Optional[str] = None,
        tenant_id: Optional[str] = None,
        event_id: Optional[str] = None,
        workspace_id: Optional[str] = None
    ) -> str:
        """
        Log a structured event following KSML format.
        
        Args:
            intent: What operation is being performed
            actor: Which component is performing the operation
            context: Details about the operation
            outcome: Success/failure status
            additional_data: Optional additional data to include
            timestamp: Optional timestamp (defaults to current time)
            
        Returns:
            Status message from relay_to_bucket
        """
        # Create the log entry
        log_entry = {
            "timestamp": timestamp or datetime.now().isoformat(),
            "intent": intent,
            "actor": actor,
            "context": context,
            "outcome": outcome
        }
        if tenant_id:
            log_entry["tenant_id"] = tenant_id
        if event_id:
            log_entry["event_id"] = event_id
        if workspace_id:
            log_entry["workspace_id"] = workspace_id
        
        # Add additional data if provided
        if additional_data:
            # Convert dict to string to avoid type issues
            log_entry["additional_data"] = json.dumps(additional_data)
            
        # Log to console for debugging
        logger.info(f"KSML Log: {intent} by {actor} - {outcome}")
        
        # Create provenance entry if available
        if PROVENANCE_AVAILABLE:
            try:
                db = get_db()
                payload = {
                    "intent": intent,
                    "context": context,
                    "outcome": outcome
                }
                if additional_data:
                    payload["additional_data"] = additional_data
                if tenant_id:
                    payload["tenant_id"] = tenant_id
                if event_id:
                    payload["event_id"] = event_id
                if workspace_id:
                    payload["workspace_id"] = workspace_id

                provenance_entry = create_entry(db, actor=actor, event=intent, payload=payload, event_id=event_id, outcome=outcome)
                logger.info(f"Provenance entry created: {provenance_entry['entry_hash']}")
            except Exception as e:
                logger.warning(f"Failed to create provenance entry: {e}")
        
        # Relay to bucket
        return relay_to_bucket(log_entry)
    
    @staticmethod
    def log_agent_request(team_id: str, prompt: str, metadata: Dict[str, Any], tenant_id: Optional[str] = None, event_id: Optional[str] = None) -> str:
        """Log an agent request."""
        return KSMLLogger.log_event(
            intent="agent_request",
            actor=f"team_{team_id}",
            context=f"Team {team_id} requested: {prompt}",
            outcome="received",
            additional_data={"metadata": metadata},
            tenant_id=tenant_id,
            event_id=event_id
        )
    
    @staticmethod
    def log_agent_response(team_id: str, response: Dict[str, Any], tenant_id: Optional[str] = None, event_id: Optional[str] = None) -> str:
        """Log an agent response."""
        return KSMLLogger.log_event(
            intent="agent_response",
            actor="system",
            context=f"Response generated for team {team_id}",
            outcome="success",
            additional_data={"response_length": len(str(response))},
            tenant_id=tenant_id,
            event_id=event_id
        )
    
    @staticmethod
    def log_core_communication(team_id: str, payload: Dict[str, Any], response: Dict[str, Any]) -> str:
        """Log core communication."""
        return KSMLLogger.log_event(
            intent="core_communication",
            actor="mcp_router",
            context=f"Communicated with BHIV Core for team {team_id}",
            outcome=response.get("status", "unknown"),
            additional_data={
                "payload_size": len(str(payload)),
                "response_size": len(str(response))
            }
        )
    
    @staticmethod
    def log_reward_calculation(request_id: str, outcome: str, reward_value: float, tenant_id: Optional[str] = None, event_id: Optional[str] = None) -> str:
        """Log reward calculation."""
        return KSMLLogger.log_event(
            intent="reward_calculation",
            actor="reward_system",
            context=f"Calculated reward for request {request_id} with outcome: {outcome}",
            outcome="completed",
            additional_data={"reward_value": reward_value},
            tenant_id=tenant_id,
            event_id=event_id
        )
    
    @staticmethod
    def log_registration(team_name: str, project_title: str, tenant_id: Optional[str] = None, event_id: Optional[str] = None) -> str:
        """Log team registration."""
        return KSMLLogger.log_event(
            intent="registration",
            actor="registration_system",
            context=f"Team {team_name} registered with project: {project_title}",
            outcome="success",
            tenant_id=tenant_id,
            event_id=event_id
        )
    
    @staticmethod
    def log_system_health(status: str) -> str:
        """Log system health check."""
        return KSMLLogger.log_event(
            intent="health_check",
            actor="system",
            context=f"System health check performed",
            outcome=status
        )

# Create a global instance for convenience
ksml_logger = KSMLLogger()