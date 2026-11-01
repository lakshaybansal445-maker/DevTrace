import {
  Trace,
  DecisionIntelligenceNode,
  ServiceNode,
  PipelineRun,
  ServiceLevelObjective,
} from '../types/telemetry';

const API_BASE = '/api';

export interface HealthStatus {
  status: string;
  service: string;
  version: string;
  uptimeSeconds: number;
  totalTracesStored: number;
  totalDecisionsStored: number;
  openWeightModel?: string;
  openWeightApiUrl?: string;
}

export interface ScenarioMeta {
  id: string;
  title: string;
  description: string;
  severity: string;
  service: string;
}

// Check backend connectivity
export async function checkBackendHealth(): Promise<HealthStatus | null> {
  try {
    const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// Fetch list of real-world scenarios
export async function fetchAvailableScenarios(): Promise<ScenarioMeta[]> {
  try {
    const res = await fetch(`${API_BASE}/scenarios`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.scenarios || [];
  } catch {
    return [];
  }
}

// Ingest a real-life production scenario
export async function ingestScenario(scenarioName: string): Promise<Trace> {
  const res = await fetch(`${API_BASE}/traces/scenario/${scenarioName}`, {
    method: 'POST',
  });
  if (!res.ok) {
    throw new Error(`Failed to ingest scenario: ${res.statusText}`);
  }
  return await res.json();
}

// Traces API
export async function fetchTraces(params?: {
  service?: string;
  status?: string;
  environment?: string;
  region?: string;
  search?: string;
  limit?: number;
}): Promise<Trace[]> {
  const query = new URLSearchParams();
  if (params?.service && params.service !== 'all') query.set('service', params.service);
  if (params?.status && params.status !== 'all') query.set('status', params.status);
  if (params?.environment && params.environment !== 'all') query.set('environment', params.environment);
  if (params?.region && params.region !== 'all') query.set('region', params.region);
  if (params?.search) query.set('search', params.search);
  if (params?.limit) query.set('limit', String(params.limit));

  const url = `${API_BASE}/traces${query.toString() ? `?${query.toString()}` : ''}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch traces');
  return await res.json();
}

export async function fetchTraceById(id: string): Promise<Trace> {
  const res = await fetch(`${API_BASE}/traces/${id}`);
  if (!res.ok) throw new Error(`Trace not found: ${id}`);
  return await res.json();
}

export async function simulateTrace(payload: {
  endpoint: string;
  method: 'POST' | 'GET' | 'gRPC';
  service: string;
  durationMs: number;
  statusCode: number;
  hasDbQuery: boolean;
  errorType: 'none' | 'slow_db' | 'timeout' | 'deadlock';
  environment?: string;
  region?: string;
}): Promise<Trace> {
  const res = await fetch(`${API_BASE}/traces/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to simulate trace');
  return await res.json();
}

// Decisions API
export async function fetchDecisions(params?: { status?: string; service?: string }): Promise<DecisionIntelligenceNode[]> {
  const query = new URLSearchParams();
  if (params?.status && params.status !== 'all') query.set('status', params.status);
  if (params?.service && params.service !== 'all') query.set('service', params.service);

  const url = `${API_BASE}/decisions${query.toString() ? `?${query.toString()}` : ''}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch decisions');
  return await res.json();
}

export async function createDecision(payload: {
  title: string;
  severity?: 'success' | 'danger' | 'recommendation' | 'warning';
  service: string;
  affectedTraceId: string;
  rootCause: string;
  architecturalHypothesis: string;
  filePath: string;
  codeSnippet: string;
  explanation: string;
  language?: string;
}): Promise<DecisionIntelligenceNode> {
  const res = await fetch(`${API_BASE}/decisions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to draft decision');
  return await res.json();
}

export async function updateDecisionStatus(
  id: string,
  status: 'applied' | 'dismissed' | 'pending_review'
): Promise<DecisionIntelligenceNode> {
  const res = await fetch(`${API_BASE}/decisions/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error('Failed to update decision');
  return await res.json();
}

export async function analyzeTrace(traceId: string, useAi = true): Promise<DecisionIntelligenceNode> {
  const res = await fetch(`${API_BASE}/decisions/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ traceId, useOpenWeightModel: useAi }),
  });
  if (!res.ok) throw new Error('Failed to analyze trace');
  return await res.json();
}

// Service Mesh API
export async function fetchServices(): Promise<ServiceNode[]> {
  const res = await fetch(`${API_BASE}/mesh/services`);
  if (!res.ok) throw new Error('Failed to fetch services');
  return await res.json();
}

export async function updateServiceHealth(serviceId: string, delta: number): Promise<ServiceNode> {
  const res = await fetch(`${API_BASE}/mesh/services/${serviceId}/health`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ delta }),
  });
  if (!res.ok) throw new Error('Failed to adjust service health');
  return await res.json();
}

// Pipelines API
export async function fetchPipelines(): Promise<PipelineRun[]> {
  const res = await fetch(`${API_BASE}/pipelines`);
  if (!res.ok) throw new Error('Failed to fetch pipelines');
  return await res.json();
}

export async function triggerPipeline(params?: {
  branch?: string;
  author?: string;
  commitMessage?: string;
  simulateFailure?: boolean;
}): Promise<PipelineRun> {
  const res = await fetch(`${API_BASE}/pipelines/trigger`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params || {}),
  });
  if (!res.ok) throw new Error('Failed to trigger pipeline');
  return await res.json();
}

// SLOs API
export async function fetchSlos(): Promise<ServiceLevelObjective[]> {
  const res = await fetch(`${API_BASE}/slos`);
  if (!res.ok) throw new Error('Failed to fetch SLOs');
  return await res.json();
}

export async function auditSlos(): Promise<ServiceLevelObjective[]> {
  const res = await fetch(`${API_BASE}/slos/audit`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to audit SLOs');
  return await res.json();
}

// SSE Live Stream connection
export function subscribeTelemetryStream(
  onEvent: (event: any) => void,
  onError?: (err: any) => void
): () => void {
  const eventSource = new EventSource(`${API_BASE}/stream`);

  eventSource.onmessage = (event) => {
    try {
      const parsed = JSON.parse(event.data);
      onEvent(parsed);
    } catch {
      // Keepalive or ping
    }
  };

  eventSource.onerror = (err) => {
    if (onError) onError(err);
  };

  return () => {
    eventSource.close();
  };
}

// Live GitHub Repositories & CI/CD Telemetry API
export interface GitHubRepoInfo {
  fullName: string;
  name: string;
  description?: string;
  stars: number;
  forks: number;
  language?: string;
  defaultBranch: string;
  htmlUrl: string;
  updatedAt: string;
}

export interface GitHubPipelineResponse {
  repo: GitHubRepoInfo;
  isLiveGitHub: boolean;
  runs: PipelineRun[];
}

export async function fetchGitHubPipeline(repoName: string, token?: string): Promise<GitHubPipelineResponse> {
  const params = new URLSearchParams({ repo: repoName });
  if (token) params.set('token', token);
  const res = await fetch(`${API_BASE}/github/pipeline?${params.toString()}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to fetch GitHub pipeline' }));
    throw new Error(err.detail || 'Failed to fetch GitHub pipeline');
  }
  return await res.json();
}

export async function fetchGitHubRepos(user?: string, repo?: string): Promise<GitHubRepoInfo[]> {
  const params = new URLSearchParams();
  if (user) params.set('user', user);
  if (repo) params.set('repo', repo);
  const res = await fetch(`${API_BASE}/github/repos?${params.toString()}`);
  if (!res.ok) return [];
  return await res.json();
}

// Live GitLab Repositories & CI/CD Telemetry API
export interface GitLabProjectInfo {
  fullName: string;
  name: string;
  description?: string;
  stars: number;
  forks: number;
  language?: string;
  defaultBranch: string;
  htmlUrl: string;
  updatedAt: string;
}

export interface GitLabPipelineResponse {
  repo: GitLabProjectInfo;
  isLiveGitLab: boolean;
  runs: PipelineRun[];
}

export async function fetchGitLabPipeline(projectPath: string, token?: string): Promise<GitLabPipelineResponse> {
  const params = new URLSearchParams({ repo: projectPath });
  if (token) params.set('token', token);
  const res = await fetch(`${API_BASE}/gitlab/pipeline?${params.toString()}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to fetch GitLab pipeline' }));
    throw new Error(err.detail || 'Failed to fetch GitLab pipeline');
  }
  return await res.json();
}

export async function fetchGitLabProjects(query?: string, token?: string): Promise<GitLabProjectInfo[]> {
  const params = new URLSearchParams();
  if (query) params.set('query', query);
  if (token) params.set('token', token);
  const res = await fetch(`${API_BASE}/gitlab/projects?${params.toString()}`);
  if (!res.ok) return [];
  return await res.json();
}

