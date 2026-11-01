import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Activity, Sparkles, Network, Workflow, ShieldAlert, ArrowRight } from 'lucide-react';
import { Trace, DecisionIntelligenceNode, ServiceNode } from '../../types/telemetry';
import { NavScreen } from './SidebarRail';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  traces: Trace[];
  decisions: DecisionIntelligenceNode[];
  services: ServiceNode[];
  onSelectTrace: (trace: Trace) => void;
  onSelectScreen: (screen: NavScreen) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  traces,
  decisions,
  services,
  onSelectTrace,
  onSelectScreen,
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Global shortcut listener for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Open handled by parent if needed
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const normalized = query.toLowerCase().trim();

  const filteredTraces = traces.filter(
    (t) =>
      t.id.toLowerCase().includes(normalized) ||
      t.rootEndpoint.toLowerCase().includes(normalized) ||
      t.rootService.toLowerCase().includes(normalized) ||
      t.tags.some((tag) => tag.toLowerCase().includes(normalized))
  );

  const filteredDecisions = decisions.filter(
    (d) =>
      d.title.toLowerCase().includes(normalized) ||
      d.service.toLowerCase().includes(normalized) ||
      d.rootCause.toLowerCase().includes(normalized)
  );

  const filteredServices = services.filter(
    (s) =>
      s.name.toLowerCase().includes(normalized) ||
      s.id.toLowerCase().includes(normalized) ||
      s.type.toLowerCase().includes(normalized)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#202333]/40 backdrop-blur-[4px] transition-opacity"
        onClick={onClose}
      />

      {/* Palette Container */}
      <div
        className="relative w-full max-w-2xl bg-white rounded-xl border border-[#E8EAF1] overflow-hidden flex flex-col max-h-[75vh]"
        style={{
          boxShadow: '0 24px 48px -12px rgba(32, 35, 51, 0.16)',
        }}
      >
        {/* Search Input Bar */}
        <div className="p-3.5 border-b border-[#E8EAF1] flex items-center gap-3 bg-white">
          <Search className="w-5 h-5 text-[#6558D9] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type to search traces, endpoints, services, or ADR decisions..."
            className="flex-1 text-[14px] text-[#202333] placeholder-[#A0A4B4] bg-transparent border-none focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded text-[#777B8A] hover:bg-[#F7F8FC]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-[#F7F8FC] border border-[#E8EAF1] rounded text-[#777B8A]">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {/* Quick Screen Switches */}
          <div>
            <div className="px-2 pb-1 text-[11px] font-semibold text-[#A0A4B4] uppercase tracking-wider font-display">
              Navigate Screens
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {[
                { id: 'traces' as NavScreen, label: 'Kinetic Traces', icon: Activity },
                { id: 'decisions' as NavScreen, label: 'Decision Intelligence', icon: Sparkles },
                { id: 'mesh' as NavScreen, label: 'Service Mesh', icon: Network },
                { id: 'pipelines' as NavScreen, label: 'Pipelines', icon: Workflow },
                { id: 'slos' as NavScreen, label: 'SLO Governance', icon: ShieldAlert },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    onSelectScreen(s.id);
                    onClose();
                  }}
                  className="flex items-center gap-2 px-2.5 py-2 rounded-lg border border-[#E8EAF1] bg-[#F7F8FC] hover:bg-[#F3F2FF] hover:border-[#6558D9]/30 text-left text-xs font-medium text-[#202333] transition-colors"
                >
                  <s.icon className="w-3.5 h-3.5 text-[#6558D9]" />
                  <span className="truncate">{s.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Traces Section */}
          {filteredTraces.length > 0 && (
            <div>
              <div className="px-2 pb-1 text-[11px] font-semibold text-[#A0A4B4] uppercase tracking-wider font-display flex items-center justify-between">
                <span>Traces ({filteredTraces.length})</span>
                <span className="text-[10px] font-normal lowercase text-[#777B8A]">Click to inspect waterfall</span>
              </div>
              <div className="space-y-1">
                {filteredTraces.slice(0, 5).map((trace) => (
                  <button
                    key={trace.id}
                    onClick={() => {
                      onSelectTrace(trace);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-[#F7F8FC] border border-transparent hover:border-[#E8EAF1] text-left transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="font-mono text-xs font-semibold text-[#6558D9] group-hover:underline">
                        {trace.id}
                      </span>
                      <span className="font-mono text-xs text-[#202333] truncate">
                        {trace.httpMethod} {trace.rootEndpoint}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] font-mono tabular-nums text-[#777B8A]">
                        {trace.durationMs.toFixed(1)}ms
                      </span>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                          trace.status === 'nominal'
                            ? 'bg-[#F0FDF4] text-[#16A36A]'
                            : trace.status === 'degraded'
                            ? 'bg-[#FFFBEB] text-[#E5A23B]'
                            : 'bg-[#FEF2F2] text-[#DC6262]'
                        }`}
                      >
                        {trace.statusCode}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#A0A4B4] opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Decision ADRs */}
          {filteredDecisions.length > 0 && (
            <div>
              <div className="px-2 pb-1 text-[11px] font-semibold text-[#A0A4B4] uppercase tracking-wider font-display">
                Decision Intelligence ADRs ({filteredDecisions.length})
              </div>
              <div className="space-y-1">
                {filteredDecisions.map((decision) => (
                  <button
                    key={decision.id}
                    onClick={() => {
                      onSelectScreen('decisions');
                      onClose();
                    }}
                    className="w-full flex items-start gap-3 px-3 py-2 rounded-lg hover:bg-[#F7F8FC] border border-transparent hover:border-[#E8EAF1] text-left transition-colors group"
                  >
                    <Sparkles className="w-4 h-4 text-[#6558D9] shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-[#202333] group-hover:text-[#6558D9]">
                        {decision.title}
                      </div>
                      <div className="text-[11px] text-[#777B8A] truncate">{decision.rootCause}</div>
                    </div>
                    <span className="text-[10px] font-mono text-[#777B8A] uppercase">
                      {decision.service}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Services */}
          {filteredServices.length > 0 && (
            <div>
              <div className="px-2 pb-1 text-[11px] font-semibold text-[#A0A4B4] uppercase tracking-wider font-display">
                Microservices ({filteredServices.length})
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {filteredServices.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => {
                      onSelectScreen('mesh');
                      onClose();
                    }}
                    className="flex items-center justify-between px-3 py-2 rounded-lg border border-[#E8EAF1] bg-[#F7F8FC] hover:bg-[#F3F2FF] text-left text-xs transition-colors"
                  >
                    <span className="font-medium text-[#202333] truncate">{service.name}</span>
                    <span className="font-mono text-[11px] text-[#777B8A] tabular-nums">
                      {service.p99LatencyMs}ms p99
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {filteredTraces.length === 0 &&
            filteredDecisions.length === 0 &&
            filteredServices.length === 0 && (
              <div className="py-8 text-center text-xs text-[#777B8A]">
                No matching telemetry records found for "{query}".
              </div>
            )}
        </div>

        {/* Footer shortcuts */}
        <div className="p-2.5 border-t border-[#E8EAF1] bg-[#F7F8FC] flex items-center justify-between text-[11px] text-[#777B8A]">
          <div className="flex items-center gap-3">
            <span><kbd className="px-1 py-0.5 bg-white border border-[#E8EAF1] rounded text-[10px]">↑↓</kbd> navigate</span>
            <span><kbd className="px-1 py-0.5 bg-white border border-[#E8EAF1] rounded text-[10px]">↵</kbd> select</span>
          </div>
          <span>DevTrace Kinetic Index v2.4</span>
        </div>
      </div>
    </div>
  );
};
