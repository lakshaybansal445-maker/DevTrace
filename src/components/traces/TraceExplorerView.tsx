import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Clock,
  Sparkles,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';
import { Trace } from '../../types/telemetry';

interface TraceExplorerViewProps {
  traces: Trace[];
  onSelectTrace: (trace: Trace) => void;
  selectedTraceId?: string;
  onOpenSimulateModal: () => void;
  onSelectScenario?: (scenarioId: string) => void;
}

export const TraceExplorerView: React.FC<TraceExplorerViewProps> = ({
  traces,
  onSelectTrace,
  selectedTraceId,
  onOpenSimulateModal,
  onSelectScenario,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedService, setSelectedService] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'duration' | 'timestamp'>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [hoveredTrace, setHoveredTrace] = useState<Trace | null>(null);

  // Extract unique services
  const services = useMemo(() => {
    const set = new Set<string>();
    traces.forEach((t) => set.add(t.rootService));
    return ['all', ...Array.from(set)];
  }, [traces]);

  // Compute live telemetry aggregates
  const metrics = useMemo(() => {
    const total = traces.length;
    if (total === 0) return { p50: 0, p95: 0, p99: 0, errorRate: 0, totalSpans: 0 };

    const sortedDurations = [...traces].map((t) => t.durationMs).sort((a, b) => a - b);
    const p50 = sortedDurations[Math.floor(total * 0.5)] || 0;
    const p95 = sortedDurations[Math.floor(total * 0.95)] || 0;
    const p99 = sortedDurations[Math.floor(total * 0.99)] || sortedDurations[total - 1] || 0;

    const errorCount = traces.filter((t) => t.status === 'error' || t.status === 'critical').length;
    const degradedCount = traces.filter((t) => t.status === 'degraded').length;
    const healthyCount = traces.filter((t) => t.status === 'nominal').length;
    const errorRate = total > 0 ? (errorCount / total) * 100 : 0;
    const totalSpans = traces.reduce((acc, t) => acc + t.spanCount, 0);

    return { p50, p95, p99, errorRate, totalSpans, healthyCount, degradedCount, errorCount, total };
  }, [traces]);

  // Filtered & sorted traces
  const filteredTraces = useMemo(() => {
    return traces
      .filter((trace) => {
        const matchesQuery =
          searchQuery === '' ||
          trace.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          trace.rootEndpoint.toLowerCase().includes(searchQuery.toLowerCase()) ||
          trace.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesService =
          selectedService === 'all' || trace.rootService === selectedService;

        const matchesStatus =
          selectedStatus === 'all' ||
          (selectedStatus === 'error' && (trace.status === 'error' || trace.status === 'critical')) ||
          trace.status === selectedStatus;

        return matchesQuery && matchesService && matchesStatus;
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortBy === 'duration') {
          diff = a.durationMs - b.durationMs;
        } else {
          diff = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        }
        return sortOrder === 'desc' ? -diff : diff;
      });
  }, [traces, searchQuery, selectedService, selectedStatus, sortBy, sortOrder]);

  const maxDuration = Math.max(...traces.map((t) => t.durationMs), 1300);

  return (
    <div className="space-y-6">
      {/* Interactive Scenario Cards Header: One-Click Testing */}
      {onSelectScenario && (
        <div className="bg-white rounded-xl border border-[#E8EAF1] p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-[#E8EAF1]">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#6558D9]/10 flex items-center justify-center text-[#6558D9] shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-display font-semibold text-sm text-[#202333]">
                  Test Real Microservice Failures (Interactive)
                </h2>
                <p className="text-xs text-[#777B8A]">
                  Click any card to inject a real failure scenario and see how DevTrace diagnoses the bug in real-time.
                </p>
              </div>
            </div>
            <span className="text-[11px] font-mono font-medium text-[#16A36A] bg-[#F0FDF4] border border-[#BBF7D0] px-2.5 py-1 rounded-full self-start sm:self-center">
              ● Live OTel Ingestion Active
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Card 1: Checkout Deadlock */}
            <button
              onClick={() => onSelectScenario('ecommerce_checkout_deadlock')}
              className="text-left p-3 rounded-lg border border-[#FECACA] bg-[#FEF2F2]/60 hover:bg-[#FEF2F2] hover:border-[#DC2626]/50 transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-[#DC2626] mb-1">
                  <span>🛒 Checkout Crash</span>
                  <span className="text-[10px] font-mono bg-white px-1.5 py-0.5 rounded border border-[#FECACA]">500</span>
                </div>
                <p className="text-[11px] text-[#777B8A] leading-snug">
                  Two buyers order the last item simultaneously. Database locks up.
                </p>
              </div>
              <div className="mt-3 flex items-center text-[11px] font-semibold text-[#DC2626] group-hover:underline">
                <span>Inject Bug →</span>
              </div>
            </button>

            {/* Card 2: AI Vector Bottleneck */}
            <button
              onClick={() => onSelectScenario('llm_rag_vector_bottleneck')}
              className="text-left p-3 rounded-lg border border-[#FDE68A] bg-[#FFFBEB]/60 hover:bg-[#FFFBEB] hover:border-[#D97706]/50 transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-[#D97706] mb-1">
                  <span>🧠 Slow AI Search</span>
                  <span className="text-[10px] font-mono bg-white px-1.5 py-0.5 rounded border border-[#FDE68A]">1,020ms</span>
                </div>
                <p className="text-[11px] text-[#777B8A] leading-snug">
                  Unbatched queries cause AI embeddings search to lag.
                </p>
              </div>
              <div className="mt-3 flex items-center text-[11px] font-semibold text-[#D97706] group-hover:underline">
                <span>Inject Lag →</span>
              </div>
            </button>

            {/* Card 3: Stripe Webhook 504 */}
            <button
              onClick={() => onSelectScenario('stripe_webhook_connection_starvation')}
              className="text-left p-3 rounded-lg border border-[#FED7AA] bg-[#FFF7ED]/60 hover:bg-[#FFF7ED] hover:border-[#EA580C]/50 transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-[#EA580C] mb-1">
                  <span>💳 Payment Timeout</span>
                  <span className="text-[10px] font-mono bg-white px-1.5 py-0.5 rounded border border-[#FED7AA]">504</span>
                </div>
                <p className="text-[11px] text-[#777B8A] leading-snug">
                  Webhook traffic flood exhausts database connection pool.
                </p>
              </div>
              <div className="mt-3 flex items-center text-[11px] font-semibold text-[#EA580C] group-hover:underline">
                <span>Inject Timeout →</span>
              </div>
            </button>

            {/* Card 4: Login 429 */}
            <button
              onClick={() => onSelectScenario('auth_jwt_cache_stampede')}
              className="text-left p-3 rounded-lg border border-[#DDD6FE] bg-[#F5F3FF]/60 hover:bg-[#F5F3FF] hover:border-[#7C3AED]/50 transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-[#7C3AED] mb-1">
                  <span>🔑 Login 429 Rate Limit</span>
                  <span className="text-[10px] font-mono bg-white px-1.5 py-0.5 rounded border border-[#DDD6FE]">429</span>
                </div>
                <p className="text-[11px] text-[#777B8A] leading-snug">
                  Auth cache expires, causing 600 users to flood identity provider.
                </p>
              </div>
              <div className="mt-3 flex items-center text-[11px] font-semibold text-[#7C3AED] group-hover:underline">
                <span>Inject Stampede →</span>
              </div>
            </button>

            {/* Card 5: Nominal Fast-Path */}
            <button
              onClick={() => onSelectScenario('nominal_fastpath')}
              className="text-left p-3 rounded-lg border border-[#BBF7D0] bg-[#F0FDF4]/60 hover:bg-[#F0FDF4] hover:border-[#16A36A]/50 transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-[#16A36A] mb-1">
                  <span>🟢 Fast Healthy</span>
                  <span className="text-[10px] font-mono bg-white px-1.5 py-0.5 rounded border border-[#BBF7D0]">18ms</span>
                </div>
                <p className="text-[11px] text-[#777B8A] leading-snug">
                  Smooth normal request served instantly from cache.
                </p>
              </div>
              <div className="mt-3 flex items-center text-[11px] font-semibold text-[#16A36A] group-hover:underline">
                <span>Send Healthy →</span>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* KPI Metrics Strip: Plain English, Easy to Understand */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* KPI 1: Total Requests */}
        <div
          className="bg-white rounded-xl border border-[#E8EAF1] p-4 transition-all"
          style={{ boxShadow: '0 1px 3px 0 rgba(32, 35, 51, 0.03)' }}
        >
          <div className="text-[12px] font-medium text-[#777B8A] mb-1">Total Requests Tracked</div>
          <div className="flex items-baseline gap-2">
            <span className="font-display font-semibold text-2xl text-[#202333] tabular-nums">
              {metrics.total}
            </span>
            <span className="text-xs text-[#777B8A] font-mono">live traces</span>
          </div>
          <div className="mt-2 text-[11px] text-[#16A36A] flex items-center gap-1 font-medium">
            <span>✓ Ingestion active</span>
            <span className="text-[#777B8A]">· streaming live</span>
          </div>
        </div>

        {/* KPI 2: Healthy Requests */}
        <div
          className="bg-white rounded-xl border border-[#E8EAF1] p-4 transition-all"
          style={{ boxShadow: '0 1px 3px 0 rgba(32, 35, 51, 0.03)' }}
        >
          <div className="text-[12px] font-medium text-[#777B8A] mb-1">Healthy Requests (Fast)</div>
          <div className="flex items-baseline gap-2">
            <span className="font-display font-semibold text-2xl text-[#16A36A] tabular-nums">
              {metrics.healthyCount}
            </span>
            <span className="text-xs text-[#777B8A] font-mono">
              {metrics.total > 0 ? `${((metrics.healthyCount / metrics.total) * 100).toFixed(0)}%` : '100%'}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-[#777B8A] flex items-center gap-1 font-medium">
            <span>&lt;250ms nominal latency</span>
          </div>
        </div>

        {/* KPI 3: Issues / Errors */}
        <div
          className="bg-white rounded-xl border border-[#E8EAF1] p-4 transition-all"
          style={{ boxShadow: '0 1px 3px 0 rgba(32, 35, 51, 0.03)' }}
        >
          <div className="text-[12px] font-medium text-[#777B8A] mb-1">Issues &amp; Errors Found</div>
          <div className="flex items-baseline gap-2">
            <span
              className={`font-display font-semibold text-2xl tabular-nums ${
                metrics.errorCount > 0 ? 'text-[#DC6262]' : 'text-[#202333]'
              }`}
            >
              {metrics.errorCount + metrics.degradedCount}
            </span>
            <span className="text-xs text-[#777B8A] font-mono">
              ({metrics.errorCount} crashed, {metrics.degradedCount} slow)
            </span>
          </div>
          <div className="mt-2 text-[11px] text-[#6558D9] flex items-center gap-1 font-medium">
            <span>✨ AI diagnoses available</span>
          </div>
        </div>

        {/* KPI 4: Speed P50 / P95 */}
        <div
          className="bg-white rounded-xl border border-[#E8EAF1] p-4 transition-all"
          style={{ boxShadow: '0 1px 3px 0 rgba(32, 35, 51, 0.03)' }}
        >
          <div className="text-[12px] font-medium text-[#777B8A] mb-1">Typical Speed (P50 / P95)</div>
          <div className="flex items-baseline gap-2">
            <span className="font-display font-semibold text-2xl text-[#202333] tabular-nums">
              {metrics.p50.toFixed(0)}
              <span className="text-base text-[#777B8A] font-normal font-sans"> / </span>
              {metrics.p95.toFixed(0)}
            </span>
            <span className="text-xs text-[#777B8A] font-mono">ms</span>
          </div>
          <div className="mt-2 text-[11px] text-[#777B8A] flex items-center gap-1 font-medium">
            <span>{metrics.totalSpans} microservice spans</span>
          </div>
        </div>
      </div>

      {/* Latency Scatter / Request Timeline Visualizer */}
      <div
        className="bg-white rounded-xl border border-[#E8EAF1] p-5 transition-all"
        style={{ boxShadow: '0 1px 3px 0 rgba(32, 35, 51, 0.03)' }}
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#E8EAF1] mb-4">
          <div>
            <h2 className="font-display font-semibold text-[15px] text-[#202333]">
              Request Speed Visualizer
            </h2>
            <p className="text-xs text-[#777B8A]">
              Every dot is a network request. Click any dot to see its step-by-step breakdown and AI fix.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs text-[#777B8A]">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#16A36A]" /> 🟢 Fast (&lt;250ms)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E5A23B]" /> 🟡 Slow (&gt;500ms)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#DC6262]" /> 🔴 Error / Crash
            </span>
          </div>
        </div>

        {/* SVG Scatter Plot */}
        <div className="relative h-44 w-full bg-[#F7F8FC] rounded-lg border border-[#E8EAF1] overflow-hidden p-3">
          {/* Grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between p-3 pointer-events-none opacity-30">
            <div className="border-b border-[#787585] text-[10px] font-mono text-[#787585]">1200ms</div>
            <div className="border-b border-[#787585] text-[10px] font-mono text-[#787585]">600ms</div>
            <div className="border-b border-[#787585] text-[10px] font-mono text-[#787585]">200ms</div>
            <div className="border-b border-[#787585] text-[10px] font-mono text-[#787585]">0ms</div>
          </div>

          <svg className="w-full h-full relative z-10 overflow-visible">
            {traces.map((trace, idx) => {
              const xPercent = ((idx + 0.6) / (traces.length + 0.5)) * 96;
              const yPercent = 90 - Math.min((trace.durationMs / 1300) * 80, 85);
              const isSelected = selectedTraceId === trace.id;

              let fillColor = '#16A36A';
              if (trace.status === 'degraded') fillColor = '#E5A23B';
              if (trace.status === 'error' || trace.status === 'critical') fillColor = '#DC6262';

              return (
                <g key={trace.id} className="cursor-pointer group">
                  {/* Selected ring */}
                  {isSelected && (
                    <circle
                      cx={`${xPercent}%`}
                      cy={`${yPercent}%`}
                      r="9"
                      fill="none"
                      stroke="#6558D9"
                      strokeWidth="2"
                      className="animate-pulse"
                    />
                  )}
                  {/* Point */}
                  <circle
                    cx={`${xPercent}%`}
                    cy={`${yPercent}%`}
                    r={isSelected ? '6' : '5'}
                    fill={fillColor}
                    stroke="#FFFFFF"
                    strokeWidth="1.5"
                    className="transition-transform duration-150 group-hover:scale-150"
                    onClick={() => onSelectTrace(trace)}
                    onMouseEnter={() => setHoveredTrace(trace)}
                    onMouseLeave={() => setHoveredTrace(null)}
                  />
                  {/* Label on hover */}
                  <text
                    x={`${xPercent}%`}
                    y={`${yPercent - 9}%`}
                    textAnchor="middle"
                    className="text-[10px] font-mono fill-[#202333] opacity-0 group-hover:opacity-100 font-semibold pointer-events-none transition-opacity"
                  >
                    {trace.durationMs.toFixed(0)}ms
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Hover tooltip card */}
          {hoveredTrace && (
            <div
              className="absolute bottom-2 right-2 bg-white/95 backdrop-blur-sm border border-[#E8EAF1] rounded-lg p-2.5 text-xs shadow-md pointer-events-none z-20 flex items-center gap-3 animate-in fade-in duration-100"
            >
              <div>
                <span className="font-mono font-semibold text-[#6558D9]">{hoveredTrace.id}</span>
                <span className="mx-1.5 text-[#A0A4B4]">·</span>
                <span className="font-mono text-[#202333]">{hoveredTrace.rootEndpoint}</span>
              </div>
              <span className="font-mono font-bold tabular-nums text-[#202333]">
                {hoveredTrace.durationMs.toFixed(1)}ms
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div
        className="bg-white rounded-xl border border-[#E8EAF1] p-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between"
        style={{ boxShadow: '0 1px 3px 0 rgba(32, 35, 51, 0.03)' }}
      >
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#777B8A] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search endpoint, trace ID, error..."
            className="w-full h-[38px] pl-9 pr-3 text-xs bg-white border border-[#E8EAF1] rounded-lg text-[#202333] placeholder-[#A0A4B4] focus:outline-none focus:border-[#6558D9] focus:ring-2 focus:ring-[#6558D9]/15 transition-all"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Service filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-[#777B8A] whitespace-nowrap">Service:</span>
            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              className="h-[38px] px-2.5 text-xs bg-white border border-[#E8EAF1] rounded-lg text-[#202333] focus:outline-none focus:border-[#6558D9] focus:ring-2 focus:ring-[#6558D9]/15 cursor-pointer font-mono"
            >
              {services.map((svc) => (
                <option key={svc} value={svc}>
                  {svc === 'all' ? 'All Services' : svc}
                </option>
              ))}
            </select>
          </div>

          {/* Status filter segmented control */}
          <div className="flex items-center gap-1 p-1 bg-[#F7F8FC] border border-[#E8EAF1] rounded-lg">
            {[
              { id: 'all', label: 'All Requests' },
              { id: 'nominal', label: '🟢 Healthy' },
              { id: 'degraded', label: '🟡 Slow' },
              { id: 'error', label: '🔴 Issues' },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setSelectedStatus(st.id)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  selectedStatus === st.id
                    ? 'bg-white text-[#202333] shadow-sm font-semibold'
                    : 'text-[#777B8A] hover:text-[#202333]'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          {/* Sort toggler */}
          <button
            onClick={() => {
              if (sortBy === 'duration') {
                setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
              } else {
                setSortBy('duration');
                setSortOrder('desc');
              }
            }}
            className={`h-[38px] px-3 rounded-lg border text-xs flex items-center gap-1.5 transition-colors ${
              sortBy === 'duration'
                ? 'bg-[#F3F2FF] border-[#6558D9]/40 text-[#6558D9] font-medium'
                : 'bg-white border-[#E8EAF1] text-[#777B8A] hover:text-[#202333]'
            }`}
            title="Sort by response time"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>Speed {sortBy === 'duration' ? (sortOrder === 'desc' ? '↓ Slowest' : '↑ Fastest') : ''}</span>
          </button>
        </div>
      </div>

      {/* High-Density Trace Table */}
      <div
        className="bg-white rounded-xl border border-[#E8EAF1] overflow-hidden transition-all"
        style={{ boxShadow: '0 1px 3px 0 rgba(32, 35, 51, 0.03)' }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#E8EAF1] bg-[#F7F8FC]/60 text-[#777B8A] font-display font-semibold">
                <th className="py-3 px-4">Trace ID</th>
                <th className="py-3 px-4">Endpoint &amp; Path</th>
                <th className="py-3 px-4">Microservice</th>
                <th className="py-3 px-4 w-44">Response Time</th>
                <th className="py-3 px-4 text-center">Steps</th>
                <th className="py-3 px-4 text-center">Health Status</th>
                <th className="py-3 px-4 text-right">Time Ago</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8EAF1]">
              {filteredTraces.map((trace) => {
                const isSelected = selectedTraceId === trace.id;
                const durationRatio = Math.min((trace.durationMs / maxDuration) * 100, 100);
                const isError = trace.status === 'error' || trace.status === 'critical';

                let statusBadge = (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-[#F0FDF4] text-[#16A36A] border border-[#BBF7D0]">
                    ● {trace.statusCode} Healthy
                  </span>
                );

                if (trace.status === 'degraded') {
                  statusBadge = (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-[#FFFBEB] text-[#E5A23B] border border-[#FDE68A]">
                      ▲ {trace.statusCode} Slow Lag
                    </span>
                  );
                } else if (isError) {
                  statusBadge = (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-[#FEF2F2] text-[#DC6262] border border-[#FECACA]">
                      ✕ {trace.statusCode} Failed
                    </span>
                  );
                }

                return (
                  <tr
                    key={trace.id}
                    onClick={() => onSelectTrace(trace)}
                    className={`cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#F3F2FF] border-l-4 border-l-[#6558D9]'
                        : 'hover:bg-[#F7F8FC]'
                    }`}
                  >
                    {/* Trace ID */}
                    <td className="py-3.5 px-4 font-mono font-medium text-[#6558D9] whitespace-nowrap">
                      {trace.id}
                    </td>

                    {/* Endpoint */}
                    <td className="py-3.5 px-4 font-mono text-[#202333] whitespace-nowrap max-w-xs truncate">
                      <span className="text-[#777B8A] font-normal mr-1.5">{trace.httpMethod}</span>
                      <span className="font-medium">{trace.rootEndpoint}</span>
                    </td>

                    {/* Service */}
                    <td className="py-3.5 px-4 text-[#474554] font-medium whitespace-nowrap">
                      {trace.rootService}
                    </td>

                    {/* Duration with kinetic bar indicator */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono font-semibold text-[#202333] tabular-nums text-[12px] min-w-14">
                          {trace.durationMs.toFixed(1)}ms
                        </span>
                        <div className="flex-1 h-1.5 bg-[#E8EAF1] rounded-full overflow-hidden max-w-[80px]">
                          <div
                            className={`h-full rounded-full ${
                              trace.status === 'nominal'
                                ? 'bg-[#16A36A]'
                                : trace.status === 'degraded'
                                ? 'bg-[#E5A23B]'
                                : 'bg-[#DC6262]'
                            }`}
                            style={{ width: `${Math.max(durationRatio, 8)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Spans */}
                    <td className="py-3.5 px-4 text-center font-mono tabular-nums text-[#777B8A]">
                      {trace.spanCount}
                    </td>

                    {/* Status Chip */}
                    <td className="py-3.5 px-4 text-center">{statusBadge}</td>

                    {/* Age */}
                    <td className="py-3.5 px-4 text-right text-[#777B8A] font-mono text-[11px] whitespace-nowrap">
                      {trace.relativeTime}
                    </td>

                    {/* Inspect Button */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectTrace(trace);
                        }}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                          isError
                            ? 'bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA] hover:bg-[#FEE2E2]'
                            : trace.status === 'degraded'
                            ? 'bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A] hover:bg-[#FEF3C7]'
                            : 'text-[#6558D9] bg-[#ECECFF] hover:bg-[#E0E0FF]'
                        }`}
                      >
                        {isError ? '🔍 See What Broke →' : 'Inspect Steps →'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Empty state */}
        {filteredTraces.length === 0 && (
          <div className="py-12 text-center">
            <AlertCircle className="w-8 h-8 text-[#A0A4B4] mx-auto mb-2" />
            <div className="text-sm font-semibold text-[#202333]">No traces match your filter</div>
            <p className="text-xs text-[#777B8A] mt-1 mb-4">
              Try adjusting your search criteria, selecting all services, or simulate a new trace.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedService('all');
                setSelectedStatus('all');
              }}
              className="px-4 py-2 bg-white border border-[#E8EAF1] rounded-lg text-xs font-medium text-[#202333] hover:bg-[#F7F8FC] transition-colors"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Footer pagination info */}
        <div className="p-3 border-t border-[#E8EAF1] bg-[#F7F8FC]/50 flex items-center justify-between text-xs text-[#777B8A]">
          <div>
            Showing <span className="font-semibold text-[#202333]">{filteredTraces.length}</span> of{' '}
            <span className="font-semibold text-[#202333]">{traces.length}</span> ingested traces
          </div>
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <span>Buffer: 100% healthy</span>
            <span className="text-[#A0A4B4]">·</span>
            <span>OTLP Exporter: Connected</span>
          </div>
        </div>
      </div>
    </div>
  );
};
