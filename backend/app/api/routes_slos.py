from typing import List
from fastapi import APIRouter
from ..models.telemetry import ServiceLevelObjective
from ..storage.repository import repo

router = APIRouter(prefix="/api/slos", tags=["slos"])

@router.get("", response_model=List[ServiceLevelObjective])
async def list_slos():
    """Retrieve all Service Level Objectives and burn rate invariants."""
    return repo.get_slos()

@router.post("/audit", response_model=List[ServiceLevelObjective])
async def audit_slos():
    """Audit and update all SLO burn rates and remaining budgets against current traces."""
    return repo.audit_slos()
