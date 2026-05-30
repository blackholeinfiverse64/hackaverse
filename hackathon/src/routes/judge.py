# src/routes/judge.py
from fastapi import APIRouter, Depends, HTTPException
from ..models import JudgeRequest, JudgeResponse, BatchJudgeRequest, BatchSubmissionItem
from ..judging.multi_agent_judge import MultiAgentJudge, evaluate_submission_multi_agent
from ..judging.consensus import aggregate_consensus
from ..logger import ksml_logger
from ..auth import get_api_key
from ..schemas.response import APIResponse
from .webhooks import dispatch_event
from ..database import get_db
from ..security import create_entry, compute_payload_hash
from ..reward import RewardSystem
from ..replay_protection import check_replay
from typing import Dict, Any, Tuple
import logging
import hashlib
import time


# Initialize reward system for orchestration
reward_system = RewardSystem()


def orchestrate_submission_flow(
    submission_text: str,
    team_id: str,
    tenant_id: str,
    event_id: str,
    workspace_id: str,
    submission_hash: str,
    db
) -> Tuple[Dict[str, Any], Dict[str, Any], Dict[str, Any]]:
    """
    Orchestrate the complete submission flow: judge → reward → logs.
    
    This function controls the hackathon flow internally without external tools.
    
    Args:
        submission_text: The submission content
        team_id: Team identifier
        tenant_id: Tenant identifier for isolation
        event_id: Event identifier for isolation
        workspace_id: Workspace identifier
        submission_hash: Hash of the submission
        db: Database connection
        
    Returns:
        Tuple of (judging_result, reward_result, log_result)
    """
    actor = f"team_{team_id}" if team_id else "anonymous"
    flow_results = {
        "judging": {"success": False, "data": None, "error": None},
        "reward": {"success": False, "data": None, "error": None},
        "logging": {"success": False, "data": None, "error": None}
    }
    
    # Step 1: Judge the submission
    try:
        logger.info(f"[Orchestration] Step 1: Judging submission for {actor}")
        judging_result = evaluate_submission_multi_agent({
            "submission_text": submission_text,
            "team_id": team_id,
            "tenant_id": tenant_id,
            "event_id": event_id
        })
        flow_results["judging"] = {"success": True, "data": judging_result, "error": None}
        logger.info(f"[Orchestration] Judging completed - Score: {judging_result.get('consensus_score')}")
    except Exception as e:
        logger.error(f"[Orchestration] Judging failed: {str(e)}")
        flow_results["judging"] = {"success": False, "data": None, "error": str(e)}
        # Return early if judging fails - reward depends on judging outcome
        return flow_results["judging"], flow_results["reward"], flow_results["logging"]
    
    # Step 2: Calculate reward based on judging outcome
    try:
        logger.info(f"[Orchestration] Step 2: Calculating reward for {actor}")
        
        # Determine outcome based on score
        score = judging_result.get("consensus_score", 0)
        if score >= 70:
            outcome = "success"
        elif score >= 50:
            outcome = "partial_success"
        else:
            outcome = "needs_improvement"
        
        # Calculate reward
        reward_value, feedback = reward_system.calculate_reward(
            action=f"submission_judged_{submission_hash[:8]}",
            outcome=outcome,
            tenant_id=tenant_id,
            event_id=event_id
        )
        
        flow_results["reward"] = {
            "success": True,
            "data": {
                "reward_value": reward_value,
                "feedback": feedback,
                "outcome": outcome,
                "score": score
            },
            "error": None
        }
        logger.info(f"[Orchestration] Reward calculated - Value: {reward_value}, Outcome: {outcome}")
        
        # Log reward calculation
        ksml_logger.log_event(
            intent="reward_calculation",
            actor="orchestrator",
            context=f"Reward calculated for submission {submission_hash}",
            outcome="success",
            additional_data={
                "reward_value": reward_value,
                "outcome": outcome,
                "score": score
            },
            tenant_id=tenant_id,
            event_id=event_id,
            workspace_id=workspace_id
        )
        
    except Exception as e:
        logger.error(f"[Orchestration] Reward calculation failed: {str(e)}")
        flow_results["reward"] = {"success": False, "data": None, "error": str(e)}
        # Continue to logging even if reward fails
    
    # Step 3: Log the complete flow
    try:
        logger.info(f"[Orchestration] Step 3: Logging complete flow for {actor}")
        
        log_data = {
            "submission_hash": submission_hash,
            "team_id": team_id,
            "judging_score": judging_result.get("consensus_score"),
            "judging_confidence": judging_result.get("confidence"),
            "reward_value": flow_results["reward"]["data"]["reward_value"] if flow_results["reward"]["success"] else None,
            "reward_outcome": flow_results["reward"]["data"]["outcome"] if flow_results["reward"]["success"] else None,
            "flow_completed": True
        }
        
        # Log via KSML
        ksml_logger.log_event(
            intent="submission_flow_complete",
            actor=actor,
            context=f"Complete submission flow executed for {submission_hash}",
            outcome="success" if flow_results["judging"]["success"] else "partial",
            additional_data=log_data,
            tenant_id=tenant_id,
            event_id=event_id,
            workspace_id=workspace_id
        )
        
        # Create provenance entry for the complete flow
        create_entry(
            db,
            actor=actor,
            event="submission_flow_complete",
            payload=log_data,
            event_id=event_id,
            outcome="success" if flow_results["judging"]["success"] else "partial"
        )
        
        flow_results["logging"] = {"success": True, "data": log_data, "error": None}
        logger.info(f"[Orchestration] Flow logging completed")
        
    except Exception as e:
        logger.error(f"[Orchestration] Logging failed: {str(e)}")
        flow_results["logging"] = {"success": False, "data": None, "error": str(e)}
    
    return flow_results["judging"], flow_results["reward"], flow_results["logging"]

# Set up logging
logger = logging.getLogger(__name__)

# Define the judge router
router = APIRouter(prefix="/judge", tags=["judge"])

# Initialize the multi-agent judging engine
multi_agent_judge = MultiAgentJudge()

@router.post("/score", response_model=JudgeResponse, summary="Scores a single submission", dependencies=[Depends(get_api_key)])
async def score_submission(request: JudgeRequest):
    """
    Scores a single submission using the Multi-Agent AI Judging Engine.
    
    - **submission_text**: The text to evaluate
    - **team_id**: Optional team ID for tracking
    """
    logger.info(f"Score submission endpoint called for team {request.team_id}")
    
    # Log the judging request using KSML
    ksml_logger.log_event(
        intent="judging_request",
        actor=f"team_{request.team_id}" if request.team_id else "anonymous",
        context=f"Multi-agent judging request received for submission of length {len(request.submission_text)}",
        outcome="received",
        tenant_id=request.tenant_id,
        event_id=request.event_id,
        workspace_id=request.workspace_id
    )
    
    # Evaluate the submission using multi-agent system
    evaluation_result = evaluate_submission_multi_agent({
        "submission_text": request.submission_text,
        "team_id": request.team_id,
        "tenant_id": request.tenant_id,
        "event_id": request.event_id
    })
    
    # Extract consensus scores for the response
    consensus_scores = evaluation_result["criteria_scores"]
    
    # Log the judging response
    ksml_logger.log_event(
        intent="judging_response",
        actor="multi_agent_judging_engine",
        context=f"Multi-agent judging completed for team {request.team_id}",
        outcome="success",
        additional_data={"consensus_score": evaluation_result["consensus_score"]},
        tenant_id=request.tenant_id,
        event_id=request.event_id,
        workspace_id=request.workspace_id
    )
    
    # Ensure confidence is always present and normalized to 0.0-1.0
    raw_confidence = evaluation_result.get("confidence")
    if raw_confidence is None:
        normalized_confidence = 0.5  # Default middle confidence
    else:
        # Normalize to 0.0-1.0 range
        try:
            normalized_confidence = float(raw_confidence)
            # Clamp to valid range [0.0, 1.0]
            normalized_confidence = max(0.0, min(1.0, normalized_confidence))
        except (ValueError, TypeError):
            normalized_confidence = 0.5

    # Ensure reasoning is always present and is a readable string
    raw_reasoning = evaluation_result.get("reasoning_chain")
    if raw_reasoning is None or not isinstance(raw_reasoning, str) or len(raw_reasoning.strip()) == 0:
        safe_reasoning = "Evaluation completed. No detailed reasoning available."
    else:
        safe_reasoning = raw_reasoning

    # Return the structured response with guaranteed confidence and reasoning
    return JudgeResponse(
        clarity=consensus_scores.get("clarity", 0),
        quality=consensus_scores.get("tech_depth", 0),  # tech_depth maps to quality
        innovation=consensus_scores.get("innovation", 0),
        total_score=evaluation_result["consensus_score"],
        confidence=round(normalized_confidence, 2),
        trace=safe_reasoning,
        team_id=request.team_id,
        fallback=evaluation_result.get("fallback")
    )

@router.post("/submit", response_model=Dict[str, Any], summary="Saves and scores a submission", dependencies=[Depends(get_api_key)])
async def submit_and_score(request: JudgeRequest):
    """
    Saves and scores a submission using the Multi-Agent AI Judging Engine.

    - **submission_text**: The text to evaluate
    - **team_id**: Optional team ID for tracking
    - **request_id**: Optional request ID for replay protection
    """
    try:
        logger.info(f"Submit and score endpoint called for team {request.team_id}")

        # Compute submission hash (don't assign to request object)
        submission_hash = hashlib.sha256(request.submission_text.encode('utf-8')).hexdigest()
        
        # Use provided request_id or fall back to submission_hash for replay protection
        replay_id = request.request_id if request.request_id else submission_hash
        
        # Check for replay (scoped by tenant_id + event_id)
        is_new, error_message = check_replay(
            request_id=replay_id,
            tenant_id=request.tenant_id or "default",
            event_id=request.event_id or "default_event"
        )
        
        if not is_new:
            logger.warning(f"Replay detected for request_id '{replay_id}' (tenant: {request.tenant_id}, event: {request.event_id})")
            raise HTTPException(
                status_code=409,
                detail={
                    "success": False,
                    "message": error_message,
                    "data": {"request_id": replay_id}
                }
            )

        # Get database connection
        db = get_db()

        # Check if submission already exists
        existing_submission = db.submissions.find_one({"submission_hash": submission_hash})
        if existing_submission:
            logger.info(f"Submission already exists with hash {submission_hash}")
        else:
            # Save submission to database
            submission_doc = {
                "submission_text": request.submission_text,
                "team_id": request.team_id,
                "submission_hash": submission_hash,
                "tenant_id": request.tenant_id,
                "event_id": request.event_id,
                "workspace_id": request.workspace_id,
                "timestamp": int(time.time())
            }
            db.submissions.insert_one(submission_doc)
            logger.info(f"Submission saved for team {request.team_id} with hash {submission_hash}")

        # Log the submission using KSML and create provenance
        ksml_logger.log_event(
            intent="submission_save",
            actor=f"team_{request.team_id}" if request.team_id else "anonymous",
            context=f"Submission saved with hash {submission_hash}",
            outcome="success",
            tenant_id=request.tenant_id,
            event_id=request.event_id,
            workspace_id=request.workspace_id
        )

        # Create provenance entry for submission
        create_entry(
            db,
            actor=f"team_{request.team_id}" if request.team_id else "anonymous",
            event="submission_save",
            payload={
                "submission_hash": submission_hash,
                "team_id": request.team_id,
                "tenant_id": request.tenant_id,
                "event_id": request.event_id,
                "workspace_id": request.workspace_id
            },
            event_id=request.event_id,
            outcome="success"
        )

        # Execute the complete submission flow using backend orchestration
        judging_flow, reward_flow, logging_flow = orchestrate_submission_flow(
            submission_text=request.submission_text,
            team_id=request.team_id,
            tenant_id=request.tenant_id,
            event_id=request.event_id,
            workspace_id=request.workspace_id,
            submission_hash=submission_hash,
            db=db
        )
        
        # Use the judging result from the orchestrated flow
        evaluation_result = judging_flow.get("data") if judging_flow.get("success") else {
            "consensus_score": 0,
            "criteria_scores": {"clarity": 0, "tech_depth": 0, "innovation": 0},
            "confidence": 0.5,
            "reasoning_chain": "Judging failed during orchestration",
            "fallback": True
        }

        # Extract consensus scores for the response
        consensus_scores = evaluation_result["criteria_scores"]

        # Determine version for judgment
        existing_judgment = db.judgments.find_one(
            {"submission_hash": submission_hash},
            sort=[("version", -1)]
        )
        version = (existing_judgment["version"] + 1) if existing_judgment else 1

        # Ensure confidence is always present and normalized to 0.0-1.0 for database storage
        raw_confidence = evaluation_result.get("confidence")
        if raw_confidence is None:
            normalized_confidence = 0.5
        else:
            try:
                normalized_confidence = float(raw_confidence)
                normalized_confidence = max(0.0, min(1.0, normalized_confidence))
            except (ValueError, TypeError):
                normalized_confidence = 0.5

        # Save judgment to database
        judgment_doc = {
            "submission_hash": submission_hash,
            "team_id": request.team_id,
            "clarity": consensus_scores.get("clarity", 0),
            "quality": consensus_scores.get("tech_depth", 0),
            "innovation": consensus_scores.get("innovation", 0),
            "total_score": evaluation_result["consensus_score"],
            "confidence": round(normalized_confidence, 2),
            "trace": evaluation_result["reasoning_chain"],
            "version": version,
            "tenant_id": request.tenant_id,
            "event_id": request.event_id,
            "workspace_id": request.workspace_id,
            "timestamp": int(time.time())
        }
        if evaluation_result.get("fallback"):
            judgment_doc["fallback"] = True
        db.judgments.insert_one(judgment_doc)
        logger.info(f"Judgment saved for submission {submission_hash}, version {version}")

        # Log the judging response
        ksml_logger.log_event(
            intent="judgment_save",
            actor="multi_agent_judging_engine",
            context=f"Judgment saved for submission {submission_hash}, version {version}",
            outcome="success",
            additional_data={"consensus_score": evaluation_result["consensus_score"], "version": version},
            tenant_id=request.tenant_id,
            event_id=request.event_id,
            workspace_id=request.workspace_id
        )

        # Create provenance entry for judgment
        create_entry(
            db,
            actor="multi_agent_judging_engine",
            event="judgment_save",
            payload={
                "submission_hash": submission_hash,
                "version": version,
                "total_score": evaluation_result["consensus_score"],
                "team_id": request.team_id,
                "tenant_id": request.tenant_id,
                "event_id": request.event_id,
                "workspace_id": request.workspace_id
            },
            event_id=request.event_id,
            outcome="success"
        )

        # Ensure confidence is always present and normalized for API response
        response_confidence = round(normalized_confidence, 2)

        # Ensure reasoning is always present and is a readable string
        raw_reasoning = evaluation_result.get("reasoning_chain")
        if raw_reasoning is None or not isinstance(raw_reasoning, str) or len(raw_reasoning.strip()) == 0:
            safe_reasoning = "Evaluation completed. No detailed reasoning available."
        else:
            safe_reasoning = raw_reasoning

        # Build a clean response with ONLY the judging_result
        response_data = {
            "submission_hash": submission_hash,
            "team_id": request.team_id,
            "judging_result": {
                "individual_scores": evaluation_result.get("individual_scores", {}),
                "consensus_score": evaluation_result.get("consensus_score", 0),
                "criteria_scores": consensus_scores,
                "reasoning_chain": safe_reasoning,
                "confidence": response_confidence,
                "version": version,
                **({"fallback": True} if evaluation_result.get("fallback") else {})
            }
        }
        
        # Log orchestration results internally
        logger.info(
            f"[Orchestration] Flow completed: judging={judging_flow.get('success')}, "
            f"reward={reward_flow.get('success')}, logging={logging_flow.get('success')}"
        )
        
        # Return clean response with only judging_result
        response = APIResponse(
            success=True,
            message="Submission judged successfully",
            data=response_data
        )

        # ── TANTRA EXECUTION CHAIN: Emit observable event ──
        # Submission → AI Evaluation → Provenance → Webhook Event
        try:
            await dispatch_event("submission.scored", {
                "submission_hash": submission_hash,
                "team_id": request.team_id,
                "total_score": evaluation_result.get("consensus_score", 0),
                "confidence": response_confidence,
                "version": version,
                "trace_id": response.trace_id,
            })
        except Exception as evt_err:
            logger.warning(f"[WEBHOOK] Event dispatch failed (non-blocking): {evt_err}")

        return response.model_dump()
        
    except Exception as e:
        logger.error(f"Error in submit_and_score endpoint: {str(e)}")
        return APIResponse(
            success=False,
            message=f"Internal server error: {str(e)}",
            data=None
        ).model_dump()

@router.get("/queue", response_model=Dict[str, Any], summary="Get judge queue", dependencies=[Depends(get_api_key)])
async def get_judge_queue(
    tenant_id: str = "default",
    event_id: str = "default_event"
):
    """
    Get submissions pending review in judge queue.
    """
    logger.info(f"Judge queue endpoint called for tenant={tenant_id}, event={event_id}")
    
    db = get_db()
    submissions = []
    
    if db is not None:
        cursor = db.submissions.find(
            {"tenant_id": tenant_id, "event_id": event_id}
        ).sort("timestamp", -1).limit(50)
        
        for sub in cursor:
            submissions.append({
                "submission_id": str(sub.get("_id")),
                "team_id": sub.get("team_id", "unknown"),
                "submission_hash": sub.get("submission_hash"),
                "timestamp": sub.get("timestamp")
            })
    
    return APIResponse(
        success=True,
        message=f"Retrieved {len(submissions)} submissions",
        data=submissions
    ).model_dump()

@router.get("/scores", response_model=Dict[str, Any], summary="Get judge scores", dependencies=[Depends(get_api_key)])
async def get_judge_scores(
    tenant_id: str = "default",
    event_id: str = "default_event",
    limit: int = 50
):
    """
    Get judged scores for submissions.
    """
    logger.info(f"Judge scores endpoint called for tenant={tenant_id}, event={event_id}")
    
    limit = min(limit, 100)
    db = get_db()
    scores = []
    
    if db is not None:
        cursor = db.judgments.find(
            {"tenant_id": tenant_id, "event_id": event_id}
        ).sort("total_score", -1).limit(limit)
        
        for judgment in cursor:
            scores.append({
                "team_id": judgment.get("team_id", "unknown"),
                "total_score": judgment.get("total_score", 0),
                "clarity": judgment.get("clarity", 0),
                "quality": judgment.get("quality", 0),
                "innovation": judgment.get("innovation", 0),
                "confidence": judgment.get("confidence", 0.5),
                "timestamp": judgment.get("timestamp")
            })
    
    return APIResponse(
        success=True,
        message=f"Retrieved {len(scores)} scores",
        data=scores
    ).model_dump()

@router.get("/rubric", response_model=Dict[str, Any], summary="Returns judging criteria", dependencies=[Depends(get_api_key)])
async def get_rubric():
    """
    Returns the judging criteria used by the Multi-Agent AI Judging Engine.
    """
    logger.info("Rubric endpoint called")
    
    # Import the rubric from the new rubric module
    from ..judging.rubric import CRITERIA, WEIGHTS, TOTAL_POSSIBLE_SCORE
    
    # Return the rubric
    rubric_data = {
        "criteria": CRITERIA,
        "weights": WEIGHTS,
        "total_possible_score": TOTAL_POSSIBLE_SCORE
    }
    
    return APIResponse(
        success=True,
        message="Multi-agent judging criteria retrieved successfully",
        data=rubric_data
    ).model_dump()


@router.post("/batch", response_model=Dict[str, Any], summary="Judge multiple submissions in batch", dependencies=[Depends(get_api_key)])
async def batch_judge(request: BatchJudgeRequest):
    """
    Judge multiple submissions in batch and return ranked results.
    
    - **submissions**: List of submission items to judge
    - **tenant_id**: Optional tenant ID for isolation
    - **event_id**: Optional event ID for isolation
    
    Returns judged results with deterministic rank assignment (1 = best score).
    """
    logger.info(f"Batch judge endpoint called for {len(request.submissions)} submissions")
    
    # Check for replay protection on batch level (optional, using a hash of all request_ids)
    batch_request_id = hashlib.sha256(
        "".join(sorted([s.request_id or "" for s in request.submissions])).encode()
    ).hexdigest()[:16]
    
    is_new, error_message = check_replay(
        request_id=f"batch_{batch_request_id}",
        tenant_id=request.tenant_id or "default",
        event_id=request.event_id or "default_event"
    )
    
    if not is_new:
        logger.warning(f"Replay detected for batch request (tenant: {request.tenant_id}, event: {request.event_id})")
        raise HTTPException(
            status_code=409,
            detail={
                "success": False,
                "message": "Duplicate batch request detected",
                "data": None
            }
        )
    
    # Prepare submissions for batch evaluation
    submissions_data = []
    for item in request.submissions:
        submissions_data.append({
            "submission_text": item.submission_text,
            "team_id": item.team_id,
            "tenant_id": request.tenant_id,
            "event_id": request.event_id
        })
    
    # Evaluate batch using the existing function
    from ..judging.multi_agent_judge import evaluate_batch_submissions
    batch_results = evaluate_batch_submissions(submissions_data)
    
    # Log the batch judging
    ksml_logger.log_event(
        intent="batch_judging",
        actor="batch_judging_engine",
        context=f"Batch judged {len(submissions_data)} submissions",
        outcome="success",
        additional_data={
            "submission_count": len(submissions_data),
            "top_score": batch_results[0].get("consensus_score") if batch_results else None
        },
        tenant_id=request.tenant_id,
        event_id=request.event_id,
        workspace_id=request.workspace_id
    )
    
    return APIResponse(
        success=True,
        message=f"Batch judging completed for {len(batch_results)} submissions",
        data={
            "results": batch_results,
            "total_count": len(batch_results),
            "tenant_id": request.tenant_id,
            "event_id": request.event_id
        }
    ).model_dump()


@router.get("/rank", response_model=Dict[str, Any], summary="Get ranked leaderboard", dependencies=[Depends(get_api_key)])
async def get_rankings(
    tenant_id: str = "default",
    event_id: str = "default_event",
    limit: int = 50
):
    """
    Get ranked leaderboard for a tenant/event.
    
    - **tenant_id**: Tenant identifier (default: "default")
    - **event_id**: Event identifier (default: "default_event")
    - **limit**: Maximum number of results to return (default: 50, max: 100)
    
    Returns ranked list sorted by total_score descending.
    """
    logger.info(f"Rankings endpoint called for tenant={tenant_id}, event={event_id}")
    
    # Limit max results
    limit = min(limit, 100)
    
    # Get database connection
    db = get_db()
    
    # Query judgments for this tenant/event
    judgments_cursor = db.judgments.find(
        {"tenant_id": tenant_id, "event_id": event_id}
    ).sort("total_score", -1).limit(limit)
    
    judgments = list(judgments_cursor)
    
    # Build ranked results
    rankings = []
    for rank, judgment in enumerate(judgments, start=1):
        rankings.append({
            "team_id": judgment.get("team_id", "unknown"),
            "rank": rank,
            "total_score": judgment.get("total_score", 0),
            "clarity": judgment.get("clarity", 0),
            "quality": judgment.get("quality", 0),
            "innovation": judgment.get("innovation", 0),
            "confidence": judgment.get("confidence", 0.5)
        })
    
    return APIResponse(
        success=True,
        message=f"Rankings retrieved for {len(rankings)} teams",
        data={
            "rankings": rankings,
            "total_count": len(rankings),
            "tenant_id": tenant_id,
            "event_id": event_id
        }
    ).model_dump()
