from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from ..models.telemetry import (
    DecisionIntelligenceNode,
    DecisionCreateRequest,
    DecisionUpdateRequest,
    DecisionAnalyzeRequest,
    DecisionRecommendedPatch,
    DecisionImpactMetrics,
)
from ..storage.repository import repo
from ..engine.analyzer import analyze_trace_with_open_weight_or_heuristic

router = APIRouter(prefix="/api/decisions", tags=["decisions"])

@router.get("", response_model=List[DecisionIntelligenceNode])
async def list_decisions(
    status: Optional[str] = Query(None, description="Filter by status: pending_review, applied, dismissed"),
    service: Optional[str] = Query(None, description="Filter by service"),
):
    """List architectural decisions."""
    return repo.get_decisions(status=status, service=service)

@router.get("/{decision_id}", response_model=DecisionIntelligenceNode)
async def get_decision(decision_id: str):
    """Retrieve decision record by ID."""
    node = repo.get_decision(decision_id)
    if not node:
        raise HTTPException(status_code=404, detail=f"Decision with ID '{decision_id}' not found")
    return node

@router.post("", response_model=DecisionIntelligenceNode, status_code=201)
async def create_decision(payload: DecisionCreateRequest):
    """Manually draft an Architectural Decision Record."""
    count = len(repo.get_decisions()) + 1
    node = DecisionIntelligenceNode(
        id=f"adr-{count:03d}",
        title=payload.title,
        severity=payload.severity,
        service=payload.service,
        affectedTraceId=payload.affectedTraceId,
        timestamp="Just now",
        rootCause=payload.rootCause,
        impactMetrics=payload.impactMetrics or DecisionImpactMetrics(
            latencyReduction="-120ms p95",
            throughputGain="+1.8x RPS",
        ),
        architecturalHypothesis=payload.architecturalHypothesis,
        recommendedPatch=DecisionRecommendedPatch(
            language=payload.language,
            filePath=payload.filePath,
            codeSnippet=payload.codeSnippet,
            explanation=payload.explanation,
        ),
        status="pending_review",
    )
    return await repo.add_decision(node)

@router.patch("/{decision_id}", response_model=DecisionIntelligenceNode)
async def update_decision_status(decision_id: str, payload: DecisionUpdateRequest):
    """Apply or dismiss an architectural decision."""
    updated = await repo.update_decision_status(decision_id, payload.status)
    if not updated:
        raise HTTPException(status_code=404, detail=f"Decision with ID '{decision_id}' not found")
    return updated

@router.post("/analyze", response_model=DecisionIntelligenceNode, status_code=201)
async def analyze_trace(payload: DecisionAnalyzeRequest):
    """
    Run Kinetic AI Intelligence on a trace to diagnose root cause,
    estimate impact metrics, and formulate an architectural patch.
    """
    trace = repo.get_trace(payload.traceId)
    use_ai = payload.useOpenWeightModel if payload.useOpenWeightModel is not None else (payload.useGeminiIfAvailable is not False)
    decision = await analyze_trace_with_open_weight_or_heuristic(
        trace=trace,
        use_ai=use_ai,
    )
    return await repo.add_decision(decision)
