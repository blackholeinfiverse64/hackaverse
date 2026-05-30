# rl_engine.py
"""
Production-level RL engine for agents.
Supports epsilon-greedy exploration, Q-value updates, and persistent storage.
"""

import os
import json
import logging
import numpy as np
from typing import Any, Dict, List, Optional, Tuple
from datetime import datetime
from pathlib import Path

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data" / "rl_data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

class RLEngine:
    """Reinforcement Learning Engine for adaptive agents."""
    
    def __init__(self, agent_name: str, epsilon: float = 0.1, alpha: float = 0.1, gamma: float = 0.99):
        """
        Initialize RL engine.
        - epsilon: Exploration rate (0-1).
        - alpha: Learning rate for Q-updates.
        - gamma: Discount factor for future rewards.
        """
        self.agent_name = agent_name
        self.epsilon = max(0.0, min(1.0, epsilon))  # Validate epsilon
        self.alpha = alpha
        self.gamma = gamma
        self.q_table: Dict[str, Dict[str, float]] = {}  # state -> action -> Q-value
        self.actions: List[str] = []  # List of possible actions (e.g., suggestion IDs)
        self._load_q_table()
        logger.info(f"RL Engine initialized for {agent_name} with epsilon={self.epsilon}")

    def _load_q_table(self) -> None:
        """Load Q-table from JSON file."""
        file_path = DATA_DIR / f"{self.agent_name}_q_table.json"
        try:
            if file_path.exists():
                with open(file_path, 'r', encoding='utf-8') as f:
                    self.q_table = json.load(f)
                self.actions = list(set(action for state in self.q_table for action in self.q_table[state]))
                logger.info(f"Loaded Q-table for {self.agent_name} with {len(self.q_table)} states")
        except Exception as e:
            logger.error(f"Failed to load Q-table: {e}")
            self.q_table = {}

    def _save_q_table(self) -> None:
        """Save Q-table to JSON file."""
        file_path = DATA_DIR / f"{self.agent_name}_q_table.json"
        try:
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(self.q_table, f, indent=4)
            logger.info(f"Saved Q-table for {self.agent_name}")
        except Exception as e:
            logger.error(f"Failed to save Q-table: {e}")

    def register_actions(self, actions: List[str]) -> None:
        """Register possible actions (e.g., suggestion IDs)."""
        self.actions = actions
        for state in self.q_table:
            for action in actions:
                if action not in self.q_table[state]:
                    self.q_table[state][action] = 0.0
        self._save_q_table()

    def get_state(self, context: Dict[str, Any]) -> str:
        """Convert context to a state string (customizable per agent)."""
        # Example: Hash user input + progress metrics
        return json.dumps(context, sort_keys=True)  # Simple JSON hash for state

    def choose_action(self, state: str) -> str:
        """Epsilon-greedy action selection."""
        if state not in self.q_table:
            self.q_table[state] = {action: 0.0 for action in self.actions}
            self._save_q_table()
        
        if np.random.rand() < self.epsilon:
            action = np.random.choice(self.actions)  # Explore
            logger.debug(f"Exploration: Selected {action}")
        else:
            q_values = self.q_table[state]
            action = max(q_values, key=q_values.get)  # Exploit
            logger.debug(f"Exploitation: Selected {action} with Q={q_values[action]}")
        return action

    def update_q_value(self, state: str, action: str, reward: float, next_state: Optional[str] = None) -> None:
        """Update Q-value using Q-learning formula."""
        if state not in self.q_table:
            # Initialize unseen state with default Q-values
            self.q_table[state] = {a: 0.0 for a in self.actions}
        if action not in self.q_table[state]:
            self.q_table[state][action] = 0.0
        
        current_q = self.q_table[state][action]
        max_next_q = 0.0
        if next_state and next_state in self.q_table:
            max_next_q = max(self.q_table[next_state].values())
        
        new_q = current_q + self.alpha * (reward + self.gamma * max_next_q - current_q)
        self.q_table[state][action] = new_q
        self._save_q_table()
        logger.info(f"Updated Q for {state}/{action}: {current_q} -> {new_q} (reward={reward})")

    def log_interaction(self, state: str, action: str, reward: float) -> None:
        """Log RL interaction for auditing."""
        log_path = DATA_DIR / f"{self.agent_name}_interactions.log"
        with open(log_path, 'a', encoding='utf-8') as f:
            f.write(f"{datetime.now().isoformat()} | State: {state} | Action: {action} | Reward: {reward}\n")