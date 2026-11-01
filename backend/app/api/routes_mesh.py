from typing import List
from fastapi import APIRouter, HTTPException
from ..models.telemetry import ServiceNode, ServiceHealthUpdateRequest
from ..storage.repository import repo

router = APIRouter(prefix="/api/mesh", tags=["mesh"])

@router.get("/services", response_model=List[ServiceNode])
async def get_services():
    """Retrieve full service mesh topology and live node metrics."""
    return repo.get_services()

@router.patch("/services/{service_id}/health", response_model=ServiceNode)
async def update_service_health(service_id: str, payload: ServiceHealthUpdateRequest):
    """Adjust service node health score delta."""
    node = repo.update_service_health(service_id, payload.delta)
    if not node:
        raise HTTPException(status_code=404, detail=f"Service '{service_id}' not found in mesh")
    return node
