import time
from fastapi import APIRouter
from ..storage.repository import repo
from ..engine.scenario_gen import SCENARIO_METADATA
from ..config import settings

router = APIRouter(prefix="/api", tags=["system"])

START_TIME = time.time()

@router.get("/health")
async def health_check():
    """System health check and diagnostic status."""
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "uptimeSeconds": round(time.time() - START_TIME, 1),
        "totalTracesStored": len(repo.get_traces()),
        "openWeightModel": settings.OPEN_WEIGHT_MODEL,
        "openWeightApiUrl": settings.OPEN_WEIGHT_API_URL,
    }

@router.get("/scenarios")
async def list_scenarios():
    """List available real-world failure and telemetry scenarios."""
    return {
        "scenarios": [
            {"id": key, **meta}
            for key, meta in SCENARIO_METADATA.items()
        ]
    }

@router.post("/seed")
async def reset_seed():
    """Reset telemetry repository to rich initial baseline dataset."""
    repo.reset_to_seed()
    return {"status": "ok", "message": "Telemetry repository reset to initial baseline state."}
