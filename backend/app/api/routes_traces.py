import uuid
import datetime
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Query
from ..models.telemetry import (
    Trace,
    Span,
    TraceCreateRequest,
    SimulateTraceRequest,
)
from ..storage.repository import repo
from ..engine.scenario_gen import generate_scenario_trace, SCENARIO_METADATA

router = APIRouter(prefix="/api/traces", tags=["traces"])

@router.get("", response_model=List[Trace])
async def list_traces(
    service: Optional[str] = Query(None, description="Filter by service name"),
    status: Optional[str] = Query(None, description="Filter by status: nominal, degraded, error, critical"),
    environment: Optional[str] = Query(None, description="Filter by environment"),
    region: Optional[str] = Query(None, description="Filter by cloud region"),
    search: Optional[str] = Query(None, description="Search term for endpoints, services, tags"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    """Retrieve filtered distributed traces."""
    return repo.get_traces(
        service=service,
        status=status,
        environment=environment,
        region=region,
        search=search,
        limit=limit,
        offset=offset,
    )

@router.get("/{trace_id}", response_model=Trace)
async def get_trace(trace_id: str):
    """Retrieve full trace waterfall by ID."""
    trace = repo.get_trace(trace_id)
    if not trace:
        raise HTTPException(status_code=404, detail=f"Trace with ID '{trace_id}' not found")
    return trace

@router.post("", response_model=Trace, status_code=201)
async def ingest_trace(payload: TraceCreateRequest):
    """Ingest a new trace from external services or OpenTelemetry SDK."""
    trace_uid = str(uuid.uuid4())[:8]
    trace_id = f"trace-{trace_uid}"
    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

    duration = payload.durationMs if payload.durationMs is not None else 85.0
    is_error = payload.statusCode >= 500
    is_degraded = payload.statusCode >= 400 or duration > 500

    spans = payload.spans
    if not spans:
        root_span = Span(
            id=f"span-{trace_id}-root",
            name=f"{payload.method} {payload.endpoint}",
            service=payload.service,
            durationMs=duration,
            offsetMs=0.0,
            status="error" if is_error else "warn" if is_degraded else "ok",
            statusCode=payload.statusCode,
            kind="SERVER",
            attributes={
                "http.target": payload.endpoint,
                "http.method": payload.method,
                "http.status_code": payload.statusCode,
            },
        )
        spans = [root_span]

    trace = Trace(
        id=trace_id,
        rootEndpoint=payload.endpoint,
        httpMethod=payload.method,
        rootService=payload.service,
        durationMs=duration,
        timestamp=now_iso,
        relativeTime="Just now",
        statusCode=payload.statusCode,
        status="critical" if is_error else "degraded" if is_degraded else "nominal",
        spanCount=len(spans),
        errorCount=sum(1 for s in spans if s.status == "error"),
        clientIp=payload.clientIp or "127.0.0.1",
        environment=payload.environment,
        region=payload.region,
        spans=spans,
        tags=payload.tags or ["ingested-otlp", payload.service],
    )
    return await repo.add_trace(trace)

@router.post("/simulate", response_model=Trace, status_code=201)
async def simulate_trace(payload: SimulateTraceRequest):
    """Simulate a realistic microservice trace with custom faults and delays."""
    trace_uid = str(uuid.uuid4())[:8]
    trace_id = f"trace-sim-{trace_uid}"
    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

    is_error = payload.statusCode >= 400 or payload.errorType != "none"
    root_span = Span(
        id=f"span-root-{trace_uid}",
        name=f"{payload.method} {payload.endpoint}",
        service=payload.service,
        durationMs=payload.durationMs,
        offsetMs=0.0,
        status="error" if is_error else "warn" if payload.statusCode >= 300 else "ok",
        statusCode=payload.statusCode,
        kind="SERVER",
        attributes={
            "http.method": payload.method,
            "http.target": payload.endpoint,
            "http.status_code": payload.statusCode,
            "simulated.trigger": True,
            "fault.injected": payload.errorType,
        },
    )

    spans: List[Span] = [root_span]

    # Auth verification child span
    spans.append(
        Span(
            id=f"span-auth-{trace_uid}",
            parentId=root_span.id,
            name="auth.verify_signature",
            service="auth-gateway",
            durationMs=18.2,
            offsetMs=1.5,
            status="ok",
            kind="CLIENT",
            attributes={"auth.valid": True},
        )
    )

    # Database query child span if requested
    if payload.hasDbQuery:
        db_duration = payload.durationMs * 0.75 if payload.errorType == "slow_db" else 45.0
        spans.append(
            Span(
                id=f"span-db-{trace_uid}",
                parentId=root_span.id,
                name="db.transaction_deadlock" if payload.errorType == "deadlock" else "db.execute_sql_query",
                service="postgres-primary",
                durationMs=db_duration,
                offsetMs=22.0,
                status="error" if payload.errorType == "deadlock" else "warn" if payload.errorType == "slow_db" else "ok",
                kind="CLIENT",
                query="UPDATE accounts SET balance = balance - 100 WHERE id = 'acc_4920';",
                errorDetails=(
                    "Deadlock detected: serialization failure code 40001"
                    if payload.errorType == "deadlock"
                    else "Query exceeded slow-query threshold (>200ms)"
                    if payload.errorType == "slow_db"
                    else None
                ),
                attributes={"db.system": "postgresql", "db.table": "accounts"},
            )
        )

    # Determine status
    if payload.statusCode >= 500 or payload.errorType in ["timeout", "deadlock"]:
        status_label = "critical" if payload.errorType == "deadlock" else "error"
    elif payload.statusCode >= 400 or payload.durationMs > 400 or payload.errorType == "slow_db":
        status_label = "degraded"
    else:
        status_label = "nominal"

    trace = Trace(
        id=trace_id,
        rootEndpoint=payload.endpoint,
        httpMethod=payload.method,
        rootService=payload.service,
        durationMs=payload.durationMs,
        timestamp=now_iso,
        relativeTime="Just now",
        statusCode=payload.statusCode,
        status=status_label,
        spanCount=len(spans),
        errorCount=sum(1 for s in spans if s.status == "error"),
        clientIp="10.0.84.12",
        environment=payload.environment,
        region=payload.region,
        tags=["simulated", payload.service, f"fault:{payload.errorType}"],
        spans=spans,
    )
    return await repo.add_trace(trace)

@router.post("/scenario/{scenario_name}", response_model=Trace, status_code=201)
async def ingest_scenario(scenario_name: str):
    """
    Ingest a real-life production scenario:
    - ecommerce_checkout_deadlock
    - llm_rag_vector_bottleneck
    - auth_jwt_cache_stampede
    - stripe_webhook_connection_starvation
    - kafka_consumer_lag_spike
    - nominal_fastpath
    """
    if scenario_name not in SCENARIO_METADATA:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown scenario '{scenario_name}'. Available: {list(SCENARIO_METADATA.keys())}"
        )
    trace = generate_scenario_trace(scenario_name)
    return await repo.add_trace(trace)
