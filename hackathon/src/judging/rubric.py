"""
Rubric schema for AI judging system
Defines criteria, sub-criteria, and weights for competition-grade judging
"""

# Define the rubric criteria with maximum scores
CRITERIA = {
    "usefulness": 10,      # Maximum score of 10
    "innovation": 10,      # Maximum score of 10
    "tech_depth": 10,      # Maximum score of 10
    "clarity": 10,         # Maximum score of 10
    "impact": 10           # Maximum score of 10
}

# Define sub-criteria for each criterion with maximum scores
SUB_CRITERIA = {
    "usefulness": {
        "problem_relevance": 5,      # How well it addresses the problem
        "user_value": 5               # Value delivered to users
    },
    "innovation": {
        "novelty": 5,                 # Newness/originality of idea
        "differentiation": 5          # How different from existing solutions
    },
    "tech_depth": {
        "architecture": 5,            # System design and structure
        "implementation_quality": 5   # Code quality and execution
    },
    "clarity": {
        "explanation": 5,             # How well explained the solution is
        "ux_thought": 5               # User experience consideration
    },
    "impact": {
        "scalability": 5,             # Ability to scale
        "real_world_applicability": 5 # Real-world use potential
    }
}

# Define weights for each criterion (should sum to 1.0 for proper weighting)
WEIGHTS = {
    "usefulness": 0.2,
    "innovation": 0.25,
    "tech_depth": 0.25,
    "clarity": 0.15,
    "impact": 0.15
}

# Define weights for sub-criteria within each criterion (should sum to 1.0)
SUB_WEIGHTS = {
    "usefulness": {
        "problem_relevance": 0.5,
        "user_value": 0.5
    },
    "innovation": {
        "novelty": 0.5,
        "differentiation": 0.5
    },
    "tech_depth": {
        "architecture": 0.5,
        "implementation_quality": 0.5
    },
    "clarity": {
        "explanation": 0.5,
        "ux_thought": 0.5
    },
    "impact": {
        "scalability": 0.5,
        "real_world_applicability": 0.5
    }
}

# Validate that weights sum to 1.0
def validate_weights():
    total_weight = sum(WEIGHTS.values())
    if abs(total_weight - 1.0) > 0.001:  # Allow for floating point precision errors
        raise ValueError(f"Weights must sum to 1.0, but sum to {total_weight}")
    
    # Validate sub-criteria weights
    for criterion, sub_weights in SUB_WEIGHTS.items():
        sub_total = sum(sub_weights.values())
        if abs(sub_total - 1.0) > 0.001:
            raise ValueError(f"Sub-criteria weights for {criterion} must sum to 1.0, but sum to {sub_total}")
    
    return True

# Run validation on import
validate_weights()

# Get total possible score
TOTAL_POSSIBLE_SCORE = sum(CRITERIA.values())

def get_criteria_names():
    """Return list of all criteria names"""
    return list(CRITERIA.keys())

def get_max_score_for_criterion(criterion):
    """Get the maximum possible score for a given criterion"""
    return CRITERIA.get(criterion, 0)

def get_weight_for_criterion(criterion):
    """Get the weight for a given criterion"""
    return WEIGHTS.get(criterion, 0)

def get_sub_criteria_for_criterion(criterion):
    """Get the sub-criteria for a given criterion"""
    return SUB_CRITERIA.get(criterion, {})

def get_sub_weight_for_criterion(criterion, sub_criterion):
    """Get the weight for a sub-criterion within a criterion"""
    return SUB_WEIGHTS.get(criterion, {}).get(sub_criterion, 0)