import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  AlertTriangle,
  CheckCircle2,
  Database,
  Server,
  Layers,
  Sparkles,
  ArrowRight,
  Code2,
  Terminal,
} from 'lucide-react';
import { Trace, Span } from '../../types/telemetry';

interface TraceInspectorDrawerProps {
  trace: Trace | null;
  onClose: () => void;
  onOpenAdrForTrace?: (traceId: string) => void;
}

export const TraceInspectorDrawer: React.FC<TraceInspectorDrawerProps> = ({
  trace,
  onClose,
  onOpenAdrForTrace,
}) => {
  const [copied, setCopied] = useState(false);
  const [selectedSpanId, setSelectedSpanId] = useState<string | null>(null);

  if (!trace) return null;

  const selectedSpan =
    trace.spans.find((s) => s.id === selectedSpanId) || trace.spans[0];

  const errorSpan = trace.spans.find((s) => s.status === 'error' || s.errorDetails);
  const isProblematic = trace.status === 'error' || trace.status === 'critical' || trace.status === 'degraded';

  const handleCopyId = () => {
    navigator.clipboard.writeText(trace.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const totalDuration = trace.durationMs || 1;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#202333]/40 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Body */}
      <div
        className="relative w-full max-w-3xl bg-white h-full shadow-2xl flex flex-col z-10 border-l border-[#E8EAF1] animate-in slide-in-from-right duration-200"
      >
        {/* Top Header */}
        <div className="p-5 border-b border-[#E8EAF1] flex items-center justify-between gap-4 bg-white">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono font-semibold text-xs text-[#6558D9] bg-[#ECECFF] px-2 py-0.5 rounded">
                {trace.id}
              </span>
              <button
                onClick={handleCopyId}
                className="text-[#777B8A] hover:text-[#202333] p-1 rounded transition-colors"
                title="Copy Trace ID"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-[#16A36A]" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <span className="text-xs text-[#777B8A] font-mono">
                {trace.relativeTime}
              </span>
              <span
                className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full ${
                  trace.status === 'nominal'
                    ? 'bg-[#F0FDF4] text-[#16A36A] border border-[#BBF7D0]'
                    : trace.status === 'degraded'
                    ? 'bg-[#FFFBEB] text-[#E5A23B] border border-[#FDE68A]'
                    : 'bg-[#FEF2F2] text-[#DC6262] border border-[#FECACA]'
                }`}
              >
                {trace.statusCode} {trace.status.toUpperCase()}
              </span>
            </div>

            <h2 className="font-display font-semibold text-base text-[#202333] truncate flex items-center gap-2">
              <span className="text-[#777B8A] font-mono text-xs">{trace.httpMethod}</span>
              <span>{trace.rootEndpoint}</span>
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {onOpenAdrForTrace && (
              <button
                onClick={() => onOpenAdrForTrace(trace.id)}
                className="px-3 py-1.5 rounded-lg border border-[#6558D9]/40 bg-[#F3F2FF] hover:bg-[#ECECFF] text-[#6558D9] text-xs font-semibold flex items-center gap-1.5 transition-colors"
                title="View architectural diagnosis for this trace"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>View AI Fix</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#777B8A] hover:text-[#202333] hover:bg-[#F7F8FC] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Trace Metadata Bar */}
        <div className="px-5 py-2.5 bg-[#F7F8FC] border-b border-[#E8EAF1] flex flex-wrap items-center gap-4 text-xs text-[#777B8A]">
          <div>
            Root Service:{' '}
            <span className="font-semibold text-[#202333] font-mono">{trace.rootService}</span>
          </div>
          <span className="text-[#A0A4B4]">·</span>
          <div>
            Total Duration:{' '}
            <span className="font-semibold text-[#202333] font-mono tabular-nums">
              {trace.durationMs.toFixed(1)}ms
            </span>
          </div>
          <span className="text-[#A0A4B4]">·</span>
          <div>
            Spans:{' '}
            <span className="font-semibold text-[#202333] font-mono tabular-nums">{trace.spanCount}</span>
          </div>
          <span className="text-[#A0A4B4]">·</span>
          <div>
            Region: <span className="font-mono text-[#202333]">{trace.region}</span>
          </div>
        </div>

        {/* Drawer Content Area (Split: Waterfall on top, Selected Span inspector below) */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Plain-English "What Happened" Callout Box */}
          <div
            className={`p-4 rounded-xl border flex flex-col gap-2.5 ${
              trace.status === 'error' || trace.status === 'critical'
                ? 'bg-[#FEF2F2] border-[#FECACA]'
                : trace.status === 'degraded'
                ? 'bg-[#FFFBEB] border-[#FDE68A]'
                : 'bg-[#F0FDF4] border-[#BBF7D0]'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                {trace.status === 'nominal' ? (
                  <CheckCircle2 className="w-5 h-5 text-[#16A36A] shrink-0" />
                ) : (
                  <AlertTriangle
                    className={`w-5 h-5 shrink-0 ${
                      trace.status === 'degraded' ? 'text-[#D97706]' : 'text-[#DC6262]'
                    }`}
                  />
                )}
                <span className="font-semibold text-sm text-[#202333]">
                  {trace.status === 'nominal'
                    ? 'Fast & Healthy Request'
                    : trace.status === 'degraded'
                    ? 'High Latency Bottleneck Detected'
                    : 'Critical Failure / Error Detected'}
                </span>
              </div>
              {onOpenAdrForTrace && isProblematic && (
                <button
                  onClick={() => onOpenAdrForTrace(trace.id)}
                  className="px-3 py-1 bg-[#6558D9] hover:bg-[#8B7CF6] text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 shrink-0 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>View AI Solution</span>
                </button>
              )}
            </div>

            <p className="text-xs text-[#474554] leading-relaxed">
              {errorSpan?.errorDetails
                ? errorSpan.errorDetails
                : trace.status === 'nominal'
                ? `This request executed smoothly through ${trace.spanCount} microservice steps in ${trace.durationMs.toFixed(1)}ms with zero errors.`
                : trace.status === 'degraded'
                ? `This request took ${trace.durationMs.toFixed(1)}ms to complete, exceeding normal latency limits.`
                : `This request returned HTTP ${trace.statusCode} and crashed during processing.`}
            </p>
          </div>

          {/* Waterfall Timeline Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-display font-semibold text-xs text-[#777B8A] uppercase tracking-wider">
                Microservice Execution Steps (Waterfall)
              </h3>
              <span className="text-[11px] text-[#777B8A] font-mono">
                Total: 0ms → {totalDuration.toFixed(0)}ms
              </span>
            </div>

            {/* Time Ruler */}
            <div className="h-5 border-b border-[#E8EAF1] flex justify-between text-[10px] font-mono text-[#A0A4B4] px-1 select-none">
              <span>0ms</span>
              <span>{(totalDuration * 0.25).toFixed(0)}ms</span>
              <span>{(totalDuration * 0.5).toFixed(0)}ms</span>
              <span>{(totalDuration * 0.75).toFixed(0)}ms</span>
              <span>{totalDuration.toFixed(0)}ms</span>
            </div>

            {/* Spans List */}
            <div className="mt-2 space-y-1">
              {trace.spans.map((span) => {
                const offsetPercent = (span.offsetMs / totalDuration) * 100;
                const widthPercent = Math.max((span.durationMs / totalDuration) * 100, 2);
                const isSelected = selectedSpan?.id === span.id;

                let barColor = 'bg-[#6558D9]';
                if (span.status === 'warn') barColor = 'bg-[#E5A23B]';
                if (span.status === 'error') barColor = 'bg-[#DC6262]';

                return (
                  <div
                    key={span.id}
                    onClick={() => setSelectedSpanId(span.id)}
                    className={`group cursor-pointer p-2 rounded-lg border transition-all ${
                      isSelected
                        ? 'border-[#6558D9] bg-[#F3F2FF]/60 shadow-xs'
                        : 'border-[#E8EAF1] hover:border-[#6558D9]/40 hover:bg-[#F7F8FC]'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-white border border-[#E8EAF1] text-[#777B8A]">
                          {span.service}
                        </span>
                        <span
                          className={`font-mono text-[12px] truncate font-medium ${
                            isSelected ? 'text-[#6558D9]' : 'text-[#202333]'
                          }`}
                        >
                          {span.name}
                        </span>
                        {span.errorDetails && (
                          <AlertTriangle className="w-3.5 h-3.5 text-[#DC6262] shrink-0" />
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] font-mono tabular-nums text-[#777B8A]">
                          +{span.offsetMs.toFixed(1)}ms
                        </span>
                        <span className="text-[11px] font-mono font-semibold tabular-nums text-[#202333]">
                          {span.durationMs.toFixed(1)}ms
                        </span>
                      </div>
                    </div>

                    {/* Timeline bar track */}
                    <div className="h-2 w-full bg-[#E8EAF1]/50 rounded-full relative overflow-hidden">
                      <div
                        className={`absolute top-0 bottom-0 rounded-full transition-all ${barColor}`}
                        style={{
                          left: `${Math.min(offsetPercent, 95)}%`,
                          width: `${Math.min(widthPercent, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Span Detail Pane */}
          {selectedSpan && (
            <div
              className="bg-[#FFFFFF] rounded-xl border border-[#E8EAF1] p-4 space-y-4"
              style={{ boxShadow: '0 1px 3px 0 rgba(32, 35, 51, 0.03)' }}
            >
              <div className="flex items-start justify-between pb-3 border-b border-[#E8EAF1]">
                <div>
                  <div className="text-[11px] font-mono uppercase tracking-wider text-[#777B8A]">
                    Span Detail Inspector
                  </div>
                  <h4 className="font-mono font-semibold text-sm text-[#202333] mt-0.5">
                    {selectedSpan.name}
                  </h4>
                  <div className="flex items-center gap-2 mt-1 text-xs text-[#777B8A]">
                    <span>Service: <strong className="text-[#202333]">{selectedSpan.service}</strong></span>
                    <span>·</span>
                    <span>Kind: <strong className="text-[#202333]">{selectedSpan.kind}</strong></span>
                    <span>·</span>
                    <span>Span ID: <span className="font-mono">{selectedSpan.id}</span></span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[11px] text-[#777B8A]">Span Duration</div>
                  <div className="font-mono font-bold text-lg text-[#202333] tabular-nums">
                    {selectedSpan.durationMs.toFixed(1)}ms
                  </div>
                </div>
              </div>

              {/* Error or Warning details banner */}
              {selectedSpan.errorDetails && (
                <div className="p-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-[#DC6262] shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <div className="font-semibold text-[#DC6262]">Root Cause Diagnosis Detected</div>
                    <div className="text-[#777B8A] mt-0.5 leading-relaxed font-mono text-[11px]">
                      {selectedSpan.errorDetails}
                    </div>
                  </div>
                </div>
              )}

              {/* Query statement (if database/cache query) */}
              {selectedSpan.query && (
                <div>
                  <div className="text-xs font-semibold text-[#202333] mb-1.5 flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-[#6558D9]" />
                    <span>Database Query Statement</span>
                  </div>
                  <div className="p-3 bg-[#F7F8FC] border border-[#E8EAF1] rounded-lg font-mono text-[12px] leading-relaxed text-[#202333] overflow-x-auto whitespace-pre-wrap">
                    {selectedSpan.query}
                  </div>
                </div>
              )}

              {/* Attributes Table */}
              <div>
                <div className="text-xs font-semibold text-[#202333] mb-2 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-[#777B8A]" />
                  <span>OpenTelemetry Span Attributes</span>
                </div>
                <div className="border border-[#E8EAF1] rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-[#F7F8FC] border-b border-[#E8EAF1] text-[#777B8A] font-mono text-[11px]">
                        <th className="py-2 px-3">Attribute Key</th>
                        <th className="py-2 px-3">Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8EAF1] font-mono text-[11px]">
                      {Object.entries(selectedSpan.attributes).map(([k, v]) => (
                        <tr key={k} className="hover:bg-[#F7F8FC]/60">
                          <td className="py-2 px-3 text-[#6558D9] font-medium">{k}</td>
                          <td className="py-2 px-3 text-[#202333]">{String(v)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#E8EAF1] bg-[#F7F8FC] flex items-center justify-between text-xs">
          <div className="text-[#777B8A]">
            Trace context propagated via W3C TraceContext headers
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-[#E8EAF1] text-[#202333] font-medium rounded-lg hover:bg-[#F7F8FC] transition-colors"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
