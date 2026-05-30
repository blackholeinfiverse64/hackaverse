"""
Storage Service for HackaVerse
Provides explicit and robust storage operations using BHIV bucket connector
"""

import json
import time
import os
import hashlib
from typing import Dict, List, Any, Optional
from src.integrations.bhiv_connectors import save_to_bucket

class StorageService:
    """Handles all storage operations for the hackathon system using BHIV bucket"""
    
    def __init__(self):
        """Initialize storage service"""
        self.transaction_ledger = []  # For ledger chaining of transactions
        self.last_transaction_hash = None  # Hash of the last transaction for chaining
    
    def _calculate_hash(self, data: Dict[str, Any]) -> str:
        """
        Calculate SHA256 hash of transaction data
        
        Args:
            data: Transaction data to hash
            
        Returns:
            SHA256 hash as hex string
        """
        # Create canonical representation of data
        canonical_data = json.dumps(data, sort_keys=True, separators=(',', ':'))
        return hashlib.sha256(canonical_data.encode('utf-8')).hexdigest()
    
    def save_submission(self, team_id: str, submission_data: Dict[str, Any]) -> Dict[str, str]:
        """
        Save a submission to the BHIV bucket
        
        Args:
            team_id: Unique identifier for the team
            submission_data: Dictionary containing submission data
            
        Returns:
            Dictionary with path and filename of saved submission
        """
        timestamp = int(time.time())
        filename = f"submission_{team_id}_{timestamp}.json"
        path = save_to_bucket(submission_data, filename)
        
        # Add transaction to ledger with chaining
        transaction_record = {
            "id": f"txn_{len(self.transaction_ledger) + 1}",
            "timestamp": timestamp,
            "action": "save_submission",
            "team_id": team_id,
            "filename": filename,
            "previous_hash": self.last_transaction_hash
        }
        
        # Calculate hash for this transaction
        transaction_record["hash"] = self._calculate_hash(transaction_record)
        self.last_transaction_hash = transaction_record["hash"]
        self.transaction_ledger.append(transaction_record)
        
        return {"path": path, "filename": filename}
    
    def get_submission(self, team_id: str, timestamp: Optional[int] = None) -> Optional[Dict[str, Any]]:
        """
        Retrieve a submission from the BHIV bucket (placeholder implementation)
        In a real implementation, this would retrieve from the bucket
        For now, we'll check local files for demonstration purposes
        
        Args:
            team_id: Unique identifier for the team
            timestamp: Specific timestamp of submission (if None, gets latest)
            
        Returns:
            Submission data or None if not found
        """
        # This is a simplified implementation for demonstration
        # In a real BHIV implementation, this would retrieve from the bucket service
        bucket_dir = os.getenv("BHIV_BUCKET_DIR", "./data/bucket")
        
        if timestamp:
            filename = f"submission_{team_id}_{timestamp}.json"
            filepath = os.path.join(bucket_dir, filename)
            if os.path.exists(filepath):
                try:
                    with open(filepath, 'r') as f:
                        return json.load(f)
                except Exception:
                    return None
        else:
            # Find the latest submission for this team
            try:
                files = os.listdir(bucket_dir)
                team_files = [f for f in files if f.startswith(f"submission_{team_id}_")]
                if team_files:
                    # Sort by timestamp and get the latest
                    team_files.sort(reverse=True)
                    latest_file = team_files[0]
                    filepath = os.path.join(bucket_dir, latest_file)
                    with open(filepath, 'r') as f:
                        return json.load(f)
            except Exception:
                pass
                
        return None
    
    def list_submissions(self, team_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        List all submissions in the BHIV bucket (placeholder implementation)
        In a real implementation, this would list from the bucket
        For now, we'll check local files for demonstration purposes
        
        Args:
            team_id: Optional team ID to filter submissions
            
        Returns:
            List of submission metadata
        """
        submissions = []
        bucket_dir = os.getenv("BHIV_BUCKET_DIR", "./data/bucket")
        
        try:
            if not os.path.exists(bucket_dir):
                return submissions
                
            files = os.listdir(bucket_dir)
            submission_files = [f for f in files if f.startswith("submission_") and f.endswith(".json")]
            
            for filename in submission_files:
                filepath = os.path.join(bucket_dir, filename)
                try:
                    # Extract team_id and timestamp from filename
                    # Format: submission_{team_id}_{timestamp}.json
                    name_parts = filename.replace("submission_", "").replace(".json", "").split("_")
                    if len(name_parts) >= 2:
                        # Reconstruct team_id (it might contain underscores)
                        file_team_id = "_".join(name_parts[:-1])  # All parts except the last (timestamp)
                        timestamp_str = name_parts[-1]  # Last part is timestamp
                        
                        # Validate timestamp
                        if timestamp_str.isdigit():
                            timestamp = int(timestamp_str)
                            
                            # If filtering by team_id, skip if it doesn't match
                            if team_id and file_team_id != team_id:
                                continue
                            
                            # Read the file to get actual data
                            with open(filepath, 'r') as f:
                                data = json.load(f)
                            
                            submissions.append({
                                "filename": filename,
                                "team_id": file_team_id,
                                "timestamp": timestamp,
                                "path": filepath,
                                "data": data
                            })
                except Exception:
                    # Skip files that don't match the expected format
                    continue
                    
        except Exception:
            pass
            
        # Sort by timestamp (newest first)
        submissions.sort(key=lambda x: x["timestamp"], reverse=True)
        return submissions
    
    def get_transaction_ledger(self) -> List[Dict[str, Any]]:
        """
        Get the transaction ledger with chaining
        
        Returns:
            List of transaction records with hash chaining
        """
        return self.transaction_ledger.copy()
    
    def verify_transaction_ledger_integrity(self) -> bool:
        """
        Verify the integrity of the transaction ledger using hash chaining
        
        Returns:
            True if ledger is valid, False otherwise
        """
        if not self.transaction_ledger:
            return True  # Empty ledger is valid
            
        previous_hash = None
        for transaction in self.transaction_ledger:
            # Verify the hash of the current transaction
            transaction_copy = transaction.copy()
            if "hash" in transaction_copy:
                del transaction_copy["hash"]
                
            calculated_hash = self._calculate_hash(transaction_copy)
            if calculated_hash != transaction["hash"]:
                return False
                
            # Verify the chain (previous_hash should match the hash of the previous transaction)
            if transaction["previous_hash"] != previous_hash:
                return False
                
            previous_hash = transaction["hash"]
            
        return True