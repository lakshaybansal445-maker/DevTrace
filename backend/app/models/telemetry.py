from __future__ import annotations
from typing import Literal, Optional, Any, Dict, List
from pydantic import BaseModel, Field

TraceStatus = Literal['nominal', 'degraded', 'error', 'critical']
SpanStatus = Literal['ok', 'error', 'warn']
SpanKind = Literal['SERVER', 'CLIENT', 'PRODUCER', 'CONSUMER', 'INTERNAL']
HttpMethod = Literal['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'gRPC']
Environment = Literal['production', 'staging', 'canary']
Region = Literal['us-east-1', 'eu-central-1', 'ap-southeast-1']
ServiceType = Literal[
    'gateway', 'auth', 'core_api', 'queue', 'database',
    'cache', 'vector_engine', 'ai_inference'
]
DecisionSeverity = Literal['success', 'danger', 'recommendation', 'warning']
DecisionStatus = Literal['pending_review', 'applied', 'dismissed']
PipelineRunStatus = Literal['passed', 'failed', 'running']
PipelineStageStatus = Literal['passed', 'failed', 'running', 'queued']
SloStatus = Literal['healthy', 'warning', 'breached']
SloType = Literal['latency', 'availability', 'throughput']
SloWindow = Literal['7d', '30d', '90d']


class Span(BaseModel):
    id: str
    parentId: Optional[str] = None
    name: str
    service: str
    durationMs: float
    offsetMs: float = 0.0
    status: SpanStatus = 'ok'
    statusCode: Optional[int] = None
    kind: SpanKind = 'SERVER'
    attributes: Dict[str, Any] = Field(default_factory=dict)
    query: Optional[str] = None
    errorDetails: Optional[str] = None


class Trace(BaseModel):
    id: str
    rootEndpoint: str
    httpMethod: HttpMethod
    rootService: str
    durationMs: float
    timestamp: str
    relativeTime: str = "Just now"
    statusCode: int = 200
    status: TraceStatus = "nominal"
    spanCount: int = 1
    errorCount: int = 0
    clientIp: str = "127.0.0.1"
    environment: Environment = "production"
    region: Region = "us-east-1"
    spans: List[Span] = Field(default_factory=list)
    tags: List[str] = Field(default_factory=list)


class DecisionImpactMetrics(BaseModel):
    latencyReduction: Optional[str] = None
    errorRateChange: Optional[str] = None
    throughputGain: Optional[str] = None
    costImpact: Optional[str] = None


class DecisionRecommendedPatch(BaseModel):
    language: str = "typescript"
    filePath: str
    codeSnippet: str
    explanation: str


class DecisionIntelligenceNode(BaseModel):
    id: str
    title: str
    severity: DecisionSeverity = "recommendation"
    service: str
    affectedTraceId: str
    timestamp: str
    rootCause: str
    impactMetrics: DecisionImpactMetrics = Field(default_factory=DecisionImpactMetrics)
    architecturalHypothesis: str
    recommendedPatch: DecisionRecommendedPatch
    status: DecisionStatus = "pending_review"


class ServiceNode(BaseModel):
    id: str
    name: str
    type: ServiceType
    healthScore: float
    status: Literal['healthy', 'degraded', 'critical']
    rps: float
    p99LatencyMs: float
    errorRatePercent: float
    version: str
    dependencies: List[str] = Field(default_factory=list)
    x: float
    y: float


class PipelineStage(BaseModel):
    id: str
    name: str
    durationSeconds: float
    status: PipelineStageStatus
    errorDetails: Optional[str] = None


class RegressionDetected(BaseModel):
    stage: str
    deltaMs: float
    description: str


class PipelineRun(BaseModel):
    id: str
    commitHash: str
    commitMessage: str
    author: str
    branch: str
    timestamp: str
    status: PipelineRunStatus
    totalDurationSeconds: float
    stages: List[PipelineStage] = Field(default_factory=list)
    regressionDetected: Optional[RegressionDetected] = None


class ServiceLevelObjective(BaseModel):
    id: str
    name: str
    service: str
    targetPercent: float
    actualPercent: float
    timeWindow: SloWindow
    remainingBudgetPercent: float
    burnRateRatio: float
    status: SloStatus
    type: SloType


# ---------------- API Request Payloads ----------------

class TraceCreateRequest(BaseModel):
    endpoint: str = "/api/v1/resource"
    method: HttpMethod = "POST"
    service: str = "order-orchestrator"
    durationMs: Optional[float] = None
    statusCode: int = 200
    spans: Optional[List[Span]] = None
    environment: Environment = "production"
    region: Region = "us-east-1"
    tags: Optional[List[str]] = None
    clientIp: Optional[str] = None


class SimulateTraceRequest(BaseModel):
    endpoint: str = "/v2/payments/charge-card"
    method: HttpMethod = "POST"
    service: str = "payment-router"
    durationMs: float = 320.0
    statusCode: int = 200
    hasDbQuery: bool = True
    errorType: Literal['none', 'slow_db', 'timeout', 'deadlock'] = 'none'
    environment: Environment = "production"
    region: Region = "us-east-1"


class DecisionCreateRequest(BaseModel):
    title: str
    severity: DecisionSeverity = "recommendation"
    service: str = "order-orchestrator"
    affectedTraceId: str
    rootCause: str
    architecturalHypothesis: str
    filePath: str = "src/services/handler.ts"
    codeSnippet: str = "// Applied optimization"
    explanation: str = "Refactored execution path to eliminate latency"
    language: str = "typescript"
    impactMetrics: Optional[DecisionImpactMetrics] = None


class DecisionUpdateRequest(BaseModel):
    status: DecisionStatus


class DecisionAnalyzeRequest(BaseModel):
    traceId: str
    useOpenWeightModel: bool = True
    useGeminiIfAvailable: Optional[bool] = None


class ServiceHealthUpdateRequest(BaseModel):
    delta: float


class PipelineTriggerRequest(BaseModel):
    branch: str = "main"
    author: Optional[str] = None
    commitMessage: Optional[str] = None
    simulateFailure: bool = False


class RealLifeScenarioRequest(BaseModel):
    scenario: Literal[
        'ecommerce_checkout_deadlock',
        'llm_rag_vector_bottleneck',
        'auth_jwt_cache_stampede',
        'stripe_webhook_connection_starvation',
        'kafka_consumer_lag_spike',
        'nominal_fastpath'
    ]
    environment: Environment = "production"
    region: Region = "us-east-1"
