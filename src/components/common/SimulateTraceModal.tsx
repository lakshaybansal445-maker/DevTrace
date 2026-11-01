import React, { useState } from 'react';
import { Play, X, Zap, Server, Activity } from 'lucide-react';
import { Trace, Span } from '../../types/telemetry';

interface SimulateTraceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSimulate: (trace: Trace) => void;
}

export const SimulateTraceModal: React.FC<SimulateTraceModalProps> = ({
  isOpen,
  onClose,
  onSimulate,
}) => {
  const [endpoint, setEndpoint] = useState('/v2/payments/charge-card');
  const [method, setMethod] = useState<'POST' | 'GET' | 'gRPC'>('POST');
  const [service, setService] = useState('payment-router');
  const [durationMs, setDurationMs] = useState(320);
  const [statusCode, setStatusCode] = useState(200);
  const [hasDbQuery, setHasDbQuery] = useState(true);
  const [errorType, setErrorType] = useState<'none' | 'slow_db' | 'timeout' | 'deadlock'>('none');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const traceId = `trace-sim-${Math.floor(1000 + Math.random() * 9000)}`;
    const isError = statusCode >= 400 || errorType !== 'none';

    const rootSpan: Span = {
      id: `span-root-${Math.floor(Math.random() * 1000)}`,
      name: `${method} ${endpoint}`,
      service: service,
      durationMs: Number(durationMs),
      offsetMs: 0,
      status: isError ? 'error' : statusCode >= 300 ? 'warn' : 'ok',
      statusCode: statusCode,
      kind: 'SERVER',
      attributes: {
        'http.method': method,
        'http.target': endpoint,
        'http.status_code': statusCode,
        'simulated.trigger': true,
      },
    };

    const spans: Span[] = [rootSpan];

    // Auth child span
    spans.push({
      id: `span-auth-${Math.floor(Math.random() * 1000)}`,
      parentId: rootSpan.id,
      name: 'auth.verify_signature',
      service: 'auth-gateway',
      durationMs: 18.2,
      offsetMs: 1.5,
      status: 'ok',
      kind: 'CLIENT',
      attributes: { 'auth.valid': true },
    });

    // DB or Queue child span
    if (hasDbQuery) {
      const dbDuration = errorType === 'slow_db' ? Number(durationMs) * 0.75 : 45.0;
      spans.push({
        id: `span-db-${Math.floor(Math.random() * 1000)}`,
        parentId: rootSpan.id,
        name: errorType === 'deadlock' ? 'db.transaction_deadlock' : 'db.execute_sql_query',
        service: 'postgres-primary',
        durationMs: dbDuration,
        offsetMs: 22.0,
        status: errorType === 'deadlock' ? 'error' : errorType === 'slow_db' ? 'warn' : 'ok',
        kind: 'CLIENT',
        query: `UPDATE accounts SET balance = balance - 100 WHERE id = 'acc_4920';`,
        errorDetails:
          errorType === 'deadlock'
            ? 'Deadlock detected: serialization failure code 40001'
            : errorType === 'slow_db'
            ? 'Query exceeded slow-query threshold (>200ms)'
            : undefined,
        attributes: {
          'db.system': 'postgresql',
          'db.table': 'accounts',
        },
      });
    }

    const newTrace: Trace = {
      id: traceId,
      rootEndpoint: endpoint,
      httpMethod: method,
      rootService: service,
      durationMs: Number(durationMs),
      timestamp: new Date().toISOString(),
      relativeTime: 'Just now',
      statusCode: statusCode,
      status: statusCode >= 500 || errorType === 'timeout'
        ? 'error'
        : errorType === 'deadlock'
        ? 'critical'
        : durationMs > 500 || errorType === 'slow_db'
        ? 'degraded'
        : 'nominal',
      spanCount: spans.length,
      errorCount: isError ? 1 : 0,
      clientIp: '192.168.1.104',
      environment: 'production',
      region: 'us-east-1',
      spans: spans,
      tags: ['synthetic-simulation', service],
    };

    onSimulate(newTrace);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#202333]/40 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div
        className="relative w-full max-w-lg bg-white rounded-xl border border-[#E8EAF1] p-6 shadow-2xl space-y-5"
        style={{ boxShadow: '0 24px 48px -12px rgba(32, 35, 51, 0.16)' }}
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#E8EAF1]">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-[#6558D9]" />
            <h2 className="font-display font-semibold text-base text-[#202333]">
              Send Simulated Network Request
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#777B8A] hover:text-[#202333] hover:bg-[#F7F8FC]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3 bg-[#F7F8FC] border border-[#E8EAF1] rounded-lg space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#474554] uppercase tracking-wider flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-[#6558D9]" />
              Quick One-Click Test Presets
            </span>
            <span className="text-[10px] text-[#777B8A]">Pick a scenario</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => {
                setEndpoint('/v2/orders/settle-cart');
                setMethod('POST');
                setService('order-orchestrator');
                setDurationMs(2450);
                setStatusCode(500);
                setErrorType('deadlock');
                setHasDbQuery(true);
              }}
              className="p-1.5 px-2 bg-white border border-[#E8EAF1] hover:border-[#6558D9] rounded text-[11px] text-left text-[#202333] transition-colors"
            >
              <span className="font-semibold text-[#DC2626] block">🛒 Checkout Crash</span>
              <span className="text-[10px] text-[#777B8A]">Database deadlock failure</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setEndpoint('/v1/vector/retrieve-context');
                setMethod('POST');
                setService('vector-inference-engine');
                setDurationMs(980);
                setStatusCode(200);
                setErrorType('slow_db');
                setHasDbQuery(true);
              }}
              className="p-1.5 px-2 bg-white border border-[#E8EAF1] hover:border-[#6558D9] rounded text-[11px] text-left text-[#202333] transition-colors"
            >
              <span className="font-semibold text-[#D97706] block">🧠 Slow AI Search</span>
              <span className="text-[10px] text-[#777B8A]">980ms unbatched query</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setEndpoint('/v1/webhooks/stripe/payment_intent_succeeded');
                setMethod('POST');
                setService('payment-router');
                setDurationMs(1240);
                setStatusCode(504);
                setErrorType('timeout');
                setHasDbQuery(true);
              }}
              className="p-1.5 px-2 bg-white border border-[#E8EAF1] hover:border-[#6558D9] rounded text-[11px] text-left text-[#202333] transition-colors"
            >
              <span className="font-semibold text-[#EA580C] block">💳 Payment Timeout</span>
              <span className="text-[10px] text-[#777B8A]">504 DB pool exhaustion</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setEndpoint('/v1/catalog/product-inventory');
                setMethod('GET');
                setService('order-orchestrator');
                setDurationMs(18);
                setStatusCode(200);
                setErrorType('none');
                setHasDbQuery(false);
              }}
              className="p-1.5 px-2 bg-white border border-[#E8EAF1] hover:border-[#6558D9] rounded text-[11px] text-left text-[#202333] transition-colors"
            >
              <span className="font-semibold text-[#16A36A] block">🟢 Fast Healthy (18ms)</span>
              <span className="text-[10px] text-[#777B8A]">Instant cache hit</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Method & Endpoint */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block font-medium text-[#202333] mb-1">Method</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as any)}
                className="w-full h-[38px] px-2.5 rounded-lg border border-[#E8EAF1] bg-white text-[#202333] focus:outline-none focus:border-[#6558D9]"
              >
                <option value="POST">POST</option>
                <option value="GET">GET</option>
                <option value="gRPC">gRPC</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block font-medium text-[#202333] mb-1">Target Endpoint</label>
              <input
                type="text"
                required
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                className="w-full h-[38px] px-3 rounded-lg border border-[#E8EAF1] font-mono text-[11px] text-[#202333] focus:outline-none focus:border-[#6558D9]"
              />
            </div>
          </div>

          {/* Service & HTTP status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-[#202333] mb-1">Root Service</label>
              <select
                value={service}
                onChange={(e) => setService(e.target.value)}
                className="w-full h-[38px] px-2.5 rounded-lg border border-[#E8EAF1] bg-white text-[#202333] focus:outline-none focus:border-[#6558D9]"
              >
                <option value="payment-router">payment-router</option>
                <option value="vector-inference-engine">vector-inference-engine</option>
                <option value="order-orchestrator">order-orchestrator</option>
                <option value="auth-gateway">auth-gateway</option>
                <option value="ai-inference-proxy">ai-inference-proxy</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-[#202333] mb-1">HTTP Status Code</label>
              <select
                value={statusCode}
                onChange={(e) => setStatusCode(Number(e.target.value))}
                className="w-full h-[38px] px-2.5 rounded-lg border border-[#E8EAF1] bg-white text-[#202333] font-mono focus:outline-none focus:border-[#6558D9]"
              >
                <option value="200">200 OK</option>
                <option value="201">201 Created</option>
                <option value="400">400 Bad Request</option>
                <option value="409">409 Conflict (Deadlock)</option>
                <option value="500">500 Internal Error</option>
                <option value="504">504 Gateway Timeout</option>
              </select>
            </div>
          </div>

          {/* Duration slider */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-medium text-[#202333]">Simulated Latency (ms)</label>
              <span className="font-mono font-bold text-[#6558D9] tabular-nums">
                {durationMs}ms
              </span>
            </div>
            <input
              type="range"
              min="15"
              max="1500"
              step="15"
              value={durationMs}
              onChange={(e) => setDurationMs(Number(e.target.value))}
              className="w-full accent-[#6558D9]"
            />
          </div>

          {/* Fault injection options */}
          <div className="p-3 bg-[#F7F8FC] border border-[#E8EAF1] rounded-lg space-y-2">
            <span className="font-medium text-[#202333] block">Fault Simulation Mode</span>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'none', label: 'Nominal Execution' },
                { id: 'slow_db', label: 'Slow DB Query (>300ms)' },
                { id: 'timeout', label: '504 Network Timeout' },
                { id: 'deadlock', label: '409 Serializable Deadlock' },
              ].map((m) => (
                <button
                  type="button"
                  key={m.id}
                  onClick={() => {
                    setErrorType(m.id as any);
                    if (m.id === 'timeout') setStatusCode(504);
                    if (m.id === 'deadlock') setStatusCode(409);
                    if (m.id === 'none') setStatusCode(200);
                  }}
                  className={`p-2 rounded border text-left text-[11px] transition-colors ${
                    errorType === m.id
                      ? 'border-[#6558D9] bg-[#ECECFF] text-[#6558D9] font-semibold'
                      : 'border-[#E8EAF1] bg-white text-[#777B8A] hover:text-[#202333]'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Submit & Cancel */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[#E8EAF1] rounded-lg text-[#777B8A] hover:bg-[#F7F8FC] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#6558D9] hover:bg-[#8B7CF6] active:scale-[0.99] text-white font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition-all"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Inject & Inspect Waterfall</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
