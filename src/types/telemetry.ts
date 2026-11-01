export type TraceStatus = 'nominal' | 'degraded' | 'error' | 'critical';

export interface SpanAttribute {
  key: string;
  value: string | number | boolean;
}

export interface SpanEvent {
  name: string;
  timestamp: string;
  attributes?: Record<string, string | number>;
}

export interface Span {
  id: string;
  parentId?: string;
  name: string;
  service: string;
  durationMs: number;
  offsetMs: number;
  status: 'ok' | 'error' | 'warn';
  statusCode?: number;
  kind: 'SERVER' | 'CLIENT' | 'PRODUCER' | 'CONSUMER' | 'INTERNAL';
  attributes: Record<string, string | number | boolean>;
  query?: string;
  errorDetails?: string;
}

export interface Trace {
  id: string;
  rootEndpoint: string;
  httpMethod: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'gRPC';
  rootService: string;
  durationMs: number;
  timestamp: string;
  relativeTime: string;
  statusCode: number;
  status: TraceStatus;
  spanCount: number;
  errorCount: number;
  clientIp: string;
  environment: 'production' | 'staging' | 'canary';
  region: 'us-east-1' | 'eu-central-1' | 'ap-southeast-1';
  spans: Span[];
  tags: string[];
}

export interface DecisionIntelligenceNode {
  id: string;
  title: string;
  severity: 'success' | 'danger' | 'recommendation' | 'warning';
  service: string;
  affectedTraceId: string;
  timestamp: string;
  rootCause: string;
  impactMetrics: {
    latencyReduction?: string;
    errorRateChange?: string;
    throughputGain?: string;
    costImpact?: string;
  };
  architecturalHypothesis: string;
  recommendedPatch: {
    language: string;
    filePath: string;
    codeSnippet: string;
    explanation: string;
  };
  status: 'pending_review' | 'applied' | 'dismissed';
}

export interface ServiceNode {
  id: string;
  name: string;
  type: 'gateway' | 'auth' | 'core_api' | 'queue' | 'database' | 'cache' | 'vector_engine' | 'ai_inference';
  healthScore: number;
  status: 'healthy' | 'degraded' | 'critical';
  rps: number;
  p99LatencyMs: number;
  errorRatePercent: number;
  version: string;
  dependencies: string[];
  x: number;
  y: number;
}

export interface PipelineStage {
  id: string;
  name: string;
  durationSeconds: number;
  status: 'passed' | 'failed' | 'running' | 'queued';
  errorDetails?: string;
}

export interface PipelineRun {
  id: string;
  commitHash: string;
  commitMessage: string;
  author: string;
  branch: string;
  timestamp: string;
  status: 'passed' | 'failed' | 'running';
  totalDurationSeconds: number;
  stages: PipelineStage[];
  regressionDetected?: {
    stage: string;
    deltaMs: number;
    description: string;
  };
}

export interface ServiceLevelObjective {
  id: string;
  name: string;
  service: string;
  targetPercent: number;
  actualPercent: number;
  timeWindow: '7d' | '30d' | '90d';
  remainingBudgetPercent: number;
  burnRateRatio: number;
  status: 'healthy' | 'warning' | 'breached';
  type: 'latency' | 'availability' | 'throughput';
}
