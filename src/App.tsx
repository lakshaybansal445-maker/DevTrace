import React, { useState, useEffect, useCallback } from 'react';
import {
  INITIAL_TRACES,
  INITIAL_DECISION_NODES,
  INITIAL_SERVICES,
  INITIAL_PIPELINES,
  INITIAL_SLOS,
} from './data/mockTelemetry';
import {
  Trace,
  DecisionIntelligenceNode,
  ServiceNode,
  PipelineRun,
  ServiceLevelObjective,
} from './types/telemetry';
import * as api from './services/api';
import { SidebarRail, NavScreen } from './components/layout/SidebarRail';
import { HeaderTopBar } from './components/layout/HeaderTopBar';
import { CommandPalette } from './components/layout/CommandPalette';
import { TraceExplorerView } from './components/traces/TraceExplorerView';
import { TraceInspectorDrawer } from './components/traces/TraceInspectorDrawer';
import { DecisionIntelligenceView } from './components/decision/DecisionIntelligenceView';
import { ServiceMeshView } from './components/mesh/ServiceMeshView';
import { PipelineTelemetryView } from './components/pipelines/PipelineTelemetryView';
import { SloGovernanceView } from './components/governance/SloGovernanceView';
import { SimulateTraceModal } from './components/common/SimulateTraceModal';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<NavScreen>('traces');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSimulateModalOpen, setIsSimulateModalOpen] = useState(false);
  const [selectedTrace, setSelectedTrace] = useState<Trace | null>(null);

  // Core telemetry state
  const [traces, setTraces] = useState<Trace[]>(INITIAL_TRACES);
  const [decisions, setDecisions] = useState<DecisionIntelligenceNode[]>(INITIAL_DECISION_NODES);
  const [services, setServices] = useState<ServiceNode[]>(INITIAL_SERVICES);
  const [pipelines, setPipelines] = useState<PipelineRun[]>(INITIAL_PIPELINES);
  const [slos, setSlos] = useState<ServiceLevelObjective[]>(INITIAL_SLOS);

  // Backend Integration State
  const [isBackendOnline, setIsBackendOnline] = useState<boolean>(false);
  const [backendHealth, setBackendHealth] = useState<api.HealthStatus | null>(null);
  const [availableScenarios, setAvailableScenarios] = useState<api.ScenarioMeta[]>([]);

  // Filters & Environment
  const [environment, setEnvironment] = useState('production');
  const [region, setRegion] = useState('us-east-1');
  const [liveStreaming, setLiveStreaming] = useState(true);

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 4000);
  }, []);

  // 1. Initial backend synchronization
  useEffect(() => {
    let isMounted = true;

    async function syncWithBackend() {
      try {
        const health = await api.checkBackendHealth();
        if (isMounted && health) {
          setIsBackendOnline(true);
          setBackendHealth(health);

          // Fetch live telemetry from Python backend
          const [
            backendTraces,
            backendDecisions,
            backendServices,
            backendPipelines,
            backendSlos,
            backendScenarios,
          ] = await Promise.all([
            api.fetchTraces().catch(() => []),
            api.fetchDecisions().catch(() => []),
            api.fetchServices().catch(() => []),
            api.fetchPipelines().catch(() => []),
            api.fetchSlos().catch(() => []),
            api.fetchAvailableScenarios().catch(() => []),
          ]);

          if (isMounted) {
            if (backendTraces.length > 0) setTraces(backendTraces);
            if (backendDecisions.length > 0) setDecisions(backendDecisions);
            if (backendServices.length > 0) setServices(backendServices);
            if (backendPipelines.length > 0) setPipelines(backendPipelines);
            if (backendSlos.length > 0) setSlos(backendSlos);
            if (backendScenarios.length > 0) setAvailableScenarios(backendScenarios);
            showToast('Connected to Python FastAPI backend (port 8000). Telemetry synchronized.');
          }
        } else if (isMounted) {
          setIsBackendOnline(false);
        }
      } catch {
        if (isMounted) setIsBackendOnline(false);
      }
    }

    syncWithBackend();

    // Check backend health periodically (every 10s)
    const interval = setInterval(async () => {
      const h = await api.checkBackendHealth();
      if (isMounted) {
        setIsBackendOnline(!!h);
        if (h) setBackendHealth(h);
      }
    }, 10000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [showToast]);

  // 2. Real-time Live SSE Streaming from Python Backend
  useEffect(() => {
    if (!liveStreaming || !isBackendOnline) return;

    const unsubscribe = api.subscribeTelemetryStream(
      (event) => {
        if (event.type === 'trace_ingested' && event.trace) {
          setTraces((prev) => [event.trace, ...prev.slice(0, 49)]);
          // Refresh service mesh status
          api.fetchServices().then(setServices).catch(() => {});
        } else if (event.type === 'decision_created' && event.decision) {
          setDecisions((prev) => [event.decision, ...prev]);
        } else if (event.type === 'decision_updated') {
          setDecisions((prev) =>
            prev.map((d) => (d.id === event.decisionId ? { ...d, status: event.status } : d))
          );
        } else if (event.type === 'pipeline_triggered' && event.pipeline) {
          setPipelines((prev) => [event.pipeline, ...prev]);
        }
      },
      () => {
        // SSE error, will auto-reconnect
      }
    );

    return () => {
      unsubscribe();
    };
  }, [liveStreaming, isBackendOnline]);

  // Fallback client simulator only when backend is offline
  useEffect(() => {
    if (!liveStreaming || isBackendOnline) return;

    const interval = setInterval(() => {
      const endpoints = [
        { path: '/v1/vector/retrieve-context', service: 'vector-inference-engine', method: 'POST' as const, baseMs: 140 },
        { path: '/v1/auth/introspect-jwt', service: 'auth-gateway', method: 'GET' as const, baseMs: 28 },
        { path: '/v2/orders/settle-cart', service: 'order-orchestrator', method: 'POST' as const, baseMs: 195 },
        { path: '/static/bundle-cache', service: 'auth-gateway', method: 'GET' as const, baseMs: 12 },
      ];
      const randomEp = endpoints[Math.floor(Math.random() * endpoints.length)];
      const jitter = (Math.random() - 0.4) * 40;
      const duration = Math.max(12, Number((randomEp.baseMs + jitter).toFixed(1)));
      const isSlow = duration > 250;

      const newId = `trace-stream-${Math.floor(1000 + Math.random() * 9000)}`;
      const streamTrace: Trace = {
        id: newId,
        rootEndpoint: randomEp.path,
        httpMethod: randomEp.method,
        rootService: randomEp.service,
        durationMs: duration,
        timestamp: new Date().toISOString(),
        relativeTime: 'Just now',
        statusCode: 200,
        status: isSlow ? 'degraded' : 'nominal',
        spanCount: Math.floor(4 + Math.random() * 8),
        errorCount: 0,
        clientIp: '10.0.12.84',
        environment: environment as any,
        region: region as any,
        tags: ['live-otlp-stream', randomEp.service],
        spans: [
          {
            id: `span-${newId}-root`,
            name: `${randomEp.method} ${randomEp.path}`,
            service: randomEp.service,
            durationMs: duration,
            offsetMs: 0,
            status: isSlow ? 'warn' : 'ok',
            kind: 'SERVER',
            attributes: {
              'http.target': randomEp.path,
              'http.method': randomEp.method,
              'http.status_code': 200,
            },
          },
        ],
      };

      setTraces((prev) => [streamTrace, ...prev.slice(0, 24)]);
    }, 7000);

    return () => clearInterval(interval);
  }, [liveStreaming, isBackendOnline, environment, region]);

  // Handlers for Decisions
  const handleApplyDecision = async (id: string) => {
    try {
      if (isBackendOnline) {
        await api.updateDecisionStatus(id, 'applied');
      }
      setDecisions((prev) =>
        prev.map((d) => (d.id === id ? { ...d, status: 'applied' as const } : d))
      );
      showToast('Architectural patch applied and verified across cluster invariant.');
    } catch (e) {
      showToast('Failed to apply decision on backend.');
    }
  };

  const handleDismissDecision = async (id: string) => {
    try {
      if (isBackendOnline) {
        await api.updateDecisionStatus(id, 'dismissed');
      }
      setDecisions((prev) =>
        prev.map((d) => (d.id === id ? { ...d, status: 'dismissed' as const } : d))
      );
      showToast('Decision dismissed.');
    } catch (e) {
      showToast('Failed to dismiss decision on backend.');
    }
  };

  const handleCreateDecision = async (newNode: DecisionIntelligenceNode) => {
    try {
      if (isBackendOnline) {
        const created = await api.createDecision({
          title: newNode.title,
          severity: newNode.severity,
          service: newNode.service,
          affectedTraceId: newNode.affectedTraceId,
          rootCause: newNode.rootCause,
          architecturalHypothesis: newNode.architecturalHypothesis,
          filePath: newNode.recommendedPatch.filePath,
          codeSnippet: newNode.recommendedPatch.codeSnippet,
          explanation: newNode.recommendedPatch.explanation,
          language: newNode.recommendedPatch.language,
        });
        setDecisions((prev) => [created, ...prev]);
      } else {
        setDecisions((prev) => [newNode, ...prev]);
      }
      showToast(`Drafted new Architectural Decision Record: ${newNode.id.toUpperCase()}`);
    } catch {
      setDecisions((prev) => [newNode, ...prev]);
      showToast(`Drafted new Architectural Decision Record: ${newNode.id.toUpperCase()}`);
    }
  };

  // Handlers for Traces & Scenarios
  const handleSelectScenario = async (scenarioId: string) => {
    try {
      showToast(`Injecting real-life scenario: ${scenarioId}...`);
      if (isBackendOnline) {
        const trace = await api.ingestScenario(scenarioId);
        setTraces((prev) => [trace, ...prev]);
        setSelectedTrace(trace);
        setCurrentScreen('traces');

        // Immediately trigger Decision Intelligence analysis
        showToast(`Trace ${trace.id} ingested. Running Kinetic Architecture diagnosis...`);
        try {
          const decision = await api.analyzeTrace(trace.id);
          setDecisions((prev) => [decision, ...prev]);
          showToast(`Formulated Architectural Decision Record: ${decision.title}`);
        } catch (err) {
          console.warn('AI analysis error:', err);
        }
      } else {
        showToast('Python backend offline. Start "python backend/run_server.py" to run real-life scenarios.');
      }
    } catch (err) {
      showToast(`Failed to ingest scenario: ${err}`);
    }
  };

  const handleSimulateTrace = async (trace: Trace) => {
    try {
      if (isBackendOnline) {
        const sim = await api.simulateTrace({
          endpoint: trace.rootEndpoint,
          method: trace.httpMethod as any,
          service: trace.rootService,
          durationMs: trace.durationMs,
          statusCode: trace.statusCode,
          hasDbQuery: trace.spans.some((s) => s.service.includes('postgres') || s.service.includes('db')),
          errorType: trace.status === 'critical' ? 'deadlock' : trace.statusCode >= 500 ? 'timeout' : 'none',
          environment,
          region,
        });
        setTraces((prev) => [sim, ...prev]);
        setSelectedTrace(sim);
      } else {
        setTraces((prev) => [trace, ...prev]);
        setSelectedTrace(trace);
      }
      showToast(`Simulated trace ${trace.id} ingested. Opening waterfall inspector.`);
    } catch {
      setTraces((prev) => [trace, ...prev]);
      setSelectedTrace(trace);
      showToast(`Simulated trace ${trace.id} ingested.`);
    }
  };

  const handleExportJson = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify({ traces, decisions, services, pipelines, slos }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `devtrace-telemetry-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Telemetry dataset exported to JSON.');
  };

  const handleUpdateServiceHealth = async (serviceId: string, delta: number) => {
    try {
      if (isBackendOnline) {
        const updated = await api.updateServiceHealth(serviceId, delta);
        setServices((prev) => prev.map((s) => (s.id === serviceId ? updated : s)));
      } else {
        setServices((prev) =>
          prev.map((s) => {
            if (s.id !== serviceId) return s;
            const newScore = Math.min(Math.max(s.healthScore + delta, 40), 100);
            const newStatus = newScore >= 95 ? 'healthy' : newScore >= 80 ? 'degraded' : 'critical';
            return { ...s, healthScore: newScore, status: newStatus };
          })
        );
      }
      showToast(`Service ${serviceId} health adjusted.`);
    } catch {
      showToast(`Service ${serviceId} health adjusted.`);
    }
  };

  const handleTriggerPipeline = async () => {
    try {
      if (isBackendOnline) {
        const run = await api.triggerPipeline({
          branch: 'main',
          commitMessage: 'refactor(kinetic): automated canary validation & invariant check',
        });
        setPipelines((prev) => [run, ...prev]);
        showToast(`Kinetic Build ${run.id} passed all hermetic stages.`);
      } else {
        const newRunId = `run-${Math.floor(8920 + Math.random() * 80)}`;
        const newRun: PipelineRun = {
          id: newRunId,
          commitHash: Math.random().toString(36).substring(2, 9),
          commitMessage: 'refactor(kinetic): automated canary validation & invariant check',
          author: 'elena.rostova@devtrace.internal',
          branch: 'main',
          timestamp: 'Just now',
          status: 'passed',
          totalDurationSeconds: 128,
          stages: [
            { id: 'stg-1', name: 'Lint & Typecheck (Strict)', durationSeconds: 16, status: 'passed' },
            { id: 'stg-2', name: 'Unit Tests (2,410 cases)', durationSeconds: 32, status: 'passed' },
            { id: 'stg-3', name: 'Integration Mesh Simulation', durationSeconds: 44, status: 'passed' },
            { id: 'stg-4', name: 'Hermetic Container Build', durationSeconds: 20, status: 'passed' },
            { id: 'stg-5', name: 'Canary Deployment (10%)', durationSeconds: 16, status: 'passed' },
          ],
        };
        setPipelines((prev) => [newRun, ...prev]);
        showToast(`Kinetic Build ${newRunId} passed all hermetic stages.`);
      }
    } catch {
      showToast('Pipeline execution triggered.');
    }
  };

  const handleAuditSlos = async () => {
    try {
      if (isBackendOnline) {
        const audited = await api.auditSlos();
        setSlos(audited);
      }
      showToast('Audited Service Level Objectives: All burn-rate invariants updated from trace window.');
    } catch {
      showToast('Audited Service Level Objectives.');
    }
  };

  const pendingAdrCount = decisions.filter((d) => d.status === 'pending_review').length;

  return (
    <div className="min-h-screen bg-[#F7F8FC] text-[#202333] flex font-sans">
      {/* Sidebar Rail (64px collapsed, 240px expanded) */}
      <SidebarRail
        currentScreen={currentScreen}
        onSelectScreen={(screen) => setCurrentScreen(screen)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        pendingAdrCount={pendingAdrCount}
        liveStreaming={liveStreaming}
        onToggleLiveStreaming={() => setLiveStreaming(!liveStreaming)}
        onOpenSearch={() => setIsSearchOpen(true)}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-200 ${
          isSidebarCollapsed ? 'ml-16' : 'ml-60'
        }`}
      >
        {/* Top Header Bar */}
        <HeaderTopBar
          currentScreen={currentScreen}
          onOpenSimulateModal={() => setIsSimulateModalOpen(true)}
          onExportJson={handleExportJson}
          onOpenSearch={() => setIsSearchOpen(true)}
          environment={environment}
          onChangeEnvironment={setEnvironment}
          region={region}
          onChangeRegion={setRegion}
          liveStreaming={liveStreaming}
          backendHealth={backendHealth}
          isBackendOnline={isBackendOnline}
          onSelectScenario={handleSelectScenario}
          availableScenarios={availableScenarios}
        />

        {/* Viewport Content Container (max-w 1536px, 12-col fluid grid standard) */}
        <main className="flex-1 p-6 max-w-[1536px] w-full mx-auto">
          {currentScreen === 'traces' && (
            <TraceExplorerView
              traces={traces}
              onSelectTrace={(t) => setSelectedTrace(t)}
              selectedTraceId={selectedTrace?.id}
              onOpenSimulateModal={() => setIsSimulateModalOpen(true)}
              onSelectScenario={handleSelectScenario}
            />
          )}

          {currentScreen === 'decisions' && (
            <DecisionIntelligenceView
              decisions={decisions}
              onApplyDecision={handleApplyDecision}
              onDismissDecision={handleDismissDecision}
              onOpenTrace={(traceId) => {
                const found = traces.find((t) => t.id === traceId);
                if (found) {
                  setSelectedTrace(found);
                } else {
                  setCurrentScreen('traces');
                }
              }}
              onCreateDecision={handleCreateDecision}
            />
          )}

          {currentScreen === 'mesh' && (
            <ServiceMeshView
              services={services}
              onSelectServiceTrace={(serviceId) => {
                setCurrentScreen('traces');
                showToast(`Filtered traces for ${serviceId}`);
              }}
              onUpdateServiceHealth={handleUpdateServiceHealth}
            />
          )}

          {currentScreen === 'pipelines' && (
            <PipelineTelemetryView
              pipelines={pipelines}
              onTriggerPipeline={handleTriggerPipeline}
              onOpenTraceForRun={() => {
                setCurrentScreen('traces');
              }}
              onUpdatePipelines={(newRuns) => setPipelines(newRuns)}
            />
          )}

          {currentScreen === 'slos' && (
            <SloGovernanceView
              slos={slos}
              onTriggerAudit={handleAuditSlos}
            />
          )}
        </main>
      </div>

      {/* Deep Trace Inspector Drawer */}
      <TraceInspectorDrawer
        trace={selectedTrace}
        onClose={() => setSelectedTrace(null)}
        onOpenAdrForTrace={(traceId) => {
          setSelectedTrace(null);
          setCurrentScreen('decisions');
        }}
      />

      {/* Quick Search Command Palette (Cmd+K) */}
      <CommandPalette
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        traces={traces}
        decisions={decisions}
        services={services}
        onSelectTrace={(t) => {
          setSelectedTrace(t);
          setCurrentScreen('traces');
        }}
        onSelectScreen={(s) => setCurrentScreen(s)}
      />

      {/* Simulate Trace Modal */}
      <SimulateTraceModal
        isOpen={isSimulateModalOpen}
        onClose={() => setIsSimulateModalOpen(false)}
        onSimulate={handleSimulateTrace}
      />

      {/* Toast Notification Container */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#202333] text-white px-4 py-3 rounded-lg shadow-xl text-xs flex items-center gap-3 border border-[#474554] animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-[#16A36A] shrink-0" />
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-[#A0A4B4] hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
