import React, { useState } from 'react';
import {
  Network,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  Cpu,
  Layers,
  Zap,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { ServiceNode } from '../../types/telemetry';

interface ServiceMeshViewProps {
  services: ServiceNode[];
  onSelectServiceTrace: (serviceId: string) => void;
  onUpdateServiceHealth?: (serviceId: string, delta: number) => void;
}

export const ServiceMeshView: React.FC<ServiceMeshViewProps> = ({
  services,
  onSelectServiceTrace,
  onUpdateServiceHealth,
}) => {
  const [selectedServiceId, setSelectedServiceId] = useState<string>('vector-inference-engine');
  const [latencyInjectionMs, setLatencyInjectionMs] = useState<number>(0);
  const [simulatingChaos, setSimulatingChaos] = useState(false);

  const selectedService = services.find((s) => s.id === selectedServiceId) || services[0];

  const handleSimulateChaos = () => {
    setSimulatingChaos(true);
    setTimeout(() => {
      setSimulatingChaos(false);
      if (onUpdateServiceHealth) {
        onUpdateServiceHealth(selectedService.id, -15);
      }
    }, 1200);
  };

  const handleHealService = () => {
    if (onUpdateServiceHealth) {
      onUpdateServiceHealth(selectedService.id, 20);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-semibold text-xl text-[#202333] flex items-center gap-2">
            <Network className="w-5 h-5 text-[#6558D9]" />
            <span>Kinetic Service Topology & Mesh</span>
          </h1>
          <p className="text-xs text-[#777B8A] mt-0.5">
            Real-time directed acyclic graph (DAG) of active RPC mesh communication, inter-service latency, and dependency propagation.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs text-[#777B8A]">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#16A36A]" /> Nominal (≥95)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E5A23B]" /> Degraded (&lt;90)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#DC6262]" /> Critical (&lt;80)
          </span>
        </div>
      </div>

      {/* Main Split: Interactive Graph on left, Service Telemetry Inspector on right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive Mesh Topology Canvas */}
        <div
          className="lg:col-span-2 bg-white rounded-xl border border-[#E8EAF1] p-4 flex flex-col"
          style={{ boxShadow: '0 1px 3px 0 rgba(32, 35, 51, 0.03)' }}
        >
          <div className="flex items-center justify-between pb-3 border-b border-[#E8EAF1] mb-2 text-xs">
            <span className="font-display font-semibold text-[#202333]">
              Active Mesh Interconnects
            </span>
            <span className="text-[#777B8A] font-mono text-[11px]">
              Protocol: Envoy gRPC / mTLS v1.3
            </span>
          </div>

          {/* Topology Canvas SVG */}
          <div className="relative w-full h-[420px] bg-[#F7F8FC] rounded-lg border border-[#E8EAF1] overflow-hidden">
            {/* Grid background dots */}
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: 'radial-gradient(#787585 1px, transparent 1px)',
                backgroundSize: '20px 20px',
              }}
            />

            <svg className="w-full h-full relative z-10">
              <defs>
                <marker
                  id="arrow"
                  viewBox="0 0 10 10"
                  refX="18"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#C8C4D6" />
                </marker>
              </defs>

              {/* Dependency Links */}
              {services.map((source) => {
                return source.dependencies.map((targetId) => {
                  const target = services.find((s) => s.id === targetId);
                  if (!target) return null;

                  const isSourceSelected = source.id === selectedServiceId;
                  const isTargetSelected = target.id === selectedServiceId;
                  const isHighlighted = isSourceSelected || isTargetSelected;

                  return (
                    <line
                      key={`${source.id}->${target.id}`}
                      x1={source.x}
                      y1={source.y}
                      x2={target.x}
                      y2={target.y}
                      stroke={isHighlighted ? '#6558D9' : '#C8C4D6'}
                      strokeWidth={isHighlighted ? 2.5 : 1.5}
                      strokeDasharray={isHighlighted ? '4,4' : undefined}
                      className={isHighlighted ? 'animate-pulse' : ''}
                      markerEnd="url(#arrow)"
                    />
                  );
                });
              })}

              {/* Service Nodes */}
              {services.map((service) => {
                const isSelected = selectedServiceId === service.id;

                let statusColor = '#16A36A';
                if (service.status === 'degraded') statusColor = '#E5A23B';
                if (service.status === 'critical') statusColor = '#DC6262';

                return (
                  <g
                    key={service.id}
                    className="cursor-pointer"
                    onClick={() => setSelectedServiceId(service.id)}
                  >
                    {/* Selected halo */}
                    {isSelected && (
                      <rect
                        x={service.x - 72}
                        y={service.y - 28}
                        width="144"
                        height="56"
                        rx="12"
                        fill="none"
                        stroke="#6558D9"
                        strokeWidth="2.5"
                        strokeDasharray="4,2"
                        className="animate-pulse"
                      />
                    )}

                    {/* Node card */}
                    <rect
                      x={service.x - 68}
                      y={service.y - 24}
                      width="136"
                      height="48"
                      rx="10"
                      fill="#FFFFFF"
                      stroke={isSelected ? '#6558D9' : '#E8EAF1'}
                      strokeWidth="1.5"
                      filter="drop-shadow(0 2px 4px rgba(32,35,51,0.06))"
                    />

                    {/* Status dot */}
                    <circle
                      cx={service.x - 52}
                      cy={service.y}
                      r="4"
                      fill={statusColor}
                    />

                    {/* Service Name */}
                    <text
                      x={service.x - 42}
                      y={service.y - 3}
                      className="text-[11px] font-display font-semibold fill-[#202333] select-none"
                    >
                      {service.name.length > 13 ? service.name.slice(0, 12) + '…' : service.name}
                    </text>

                    {/* Subtext: RPS & Latency */}
                    <text
                      x={service.x - 42}
                      y={service.y + 11}
                      className="text-[9px] font-mono fill-[#777B8A] select-none"
                    >
                      {service.rps} rps · {service.p99LatencyMs.toFixed(0)}ms
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Instruction footnote */}
            <div className="absolute bottom-2 left-2 text-[10px] text-[#777B8A] bg-white/80 backdrop-blur-xs px-2 py-1 rounded border border-[#E8EAF1]">
              Click any service node to inspect downstream dependencies & stress test.
            </div>
          </div>
        </div>

        {/* Selected Service Detailed Inspector Pane */}
        {selectedService && (
          <div
            className="bg-white rounded-xl border border-[#E8EAF1] p-5 space-y-5 flex flex-col justify-between"
            style={{ boxShadow: '0 1px 3px 0 rgba(32, 35, 51, 0.03)' }}
          >
            <div>
              {/* Header */}
              <div className="pb-3 border-b border-[#E8EAF1]">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-mono text-[#777B8A] uppercase">
                    Service Inspector
                  </span>
                  <span
                    className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full ${
                      selectedService.status === 'healthy'
                        ? 'bg-[#F0FDF4] text-[#16A36A] border border-[#BBF7D0]'
                        : selectedService.status === 'degraded'
                        ? 'bg-[#FFFBEB] text-[#E5A23B] border border-[#FDE68A]'
                        : 'bg-[#FEF2F2] text-[#DC6262] border border-[#FECACA]'
                    }`}
                  >
                    {selectedService.status.toUpperCase()}
                  </span>
                </div>
                <h3 className="font-display font-semibold text-lg text-[#202333]">
                  {selectedService.name}
                </h3>
                <span className="text-xs font-mono text-[#6558D9]">{selectedService.id}</span>
              </div>

              {/* Core Telemetry Stats */}
              <div className="grid grid-cols-2 gap-3 my-4">
                <div className="p-3 bg-[#F7F8FC] rounded-lg border border-[#E8EAF1]">
                  <div className="text-[11px] text-[#777B8A]">Health Index</div>
                  <div className="font-display font-bold text-lg text-[#202333] tabular-nums">
                    {selectedService.healthScore.toFixed(1)}
                    <span className="text-xs font-normal text-[#777B8A]">/100</span>
                  </div>
                </div>

                <div className="p-3 bg-[#F7F8FC] rounded-lg border border-[#E8EAF1]">
                  <div className="text-[11px] text-[#777B8A]">P99 Latency</div>
                  <div className="font-display font-bold text-lg text-[#202333] tabular-nums">
                    {selectedService.p99LatencyMs.toFixed(1)}
                    <span className="text-xs font-normal text-[#777B8A]">ms</span>
                  </div>
                </div>

                <div className="p-3 bg-[#F7F8FC] rounded-lg border border-[#E8EAF1]">
                  <div className="text-[11px] text-[#777B8A]">Throughput</div>
                  <div className="font-display font-bold text-lg text-[#202333] tabular-nums">
                    {selectedService.rps}
                    <span className="text-xs font-normal text-[#777B8A]">rps</span>
                  </div>
                </div>

                <div className="p-3 bg-[#F7F8FC] rounded-lg border border-[#E8EAF1]">
                  <div className="text-[11px] text-[#777B8A]">Error Rate</div>
                  <div
                    className={`font-display font-bold text-lg tabular-nums ${
                      selectedService.errorRatePercent > 1 ? 'text-[#DC6262]' : 'text-[#202333]'
                    }`}
                  >
                    {selectedService.errorRatePercent.toFixed(2)}
                    <span className="text-xs font-normal text-[#777B8A]">%</span>
                  </div>
                </div>
              </div>

              {/* Downstream Dependencies List */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-[#202333] flex items-center justify-between">
                  <span>Downstream Dependencies</span>
                  <span className="font-mono text-[11px] text-[#777B8A]">
                    {selectedService.dependencies.length} targets
                  </span>
                </div>
                {selectedService.dependencies.length > 0 ? (
                  <div className="space-y-1">
                    {selectedService.dependencies.map((depId) => {
                      const dep = services.find((s) => s.id === depId);
                      return (
                        <div
                          key={depId}
                          onClick={() => setSelectedServiceId(depId)}
                          className="flex items-center justify-between p-2 rounded-lg border border-[#E8EAF1] bg-[#F7F8FC] hover:bg-[#F3F2FF] cursor-pointer text-xs transition-colors"
                        >
                          <span className="font-medium text-[#202333]">{dep?.name || depId}</span>
                          <span className="font-mono text-[11px] text-[#777B8A]">
                            {dep?.p99LatencyMs.toFixed(0)}ms p99 →
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-2.5 rounded-lg border border-dashed border-[#E8EAF1] text-[11px] text-[#777B8A] text-center">
                    Leaf node — no downstream dependencies.
                  </div>
                )}
              </div>

              {/* Synthetic Resilience Simulator */}
              <div className="mt-5 pt-4 border-t border-[#E8EAF1] space-y-3">
                <div className="text-xs font-semibold text-[#202333] flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-[#6558D9]" />
                  <span>Resilience Stress Simulation</span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleSimulateChaos}
                    disabled={simulatingChaos}
                    className="flex-1 py-2 px-3 rounded-lg border border-[#DC6262]/40 bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#DC6262] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>{simulatingChaos ? 'Simulating Fault...' : 'Inject Chaos Fault'}</span>
                  </button>

                  <button
                    onClick={handleHealService}
                    className="py-2 px-3 rounded-lg border border-[#BBF7D0] bg-[#F0FDF4] hover:bg-[#DCFCE7] text-[#16A36A] text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                    title="Restore service health score"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Heal</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Jump to Service Traces */}
            <button
              onClick={() => onSelectServiceTrace(selectedService.id)}
              className="w-full mt-4 py-2.5 px-4 bg-[#6558D9] hover:bg-[#8B7CF6] text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <Activity className="w-4 h-4" />
              <span>Inspect Traces for {selectedService.name}</span>
            </button>
          </div>
        )}
      </div>

      {/* Complete Microservices Table */}
      <div
        className="bg-white rounded-xl border border-[#E8EAF1] overflow-hidden"
        style={{ boxShadow: '0 1px 3px 0 rgba(32, 35, 51, 0.03)' }}
      >
        <div className="p-4 border-b border-[#E8EAF1] flex items-center justify-between">
          <h2 className="font-display font-semibold text-[15px] text-[#202333]">
            Microservices Fleet Registry
          </h2>
          <span className="text-xs text-[#777B8A] font-mono">
            {services.length} active mesh nodes
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E8EAF1] bg-[#F7F8FC]/60 text-[#777B8A] font-display font-semibold">
                <th className="py-3 px-4">Service</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Version</th>
                <th className="py-3 px-4 text-right">Throughput</th>
                <th className="py-3 px-4 text-right">P99 Latency</th>
                <th className="py-3 px-4 text-right">Error %</th>
                <th className="py-3 px-4 text-center">Health</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8EAF1]">
              {services.map((svc) => (
                <tr
                  key={svc.id}
                  onClick={() => setSelectedServiceId(svc.id)}
                  className={`cursor-pointer transition-colors ${
                    selectedServiceId === svc.id ? 'bg-[#F3F2FF]' : 'hover:bg-[#F7F8FC]'
                  }`}
                >
                  <td className="py-3 px-4 font-medium text-[#202333] flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        svc.status === 'healthy'
                          ? 'bg-[#16A36A]'
                          : svc.status === 'degraded'
                          ? 'bg-[#E5A23B]'
                          : 'bg-[#DC6262]'
                      }`}
                    />
                    <span>{svc.name}</span>
                  </td>
                  <td className="py-3 px-4 text-[#777B8A] font-mono text-[11px] uppercase">
                    {svc.type}
                  </td>
                  <td className="py-3 px-4 text-[#777B8A] font-mono">{svc.version}</td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums text-[#202333]">
                    {svc.rps} req/s
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums font-medium text-[#202333]">
                    {svc.p99LatencyMs.toFixed(1)}ms
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums text-[#202333]">
                    {svc.errorRatePercent.toFixed(2)}%
                  </td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-[#6558D9] tabular-nums">
                    {svc.healthScore.toFixed(0)}/100
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectServiceTrace(svc.id);
                      }}
                      className="px-2 py-1 text-xs text-[#6558D9] hover:bg-[#ECECFF] rounded transition-colors"
                    >
                      Filter Traces →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
