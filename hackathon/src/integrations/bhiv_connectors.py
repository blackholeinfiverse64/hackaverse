# src/integrations/bhiv_connectors.py
"""
BHIV Connectors - Handles communication with BHIV Core and Bucket services
"""

import json
import os
import time
import logging
import requests
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)


def send_to_core(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Send data to BHIV Core service for processing.
    
    Args:
        payload: Dictionary containing data to send to BHIV Core
        
    Returns:
        Response from BHIV Core or error status
    """
    try:
        bhiv_core_url = os.getenv("BHIV_CORE_URL", "http://localhost:8002/reason")
        
        logger.info(f"Sending payload to BHIV Core: {bhiv_core_url}")
        
        # Make request to BHIV Core
        response = requests.post(
            bhiv_core_url,
            json=payload,
            timeout=10
        )
        
        if response.status_code == 200:
            logger.info(f"BHIV Core response: {response.json()}")
            return response.json()
        else:
            logger.warning(f"BHIV Core returned status {response.status_code}: {response.text}")
            return {
                "status": "error",
                "message": f"BHIV Core returned status {response.status_code}",
                "code": response.status_code
            }
            
    except requests.exceptions.ConnectionError:
        logger.warning(f"Failed to connect to BHIV Core at {os.getenv('BHIV_CORE_URL', 'http://localhost:8002/reason')}")
        return {
            "status": "error",
            "message": "Failed to connect to BHIV Core",
            "type": "connection_error"
        }
    except requests.exceptions.Timeout:
        logger.warning("BHIV Core request timed out")
        return {
            "status": "error",
            "message": "BHIV Core request timed out",
            "type": "timeout"
        }
    except Exception as e:
        logger.error(f"Error sending to BHIV Core: {str(e)}")
        return {
            "status": "error",
            "message": str(e),
            "type": "unknown_error"
        }


def save_to_bucket(data: Dict[str, Any], filename: str) -> str:
    """
    Save data to BHIV bucket storage.
    
    Args:
        data: Dictionary containing the data to save
        filename: Name of the file to save
        
    Returns:
        Path to the saved file
        
    Raises:
        Exception: If save operation fails
    """
    try:
        bucket_dir = os.getenv("BHIV_BUCKET_DIR", "./data/bucket")
        
        # Ensure bucket directory exists
        if not os.path.exists(bucket_dir):
            os.makedirs(bucket_dir, exist_ok=True)
            logger.info(f"Created bucket directory: {bucket_dir}")
        
        filepath = os.path.join(bucket_dir, filename)
        
        # Write data to file
        with open(filepath, 'w') as f:
            json.dump(data, f, indent=2, default=str)
        
        logger.info(f"Saved data to bucket: {filepath}")
        return filepath
        
    except Exception as e:
        logger.error(f"Failed to save to bucket: {str(e)}")
        raise Exception(f"Failed to save to bucket: {str(e)}")


def relay_to_bucket(data: Dict[str, Any], bucket_type: str = "logs") -> Dict[str, Any]:
    """
    Relay data to BHIV bucket storage with automatic filename generation.
    
    Args:
        data: Dictionary containing the data to relay
        bucket_type: Type of bucket (logs, submissions, rewards, etc.)
        
    Returns:
        Dictionary with status and result information
    """
    try:
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
        
        logger.info(f"Relayed data to bucket: {filepath}")
        
        return {
            "status": "success",
            "filename": filename,
            "path": filepath,
            "timestamp": timestamp
        }
        
    except Exception as e:
        logger.error(f"Failed to relay to bucket: {str(e)}")
        return {
            "status": "error",
            "message": str(e),
            "timestamp": int(time.time())
        }
