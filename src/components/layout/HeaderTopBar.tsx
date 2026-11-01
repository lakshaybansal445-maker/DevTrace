import React, { useState } from 'react';
import { Play, Download, Search, Globe, ChevronRight, Zap, CheckCircle2, AlertTriangle, Server, Sparkles } from 'lucide-react';
import { NavScreen } from './SidebarRail';
import { HealthStatus, ScenarioMeta } from '../../services/api';

interface HeaderTopBarProps {
  currentScreen: NavScreen;
  onOpenSimulateModal: () => void;
  onExportJson: () => void;
  onOpenSearch: () => void;
  environment: string;
  onChangeEnvironment: (env: string) => void;
  region: string;
  onChangeRegion: (region: string) => void;
  liveStreaming: boolean;
  backendHealth?: HealthStatus | null;
  isBackendOnline?: boolean;
  onSelectScenario?: (scenarioId: string) => void;
  availableScenarios?: ScenarioMeta[];
}

export const HeaderTopBar: React.FC<HeaderTopBarProps> = ({
  currentScreen,
  onOpenSimulateModal,
  onExportJson,
  onOpenSearch,
  environment,
  onChangeEnvironment,
  region,
  onChangeRegion,
  liveStreaming,
  backendHealth,
  isBackendOnline,
  onSelectScenario,
  availableScenarios = [],
}) => {
  const [showScenarioMenu, setShowScenarioMenu] = useState(false);

  const screenTitles: Record<NavScreen, string> = {
    traces: 'Live Network Requests',
    decisions: 'AI Code Fixes & Solutions',
    mesh: 'System Health & Service Map',
    pipelines: 'Live GitHub Repos & CI/CD Pipelines',
    slos: 'System Reliability Goals',
  };

  const defaultScenarios = [
    { id: 'ecommerce_checkout_deadlock', title: '🛒 Checkout Crash (Database Lock)', severity: 'critical' },
    { id: 'llm_rag_vector_bottleneck', title: '🧠 Slow AI Search (N+1 Query Lag)', severity: 'degraded' },
    { id: 'stripe_webhook_connection_starvation', title: '💳 Payment Gateway Timeout (504)', severity: 'critical' },
    { id: 'auth_jwt_cache_stampede', title: '🔑 Login Cache Stampede (429 Rate Limit)', severity: 'error' },
    { id: 'kafka_consumer_lag_spike', title: '📨 Message Queue Lag Spike', severity: 'degraded' },
    { id: 'nominal_fastpath', title: '🟢 Fast Healthy Request (18ms)', severity: 'nominal' },
  ];

  const scenariosList = availableScenarios.length > 0 ? availableScenarios : defaultScenarios;

  return (
    <header className="h-16 bg-white border-b border-[#E8EAF1] px-6 flex items-center justify-between gap-6 sticky top-0 z-30">
      {/* Zone 1: Context Breadcrumb */}
      <div className="flex items-center gap-2 min-w-0">
        <span className="font-display font-semibold text-[14px] text-[#777B8A] whitespace-nowrap">
          DevTrace
        </span>
        <ChevronRight className="w-3.5 h-3.5 text-[#A0A4B4] shrink-0" />
        <div className="flex items-center gap-1.5 bg-[#F7F8FC] border border-[#E8EAF1] rounded-md px-2 py-0.5 text-[12px] font-mono text-[#474554] shrink-0">
          <Globe className="w-3 h-3 text-[#777B8A]" />
          <select
            value={environment}
            onChange={(e) => onChangeEnvironment(e.target.value)}
            className="bg-transparent border-none text-[11px] font-mono font-medium text-[#202333] focus:outline-none cursor-pointer"
          >
            <option value="production">production</option>
            <option value="staging">staging</option>
            <option value="canary">canary</option>
          </select>
          <span className="text-[#A0A4B4]">/</span>
          <select
            value={region}
            onChange={(e) => onChangeRegion(e.target.value)}
            className="bg-transparent border-none text-[11px] font-mono font-medium text-[#202333] focus:outline-none cursor-pointer"
          >
            <option value="us-east-1">us-east-1</option>
            <option value="eu-central-1">eu-central-1</option>
            <option value="ap-southeast-1">ap-southeast-1</option>
          </select>
        </div>
        <ChevronRight className="w-3.5 h-3.5 text-[#A0A4B4] shrink-0 hidden sm:block" />
        <span className="font-display font-semibold text-[14px] text-[#202333] truncate hidden sm:block">
          {screenTitles[currentScreen]}
        </span>
      </div>

      {/* Zone 2: Search Affordance */}
      <div className="hidden md:flex items-center flex-1 max-w-sm">
        <button
          onClick={onOpenSearch}
          className="w-full flex items-center justify-between px-3 h-[38px] bg-[#F7F8FC] border border-[#E8EAF1] rounded-lg text-xs text-[#777B8A] hover:border-[#6558D9]/40 hover:bg-white transition-all text-left"
        >
          <div className="flex items-center gap-2 truncate">
            <Search className="w-4 h-4 text-[#777B8A] shrink-0" />
            <span className="truncate">Search trace ID, endpoint, service...</span>
          </div>
          <kbd className="px-1.5 py-0.5 text-[10px] bg-white border border-[#E8EAF1] rounded text-[#777B8A] font-mono shrink-0 ml-2">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Zone 3: Backend Status, Scenario Dropdown, Primary Actions */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Python Backend Status Pill */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors ${
            isBackendOnline
              ? 'bg-[#F0FDF4] border-[#BBF7D0] text-[#16A36A]'
              : 'bg-[#FFFBEB] border-[#FDE68A] text-[#D97706]'
          }`}
          title={
            isBackendOnline
              ? `Python FastAPI Server Connected (Uptime: ${backendHealth?.uptimeSeconds || 0}s, Traces: ${backendHealth?.totalTracesStored || 0}, AI: Open-Weight ${backendHealth?.openWeightModel || 'Gemma 4'})`
              : 'Python Backend Offline - Start with: python backend/run_server.py'
          }
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isBackendOnline ? 'bg-[#16A36A] animate-pulse' : 'bg-[#D97706]'
            }`}
          />
          <span className="font-mono hidden sm:inline">
            {isBackendOnline ? 'Gemma 4 AI Online' : 'Backend Offline'}
          </span>
        </div>

        {/* Real-Life Scenarios Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowScenarioMenu(!showScenarioMenu)}
            className="h-[38px] px-3.5 rounded-lg border border-[#6558D9]/30 bg-[#6558D9]/10 hover:bg-[#6558D9]/20 text-[#6558D9] text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shadow-xs"
            title="Inject real-life production microservice failure scenarios"
          >
            <Zap className="w-3.5 h-3.5 fill-[#6558D9]" />
            <span className="hidden sm:inline">⚡ Test Real Scenarios</span>
          </button>

          {showScenarioMenu && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-[#E8EAF1] py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-3 py-2 border-b border-[#E8EAF1] mb-1 bg-[#F7F8FC]/60">
                <span className="text-[11px] font-semibold text-[#202333] uppercase tracking-wider block">
                  Simulate Real Production Issues
                </span>
                <p className="text-[11px] text-[#777B8A] mt-0.5">
                  Click any failure below to see how DevTrace diagnoses the root cause & suggests an instant fix.
                </p>
              </div>

              {scenariosList.map((scen) => (
                <button
                  key={scen.id}
                  onClick={() => {
                    setShowScenarioMenu(false);
                    if (onSelectScenario) onSelectScenario(scen.id);
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-[#F7F8FC] flex items-center justify-between text-xs transition-colors"
                >
                  <span className="font-medium text-[#202333] truncate pr-2">
                    {scen.title}
                  </span>
                  <span
                    className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-mono font-semibold shrink-0 ${
                      scen.severity === 'critical'
                        ? 'bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]'
                        : scen.severity === 'error'
                        ? 'bg-[#FFF7ED] text-[#EA580C] border border-[#FED7AA]'
                        : scen.severity === 'degraded'
                        ? 'bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]'
                        : 'bg-[#F0FDF4] text-[#16A36A] border border-[#BBF7D0]'
                    }`}
                  >
                    {scen.severity}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Export JSON */}
        <button
          onClick={onExportJson}
          className="h-[38px] px-3 rounded-lg border border-[#E8EAF1] bg-white hover:bg-[#F7F8FC] text-[#202333] text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap"
          title="Export current telemetry dataset to JSON"
        >
          <Download className="w-3.5 h-3.5 text-[#777B8A]" />
          <span className="hidden lg:inline">Export</span>
        </button>

        {/* Simulate Trace Button */}
        <button
          onClick={onOpenSimulateModal}
          className="h-[38px] px-3.5 rounded-lg bg-[#6558D9] hover:bg-[#8B7CF6] active:scale-[0.99] text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all whitespace-nowrap"
        >
          <Play className="w-3 h-3 fill-white text-white" />
          <span>Simulate</span>
        </button>
      </div>
    </header>
  );
};
