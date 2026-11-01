import asyncio
from typing import List, Optional
from copy import deepcopy
from ..models.telemetry import (
    Trace,
    DecisionIntelligenceNode,
    ServiceNode,
    PipelineRun,
    ServiceLevelObjective,
    DecisionStatus,
)
from .initial_data import (
    INITIAL_TRACES,
    INITIAL_DECISIONS,
    INITIAL_SERVICES,
    INITIAL_PIPELINES,
    INITIAL_SLOS,
)

class TelemetryRepository:
    def __init__(self):
        self._traces: List[Trace] = []
        self._decisions: List[DecisionIntelligenceNode] = []
        self._services: List[ServiceNode] = []
        self._pipelines: List[PipelineRun] = []
        self._slos: List[ServiceLevelObjective] = []
        self._subscribers: List[asyncio.Queue] = []
        self.reset_to_seed()

    def reset_to_seed(self):
        """Reset repository to clean initial baseline dataset."""
        self._traces = deepcopy(INITIAL_TRACES)
        self._decisions = deepcopy(INITIAL_DECISIONS)
        self._services = deepcopy(INITIAL_SERVICES)
        self._pipelines = deepcopy(INITIAL_PIPELINES)
        self._slos = deepcopy(INITIAL_SLOS)

    # ---------------- Traces ----------------
    def get_traces(
        self,
        service: Optional[str] = None,
        status: Optional[str] = None,
        environment: Optional[str] = None,
        region: Optional[str] = None,
        search: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List[Trace]:
        results = self._traces
        if service and service != "all":
            results = [t for t in results if t.rootService == service or any(s.service == service for s in t.spans)]
        if status and status != "all":
            results = [t for t in results if t.status == status]
        if environment and environment != "all":
            results = [t for t in results if t.environment == environment]
        if region and region != "all":
            results = [t for t in results if t.region == region]
        if search:
            q = search.lower()
            results = [
                t for t in results
                if q in t.id.lower()
                or q in t.rootEndpoint.lower()
                or q in t.rootService.lower()
                or any(q in tag.lower() for tag in t.tags)
            ]
        return results[offset : offset + limit]

    def get_trace(self, trace_id: str) -> Optional[Trace]:
        return next((t for t in self._traces if t.id == trace_id), None)

    async def add_trace(self, trace: Trace) -> Trace:
        # Prepend to keep latest first, cap list size at 500
        self._traces.insert(0, trace)
        if len(self._traces) > 500:
            self._traces.pop()

        # Dynamically recalculate service mesh metrics for affected service
        self._update_service_metrics(trace)

        # Notify active SSE subscribers
        await self._broadcast_event({
            "type": "trace_ingested",
            "trace": trace.model_dump(),
        })

        return trace

    def _update_service_metrics(self, trace: Trace):
        """Update live RPS, latency, and healthScore based on recent traces."""
        for svc in self._services:
            if svc.id == trace.rootService or any(s.service == svc.id for s in trace.spans):
                if trace.status in ["critical", "error"]:
                    svc.healthScore = max(40.0, round(svc.healthScore - 1.5, 1))
                    svc.errorRatePercent = min(20.0, round(svc.errorRatePercent + 0.2, 2))
                elif trace.status == "degraded":
                    svc.healthScore = max(50.0, round(svc.healthScore - 0.5, 1))
                else:
                    svc.healthScore = min(100.0, round(svc.healthScore + 0.1, 1))

                # Update status label
                if svc.healthScore >= 95.0:
                    svc.status = "healthy"
                elif svc.healthScore >= 80.0:
                    svc.status = "degraded"
                else:
                    svc.status = "critical"

                # Adjust p99 latency
                if trace.durationMs > svc.p99LatencyMs:
                    svc.p99LatencyMs = round(trace.durationMs, 1)

    # ---------------- Decisions ----------------
    def get_decisions(
        self,
        status: Optional[str] = None,
        service: Optional[str] = None
    ) -> List[DecisionIntelligenceNode]:
        results = self._decisions
        if status and status != "all":
            results = [d for d in results if d.status == status]
        if service and service != "all":
            results = [d for d in results if d.service == service]
        return results

    def get_decision(self, decision_id: str) -> Optional[DecisionIntelligenceNode]:
        return next((d for d in self._decisions if d.id == decision_id), None)

    async def add_decision(self, decision: DecisionIntelligenceNode) -> DecisionIntelligenceNode:
        self._decisions.insert(0, decision)
        await self._broadcast_event({
            "type": "decision_created",
            "decision": decision.model_dump(),
        })
        return decision

    async def update_decision_status(self, decision_id: str, new_status: DecisionStatus) -> Optional[DecisionIntelligenceNode]:
        for d in self._decisions:
            if d.id == decision_id:
                d.status = new_status
                await self._broadcast_event({
                    "type": "decision_updated",
                    "decisionId": decision_id,
                    "status": new_status,
                })
                return d
        return None

    # ---------------- Services Mesh ----------------
    def get_services(self) -> List[ServiceNode]:
        return self._services

    def update_service_health(self, service_id: str, delta: float) -> Optional[ServiceNode]:
        for s in self._services:
            if s.id == service_id:
                s.healthScore = min(max(s.healthScore + delta, 40.0), 100.0)
                if s.healthScore >= 95.0:
                    s.status = "healthy"
                elif s.healthScore >= 80.0:
                    s.status = "degraded"
                else:
                    s.status = "critical"
                return s
        return None

    # ---------------- Pipelines ----------------
    def get_pipelines(self) -> List[PipelineRun]:
        return self._pipelines

    async def add_pipeline(self, run: PipelineRun) -> PipelineRun:
        self._pipelines.insert(0, run)
        if len(self._pipelines) > 50:
            self._pipelines.pop()
        await self._broadcast_event({
            "type": "pipeline_triggered",
            "pipeline": run.model_dump(),
        })
        return run

    # ---------------- SLOs ----------------
    def get_slos(self) -> List[ServiceLevelObjective]:
        return self._slos

    def audit_slos(self) -> List[ServiceLevelObjective]:
        """Recalculate remaining error budgets and burn rates from recent traces."""
        for slo in self._slos:
            relevant = [t for t in self._traces if t.rootService == slo.service]
            if not relevant:
                continue
            
            error_count = sum(1 for t in relevant if t.status in ["critical", "error"])
            total = len(relevant)
            actual_pct = round(((total - error_count) / total) * 100, 3) if total > 0 else 100.0
            slo.actualPercent = actual_pct

            if slo.actualPercent < slo.targetPercent:
                slo.status = "breached"
                slo.remainingBudgetPercent = 0.0
                slo.burnRateRatio = round(3.5 + (slo.targetPercent - slo.actualPercent) * 1.5, 2)
            elif slo.actualPercent - slo.targetPercent < 0.2:
                slo.status = "warning"
                slo.remainingBudgetPercent = round(max(5.0, slo.remainingBudgetPercent - 4.0), 1)
                slo.burnRateRatio = round(1.8 + (100 - slo.actualPercent), 2)
            else:
                slo.status = "healthy"
                slo.burnRateRatio = 0.65
        return self._slos

    # ---------------- SSE Streaming ----------------
    def subscribe_stream(self) -> asyncio.Queue:
        q = asyncio.Queue()
        self._subscribers.append(q)
        return q

    def unsubscribe_stream(self, q: asyncio.Queue):
        if q in self._subscribers:
            self._subscribers.remove(q)

    async def _broadcast_event(self, data: dict):
        for q in list(self._subscribers):
            try:
                await q.put(data)
            except Exception:
                pass


repo = TelemetryRepository()
