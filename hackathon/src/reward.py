# src/reward.py
import logging
import time
import json
from typing import Tuple, Optional
from src.integrations.bhiv_connectors import send_to_core, save_to_bucket

logger = logging.getLogger(__name__)

class RewardSystem:
    def calculate_reward(self, action: str, outcome: Optional[str] = None, tenant_id: Optional[str] = None, event_id: Optional[str] = None) -> Tuple[float, str]:
        """
        Calculate reward for an action and optional outcome.
        Returns a tuple of (reward: float, feedback: str).
        """
        logger.info(f"Calculating reward for action: {action}, outcome: {outcome}")
        
        # Handle None or empty input
        if not action or action.strip() == "":
            logger.warning("Empty or invalid action provided")
            return 0.0, "No action provided"

        # Backward compatibility: If used in /agent or /multi-agent, treat action as result
        if outcome is None:
            # Original logic: Split by pipe and count non-empty steps
            steps = action.split("|")
            steps = [step for step in steps if step]
            reward = len(steps)
            feedback = f"Reward based on {len(steps)} executed step(s)"
        else:
            # New logic for /reward endpoint: Incorporate outcome
            steps = action.split("|")
            steps = [step for step in steps if step]
            reward = len(steps)
            # Adjust reward based on outcome (example logic)
            if outcome and "success" in outcome.lower():
                reward *= 1.5  # Boost for successful outcome
                feedback = f"Success: {len(steps)} step(s) with positive outcome"
            elif outcome and "fail" in outcome.lower():
                reward *= 0.5  # Penalty for failure
                feedback = f"Failure: {len(steps)} step(s) with negative outcome"
            else:
                feedback = f"Neutral: {len(steps)} step(s) processed"

        # Prepare payload for BHIV integration
        payload = {
            "action": action,
            "outcome": outcome,
            "reward": reward,
            "feedback": feedback,
            "timestamp": time.time(),
            "steps_count": len(steps),
            "tenant_id": tenant_id,
            "event_id": event_id
        }
        
        # Send to BHIV Core and save to BHIV Bucket
        try:
            core_resp = send_to_core(payload)
            logger.info(f"Sent reward data to BHIV Core: {core_resp}")
        except Exception as e:
            logger.warning(f"Failed to send reward data to BHIV Core: {str(e)}")
        
        try:
            filename = f"reward_{int(time.time())}.json"
            bucket_path = save_to_bucket(payload, filename)
            logger.info(f"Saved reward data to BHIV Bucket: {bucket_path}")
        except Exception as e:
            logger.warning(f"Failed to save reward data to BHIV Bucket: {str(e)}")

        logger.info(f"Reward calculated: {reward}, Feedback: {feedback}")
        return float(reward), feedback