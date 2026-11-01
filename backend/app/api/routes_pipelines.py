import uuid
import random
from typing import List
from fastapi import APIRouter
from ..models.telemetry import (
    PipelineRun,
    PipelineStage,
    PipelineTriggerRequest,
    RegressionDetected,
)
from ..storage.repository import repo

router = APIRouter(prefix="/api/pipelines", tags=["pipelines"])

@router.get("", response_model=List[PipelineRun])
async def list_pipelines():
    """Retrieve CI/CD kinetic pipeline execution history."""
    return repo.get_pipelines()

@router.post("/trigger", response_model=PipelineRun, status_code=201)
async def trigger_pipeline(payload: PipelineTriggerRequest):
    """Trigger a new hermetic pipeline run with canary telemetry stages."""
    run_num = random.randint(8920, 8999)
    run_id = f"run-{run_num}"
    commit_hash = uuid.uuid4().hex[:7]
    commit_msg = payload.commitMessage or "refactor(kinetic): automated canary validation & invariant check"
    author = payload.author or "elena.rostova@devtrace.internal"
    
    stages = [
        PipelineStage(id="stg-1", name="Lint & Typecheck (Strict)", durationSeconds=16, status="passed"),
        PipelineStage(id="stg-2", name="Unit Tests (2,410 cases)", durationSeconds=32, status="passed"),
        PipelineStage(
            id="stg-3",
            name="Integration Mesh Simulation",
            durationSeconds=48 if not payload.simulateFailure else 75,
            status="failed" if payload.simulateFailure else "passed",
            errorDetails="Simulated regression: concurrent stress scenario timeout" if payload.simulateFailure else None,
        ),
        PipelineStage(
            id="stg-4",
            name="Hermetic Container Build",
            durationSeconds=20 if not payload.simulateFailure else 0,
            status="queued" if payload.simulateFailure else "passed",
        ),
        PipelineStage(
            id="stg-5",
            name="Canary Deployment (10%)",
            durationSeconds=16 if not payload.simulateFailure else 0,
            status="queued" if payload.simulateFailure else "passed",
        ),
    ]

    total_duration = sum(s.durationSeconds for s in stages)
    regression = None
    if payload.simulateFailure:
        regression = RegressionDetected(
            stage="Integration Mesh Simulation",
            deltaMs=12400.0,
            description="+12.4s latency spike detected during concurrent transfer tests.",
        )

    run = PipelineRun(
        id=run_id,
        commitHash=commit_hash,
        commitMessage=commit_msg,
        author=author,
        branch=payload.branch,
        timestamp="Just now",
        status="failed" if payload.simulateFailure else "passed",
        totalDurationSeconds=total_duration,
        stages=stages,
        regressionDetected=regression,
    )
    return await repo.add_pipeline(run)
