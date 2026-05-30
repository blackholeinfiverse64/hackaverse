#!/usr/bin/env python3
"""
Logging configuration module to ensure Uvicorn access logs work
"""

import logging
import sys

def configure_uvicorn_logging():
    """Configure logging to ensure Uvicorn access logs appear"""
    
    # Configure basic logging but don't force reconfigure
    # This allows Uvicorn to set up its own loggers first
    if not logging.getLogger().handlers:
        logging.basicConfig(
            level=logging.INFO,
            format="%(levelname)s:%(name)s:%(message)s",
            stream=sys.stdout
        )
    
    # Ensure uvicorn loggers are properly configured
    uvicorn_loggers = [
        "uvicorn",
        "uvicorn.access", 
        "uvicorn.error"
    ]
    
    for logger_name in uvicorn_loggers:
        logger = logging.getLogger(logger_name)
        logger.setLevel(logging.INFO)
        logger.disabled = False
        logger.propagate = True
    
    logging.getLogger(__name__).info("Uvicorn logging configured successfully")
    return True