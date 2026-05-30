"""
Consensus Aggregation Logic
Handles the aggregation of multiple judge scores into a final consensus score
with enhanced confidence aggregation including inter-judge agreement,
criteria variance stability, and historical consistency signals.
"""
from typing import Dict, Any, List, Optional
from .rubric import CRITERIA, WEIGHTS
import logging
import math

logger = logging.getLogger(__name__)


class ConfidenceCalculator:
    """
    Calculates enhanced confidence scores using multiple signals:
    - Inter-judge agreement
    - Criteria variance stability
    - Historical consistency (optional)
    """
    
    @staticmethod
    def calculate_inter_judge_agreement(scores: List[Dict[str, float]]) -> float:
        """
        Calculate inter-judge agreement signal.
        
        Higher agreement (lower variance across judges) = higher confidence.
        
        Args:
            scores: List of score dictionaries from different judges
            
        Returns:
            Agreement score between 0.0 and 1.0
        """
        if not scores or len(scores) < 2:
            return 0.5  # Neutral confidence for single judge
        
        # Calculate coefficient of variation across all scores
        all_scores = []
        for score_set in scores:
            all_scores.extend(score_set.values())
        
        if not all_scores:
            return 0.5
        
        mean_score = sum(all_scores) / len(all_scores)
        if mean_score == 0:
            return 0.5
        
        variance = sum((s - mean_score) ** 2 for s in all_scores) / len(all_scores)
        std_dev = math.sqrt(variance)
        cv = std_dev / mean_score
        
        # Convert CV to agreement score (lower CV = higher agreement)
        # CV of 0 -> agreement 1.0
        # CV of 0.5 -> agreement 0.5
        # CV >= 1.0 -> agreement 0.2
        agreement = max(0.2, min(1.0, 1.0 - (cv * 0.8)))
        
        return round(agreement, 3)
    
    @staticmethod
    def calculate_criteria_variance_stability(scores: List[Dict[str, float]]) -> float:
        """
        Calculate criteria variance stability signal.
        
        More consistent variance across criteria = higher confidence.
        
        Args:
            scores: List of score dictionaries
            
        Returns:
            Stability score between 0.0 and 1.0
        """
        if not scores or len(scores) < 2:
            return 0.5
        
        # Calculate variance for each criterion across judges
        criterion_variances = []
        for criterion in CRITERIA.keys():
            criterion_scores = [s.get(criterion, 0) for s in scores if criterion in s]
            if len(criterion_scores) > 1:
                mean = sum(criterion_scores) / len(criterion_scores)
                if mean > 0:
                    variance = sum((s - mean) ** 2 for s in criterion_scores) / len(criterion_scores)
                    criterion_variances.append(variance)
        
        if not criterion_variances:
            return 0.5
        
        # Calculate stability as inverse of variance variance (meta-variance)
        mean_variance = sum(criterion_variances) / len(criterion_variances)
        if mean_variance == 0:
            return 1.0  # Perfect stability
        
        variance_of_variances = sum((v - mean_variance) ** 2 for v in criterion_variances) / len(criterion_variances)
        stability = max(0.2, min(1.0, 1.0 - (variance_of_variances / 10)))
        
        return round(stability, 3)
    
    @staticmethod
    def calculate_historical_consistency(
        current_scores: Dict[str, float],
        historical_scores: Optional[List[Dict[str, float]]] = None
    ) -> float:
        """
        Calculate historical consistency signal.
        
        If historical data available: compare current to historical pattern.
        If not available: return neutral (0.5).
        
        Args:
            current_scores: Current evaluation scores
            historical_scores: Optional list of historical score dictionaries
            
        Returns:
            Consistency score between 0.0 and 1.0 (neutral 0.5 if no history)
        """
        if not historical_scores or not current_scores:
            return 0.5  # Neutral when no historical data
        
        # Calculate average historical scores per criterion
        historical_avg = {}
        for criterion in CRITERIA.keys():
            scores = [h.get(criterion, 0) for h in historical_scores if criterion in h]
            if scores:
                historical_avg[criterion] = sum(scores) / len(scores)
        
        if not historical_avg:
            return 0.5
        
        # Calculate deviation from historical pattern
        deviations = []
        for criterion, current in current_scores.items():
            if criterion in historical_avg:
                historical = historical_avg[criterion]
                if historical > 0:
                    deviation = abs(current - historical) / historical
                    deviations.append(deviation)
        
        if not deviations:
            return 0.5
        
        avg_deviation = sum(deviations) / len(deviations)
        # Lower deviation = higher consistency
        consistency = max(0.2, min(1.0, 1.0 - avg_deviation))
        
        return round(consistency, 3)
    
    @staticmethod
    def aggregate_confidence_signals(
        inter_judge_agreement: float,
        criteria_variance_stability: float,
        historical_consistency: float = 0.5
    ) -> float:
        """
        Aggregate multiple confidence signals into final confidence score.
        
        Weights:
        - Inter-judge agreement: 40%
        - Criteria variance stability: 40%
        - Historical consistency: 20% (neutral if no history)
        
        Args:
            inter_judge_agreement: Agreement score (0.0-1.0)
            criteria_variance_stability: Stability score (0.0-1.0)
            historical_consistency: Consistency score (0.0-1.0, default 0.5)
            
        Returns:
            Final confidence score between 0.0 and 1.0
        """
        # Weighted aggregation
        final_confidence = (
            inter_judge_agreement * 0.4 +
            criteria_variance_stability * 0.4 +
            historical_consistency * 0.2
        )
        
        return round(max(0.0, min(1.0, final_confidence)), 3)


class ConsensusAggregator:
    def __init__(self):
        """
        Initialize the consensus aggregator.
        """
        self.confidence_calculator = ConfidenceCalculator()

    def calculate_weighted_average(self, scores: List[Dict[str, float]]) -> Dict[str, Any]:
        """
        Calculate the weighted average of multiple score sets.
        
        Args:
            scores: List of dictionaries containing scores for each criterion
            
        Returns:
            Dictionary with consensus scores and reasoning
        """
        if not scores:
            return {
                "criteria": {criterion: 0 for criterion in CRITERIA.keys()},
                "overall_score": 0,
                "reasoning": "No scores provided for aggregation"
            }
        
        # Initialize aggregated scores
        aggregated_scores = {criterion: [] for criterion in CRITERIA.keys()}
        
        # Collect all scores for each criterion
        for score_set in scores:
            for criterion in CRITERIA.keys():
                if criterion in score_set:
                    aggregated_scores[criterion].append(score_set[criterion])
        
        # Calculate average for each criterion
        consensus_scores = {}
        total_weighted_score = 0
        total_max_score = 0
        
        for criterion, score_list in aggregated_scores.items():
            if score_list:  # If there are scores for this criterion
                avg_score = sum(score_list) / len(score_list)
                consensus_scores[criterion] = round(avg_score, 2)
                
                # Calculate weighted contribution
                weight = WEIGHTS[criterion]
                weighted_contribution = avg_score * weight
                total_weighted_score += weighted_contribution
                total_max_score += CRITERIA[criterion] * weight
            else:
                # If no scores for this criterion, set to 0
                consensus_scores[criterion] = 0
        
        # Calculate overall consensus score (normalized to 100)
        overall_score = (total_weighted_score / total_max_score) * 100 if total_max_score > 0 else 0
        
        return {
            "criteria": consensus_scores,
            "overall_score": round(overall_score, 2),
            "reasoning": f"Weighted average of {len(scores)} individual scores",
            "individual_count": len(scores)
        }

    def calculate_consensus_with_confidence(self, evaluations: List[Dict[str, Any]], historical_data: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
        """
        Calculate consensus taking into account confidence scores of each evaluation
        with enhanced confidence aggregation using multiple signals.
        
        Args:
            evaluations: List of evaluation dictionaries that include scores and confidence
            historical_data: Optional list of historical evaluations for consistency check
            
        Returns:
            Dictionary with consensus scores, enhanced confidence, and reasoning
        """
        if not evaluations:
            return {
                "criteria": {criterion: 0 for criterion in CRITERIA.keys()},
                "overall_score": 0,
                "confidence": 0,
                "reasoning": "No evaluations provided for aggregation"
            }
        
        # Collect scores and confidence values
        scores = []
        confidences = []
        
        for eval_data in evaluations:
            if "scores" in eval_data and "confidence" in eval_data:
                scores.append(eval_data["scores"])
                confidences.append(eval_data["confidence"])
        
        if not scores:
            return {
                "criteria": {criterion: 0 for criterion in CRITERIA.keys()},
                "overall_score": 0,
                "confidence": 0,
                "reasoning": "No valid scores found in evaluations"
            }
        
        # Calculate weighted average considering confidence
        consensus_result = self.calculate_weighted_average(scores)
        
        # Calculate enhanced confidence signals
        inter_judge_agreement = self.confidence_calculator.calculate_inter_judge_agreement(scores)
        criteria_variance_stability = self.confidence_calculator.calculate_criteria_variance_stability(scores)
        
        # Calculate historical consistency if data available
        historical_consistency = 0.5  # Default neutral
        if historical_data:
            historical_scores = [h.get("scores", {}) for h in historical_data if "scores" in h]
            historical_consistency = self.confidence_calculator.calculate_historical_consistency(
                consensus_result["criteria"],
                historical_scores
            )
        
        # Aggregate all confidence signals
        enhanced_confidence = self.confidence_calculator.aggregate_confidence_signals(
            inter_judge_agreement,
            criteria_variance_stability,
            historical_consistency
        )
        
        # Also calculate simple average confidence for reference
        avg_individual_confidence = sum(confidences) / len(confidences) if confidences else 0.5
        
        return {
            **consensus_result,
            "confidence": enhanced_confidence,
            "confidence_signals": {
                "inter_judge_agreement": inter_judge_agreement,
                "criteria_variance_stability": criteria_variance_stability,
                "historical_consistency": historical_consistency,
                "average_individual_confidence": round(avg_individual_confidence, 3)
            },
            "reasoning": f"Weighted average of {len(scores)} evaluations with enhanced confidence aggregation"
        }

    def calculate_disagreement_metrics(self, scores: List[Dict[str, float]]) -> Dict[str, Any]:
        """
        Calculate metrics to measure disagreement between judges.
        
        Args:
            scores: List of score dictionaries
            
        Returns:
            Dictionary with disagreement metrics
        """
        if not scores or len(scores) < 2:
            return {
                "disagreement_score": 0,
                "notes": "Insufficient scores to calculate disagreement metrics"
            }
        
        disagreement_metrics = {}
        
        for criterion in CRITERIA.keys():
            criterion_scores = [score_set.get(criterion, 0) for score_set in scores if criterion in score_set]
            
            if len(criterion_scores) > 1:
                # Calculate standard deviation as a measure of disagreement
                mean_score = sum(criterion_scores) / len(criterion_scores)
                variance = sum((score - mean_score) ** 2 for score in criterion_scores) / len(criterion_scores)
                std_dev = variance ** 0.5
                
                disagreement_metrics[criterion] = {
                    "std_deviation": round(std_dev, 2),
                    "range": round(max(criterion_scores) - min(criterion_scores), 2),
                    "coefficient_of_variation": round(std_dev / mean_score if mean_score != 0 else 0, 2)
                }
            else:
                disagreement_metrics[criterion] = {
                    "std_deviation": 0,
                    "range": 0,
                    "coefficient_of_variation": 0
                }
        
        # Overall disagreement score (average of std deviations)
        overall_disagreement = sum(
            metrics["std_deviation"] for metrics in disagreement_metrics.values()
        ) / len(disagreement_metrics) if disagreement_metrics else 0
        
        return {
            "criterion_metrics": disagreement_metrics,
            "disagreement_score": round(overall_disagreement, 2),
            "notes": f"Calculated from {len(scores)} score sets"
        }


def aggregate_consensus(evaluations: List[Dict[str, Any]], historical_data: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
    """
    Public function to aggregate multiple evaluations into a consensus
    with enhanced confidence aggregation.
    
    Args:
        evaluations: List of evaluation dictionaries containing scores and confidence
        historical_data: Optional list of historical evaluations for consistency check
        
    Returns:
        Dictionary with consensus scores, enhanced confidence, and reasoning
    """
    aggregator = ConsensusAggregator()
    
    # Calculate consensus with enhanced confidence
    consensus_result = aggregator.calculate_consensus_with_confidence(evaluations, historical_data)
    
    # Calculate disagreement metrics
    scores_only = [eval_data["scores"] for eval_data in evaluations if "scores" in eval_data]
    disagreement_metrics = aggregator.calculate_disagreement_metrics(scores_only)
    
    # Combine results
    result = {
        **consensus_result,
        "disagreement_metrics": disagreement_metrics
    }
    
    return result
