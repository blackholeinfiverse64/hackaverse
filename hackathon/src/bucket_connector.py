# src/bucket_connector.py
"""
Bucket Connector - Handles relaying data to BHIV bucket storage
"""

import json
import os
import time
from typing import Dict, Any, Optional


def relay_to_bucket(data: Dict[str, Any], bucket_type: str = "logs") -> Dict[str, Any]:
    """
    Relay data to the BHIV bucket storage system.
    
    Args:
        data: Dictionary containing the data to relay
        bucket_type: Type of bucket (logs, submissions, rewards, etc.)
        
    Returns:
        Dictionary with status and result information
    """
    try:
        # Get bucket directory from environment or use default
        bucket_dir = os.getenv("BHIV_BUCKET_DIR", "./data/bucket")
        
        # Ensure bucket directory exists
        if not os.path.exists(bucket_dir):
            os.makedirs(bucket_dir, exist_ok=True)
        
        # Generate filename based on bucket type and timestamp
        timestamp = int(time.time())
        filename = f"{bucket_type}_{timestamp}.json"
        filepath = os.path.join(bucket_dir, filename)
        
        # Write data to bucket
        with open(filepath, 'w') as f:
            json.dump(data, f, indent=2, default=str)
        
        return {
            "status": "success",
            "filename": filename,
            "path": filepath,
            "timestamp": timestamp
        }
        
    except Exception as e:
        return {
            "status": "error",
            "message": str(e),
            "timestamp": int(time.time())
        }


def save_to_bucket(data: Dict[str, Any], filename: str) -> str:
    """
    Save data to bucket with a specific filename.
    
    Args:
        data: Dictionary containing the data to save
        filename: Name of the file to save
        
    Returns:
        Path to the saved file
    """
    try:
        bucket_dir = os.getenv("BHIV_BUCKET_DIR", "./data/bucket")
        
        if not os.path.exists(bucket_dir):
            os.makedirs(bucket_dir, exist_ok=True)
        
        filepath = os.path.join(bucket_dir, filename)
        
        with open(filepath, 'w') as f:
            json.dump(data, f, indent=2, default=str)
        
        return filepath
        
    except Exception as e:
        raise Exception(f"Failed to save to bucket: {str(e)}")
