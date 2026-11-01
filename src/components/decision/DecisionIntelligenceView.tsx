import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  AlertOctagon,
  Lightbulb,
  Copy,
  Check,
  ExternalLink,
  Plus,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Cpu,
  FileCode,
} from 'lucide-react';
import { DecisionIntelligenceNode } from '../../types/telemetry';

interface DecisionIntelligenceViewProps {
  decisions: DecisionIntelligenceNode[];
  onApplyDecision: (id: string) => void;
  onDismissDecision: (id: string) => void;
  onOpenTrace: (traceId: string) => void;
  onCreateDecision: (node: DecisionIntelligenceNode) => void;
}

export const DecisionIntelligenceView: React.FC<DecisionIntelligenceViewProps> = ({
  decisions,
  onApplyDecision,
  onDismissDecision,
  onOpenTrace,
  onCreateDecision,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [copiedSnippetId, setCopiedSnippetId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New ADR form state
  const [newTitle, setNewTitle] = useState('');
  const [newService, setNewService] = useState('order-orchestrator');
  const [newRootCause, setNewRootCause] = useState('');
  const [newHypothesis, setNewHypothesis] = useState('');
  const [newFilePath, setNewFilePath] = useState('src/services/orderProcessor.ts');
  const [newCode, setNewCode] = useState('// Applied optimization snippet\n');

  const filteredDecisions = decisions.filter((d) => {
    if (filterStatus === 'all') return true;
    return d.status === filterStatus;
  });

  const handleCopyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedSnippetId(id);
    setTimeout(() => setCopiedSnippetId(null), 2000);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newNode: DecisionIntelligenceNode = {
      id: `adr-${String(decisions.length + 1).padStart(3, '0')}`,
      title: newTitle,
      severity: 'recommendation',
      service: newService,
      affectedTraceId: 'trace-ord-8921',
      timestamp: 'Just now',
      rootCause: newRootCause || 'Identified latency amplification on high-concurrency requests.',
      impactMetrics: {
        latencyReduction: '-120ms p95',
        throughputGain: '+1.8x RPS',
      },
      architecturalHypothesis: newHypothesis || 'Optimizing lock contention and batching execution.',
      recommendedPatch: {
        language: 'typescript',
        filePath: newFilePath,
        codeSnippet: newCode,
        explanation: 'Reduces connection lease times and unblocks concurrent workers.',
      },
      status: 'pending_review',
    };

    onCreateDecision(newNode);
    setShowCreateModal(false);
    setNewTitle('');
    setNewRootCause('');
    setNewHypothesis('');
  };

  const pendingCount = decisions.filter((d) => d.status === 'pending_review').length;
  const appliedCount = decisions.filter((d) => d.status === 'applied').length;

  return (
    <div className="space-y-6">
      {/* Top Header & Strategy Summary */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-semibold text-xl text-[#202333] flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#6558D9]" />
            <span>AI Code Fixes &amp; Solutions</span>
          </h1>
          <p className="text-xs text-[#777B8A] mt-0.5">
            DevTrace AI diagnoses slow or failing requests, pinpoints the root-cause bug in your code, and writes automated fix patches.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="h-[38px] px-3.5 bg-[#6558D9] hover:bg-[#8B7CF6] active:scale-[0.99] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Draft New Fix</span>
          </button>
        </div>
      </div>

      {/* Overview Stat Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          className="bg-white rounded-xl border border-[#E8EAF1] p-4 flex items-center gap-3.5"
          style={{ boxShadow: '0 1px 3px 0 rgba(32, 35, 51, 0.03)' }}
        >
          <div className="w-10 h-10 rounded-lg bg-[#FFFBEB] border border-[#FDE68A] flex items-center justify-center text-[#E5A23B]">
            <AlertOctagon className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[12px] font-medium text-[#777B8A]">Fixes Ready for Review</div>
            <div className="font-display font-semibold text-xl text-[#202333] tabular-nums">
              {pendingCount} Solutions
            </div>
          </div>
        </div>

        <div
          className="bg-white rounded-xl border border-[#E8EAF1] p-4 flex items-center gap-3.5"
          style={{ boxShadow: '0 1px 3px 0 rgba(32, 35, 51, 0.03)' }}
        >
          <div className="w-10 h-10 rounded-lg bg-[#F0FDF4] border border-[#BBF7D0] flex items-center justify-center text-[#16A36A]">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[12px] font-medium text-[#777B8A]">Applied &amp; Active Patches</div>
            <div className="font-display font-semibold text-xl text-[#202333] tabular-nums">
              {appliedCount} Fixed
            </div>
          </div>
        </div>

        <div
          className="bg-white rounded-xl border border-[#E8EAF1] p-4 flex items-center gap-3.5"
          style={{ boxShadow: '0 1px 3px 0 rgba(32, 35, 51, 0.03)' }}
        >
          <div className="w-10 h-10 rounded-lg bg-[#ECECFF] border border-[#C8C4D6] flex items-center justify-center text-[#6558D9]">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[12px] font-medium text-[#777B8A]">Est. Latency Saved</div>
            <div className="font-display font-semibold text-xl text-[#6558D9] tabular-nums">
              -800ms Net Speedup
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-[#F7F8FC] border border-[#E8EAF1] rounded-lg w-fit text-xs">
        {[
          { id: 'all', label: `All Solutions (${decisions.length})` },
          { id: 'pending_review', label: `Ready for Review (${pendingCount})` },
          { id: 'applied', label: `Applied (${appliedCount})` },
          { id: 'dismissed', label: 'Dismissed' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterStatus(tab.id)}
            className={`px-3 py-1.5 font-medium rounded-md transition-colors ${
              filterStatus === tab.id
                ? 'bg-white text-[#202333] shadow-sm font-semibold'
                : 'text-[#777B8A] hover:text-[#202333]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Decision Intelligence Cards List */}
      <div className="space-y-5">
        {filteredDecisions.map((node) => {
          let leftBorderColor = '#6558D9';
          let badgeText = '✨ AI Code Recommendation';
          let badgeClass = 'bg-[#ECECFF] text-[#6558D9] border-[#C8C4D6]';

          if (node.severity === 'danger') {
            leftBorderColor = '#DC6262';
            badgeText = '🔴 Critical Bug Fix';
            badgeClass = 'bg-[#FEF2F2] text-[#DC6262] border-[#FECACA]';
          } else if (node.severity === 'success') {
            leftBorderColor = '#16A36A';
            badgeText = '🟢 Verified Best Practice';
            badgeClass = 'bg-[#F0FDF4] text-[#16A36A] border-[#BBF7D0]';
          } else if (node.severity === 'warning') {
            leftBorderColor = '#E5A23B';
            badgeText = '🟡 Performance Optimization';
            badgeClass = 'bg-[#FFFBEB] text-[#E5A23B] border-[#FDE68A]';
          }

          const isCopied = copiedSnippetId === node.id;

          return (
            <div
              key={node.id}
              className="bg-white rounded-xl border border-[#E8EAF1] overflow-hidden transition-all hover:border-[#6558D9]/30"
              style={{
                borderLeft: `3px solid ${leftBorderColor}`,
                boxShadow: '0 1px 3px 0 rgba(32, 35, 51, 0.03)',
              }}
            >
              {/* Card Internal Header with 1px border-bottom in #E8EAF1 */}
              <div className="p-4 sm:p-5 border-b border-[#E8EAF1] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-mono text-xs font-semibold text-[#777B8A]">
                    {node.id.toUpperCase()}
                  </span>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold border ${badgeClass}`}
                  >
                    {badgeText}
                  </span>
                  <span className="text-xs text-[#777B8A] font-mono">
                    Service:{' '}
                    <strong className="text-[#202333] font-semibold">{node.service}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-[#777B8A]">
                  <span>{node.timestamp}</span>
                  <span className="text-[#A0A4B4]">·</span>
                  <button
                    onClick={() => onOpenTrace(node.affectedTraceId)}
                    className="flex items-center gap-1 text-[#6558D9] font-mono hover:underline font-medium"
                    title="Jump to associated distributed trace"
                  >
                    <span>Trace {node.affectedTraceId}</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 space-y-4">
                {/* Title & Root Cause */}
                <div>
                  <h3 className="font-display font-semibold text-base text-[#202333]">
                    {node.title}
                  </h3>
                  <p className="text-xs text-[#474554] mt-1.5 leading-relaxed">
                    <strong className="text-[#DC6262]">🚨 Root Cause (Why It Failed): </strong>
                    {node.rootCause}
                  </p>
                </div>

                {/* Impact Metrics Callout Strip */}
                <div className="p-3 bg-[#F7F8FC] border border-[#E8EAF1] rounded-lg flex flex-wrap items-center gap-4 text-xs font-mono">
                  <span className="text-[#777B8A] font-display font-medium text-[11px] uppercase tracking-wider">
                    ⚡ Expected Impact:
                  </span>
                  {node.impactMetrics.latencyReduction && (
                    <span className="text-[#16A36A] font-semibold">
                      Latency {node.impactMetrics.latencyReduction}
                    </span>
                  )}
                  {node.impactMetrics.throughputGain && (
                    <span className="text-[#6558D9] font-semibold">
                      Throughput {node.impactMetrics.throughputGain}
                    </span>
                  )}
                  {node.impactMetrics.errorRateChange && (
                    <span className="text-[#16A36A] font-semibold">
                      Errors {node.impactMetrics.errorRateChange}
                    </span>
                  )}
                  {node.impactMetrics.costImpact && (
                    <span className="text-[#777B8A]">
                      Infrastructure: {node.impactMetrics.costImpact}
                    </span>
                  )}
                </div>

                {/* Architectural Strategy */}
                <div className="text-xs text-[#474554]">
                  <strong className="text-[#202333]">💡 How This Fix Works: </strong>
                  {node.architecturalHypothesis}
                </div>

                {/* Embedded Code Snippet */}
                <div className="rounded-lg border border-[#E8EAF1] overflow-hidden">
                  <div className="px-3 py-2 bg-[#F7F8FC] border-b border-[#E8EAF1] flex items-center justify-between text-[11px] font-mono text-[#777B8A]">
                    <div className="flex items-center gap-2">
                      <FileCode className="w-3.5 h-3.5 text-[#6558D9]" />
                      <span className="text-[#202333] font-medium">
                        {node.recommendedPatch.filePath}
                      </span>
                    </div>
                    <button
                      onClick={() => handleCopyCode(node.id, node.recommendedPatch.codeSnippet)}
                      className="flex items-center gap-1 hover:text-[#202333] transition-colors"
                      title="Copy code patch to clipboard"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3 h-3 text-[#16A36A]" />
                          <span className="text-[#16A36A]">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy snippet</span>
                        </>
                      )}
                    </button>
                  </div>

                  <pre
                    className="p-4 bg-[#F7F8FC] text-[#202333] overflow-x-auto"
                    style={{
                      fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                      fontSize: '12px',
                      lineHeight: '1.5',
                    }}
                  >
                    <code>{node.recommendedPatch.codeSnippet}</code>
                  </pre>

                  <div className="px-3 py-2 bg-white border-t border-[#E8EAF1] text-[11px] text-[#777B8A]">
                    <strong className="text-[#202333]">Explanation: </strong>
                    {node.recommendedPatch.explanation}
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {node.status === 'pending_review' ? (
                      <>
                        <button
                          onClick={() => onApplyDecision(node.id)}
                          className="h-[36px] px-4 rounded-lg bg-[#6558D9] hover:bg-[#8B7CF6] active:scale-[0.99] text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Apply Code Fix</span>
                        </button>
                        <button
                          onClick={() => onDismissDecision(node.id)}
                          className="h-[36px] px-3 rounded-lg border border-[#E8EAF1] bg-white hover:bg-[#F7F8FC] text-[#777B8A] hover:text-[#202333] text-xs font-medium transition-colors"
                        >
                          Dismiss
                        </button>
                      </>
                    ) : node.status === 'applied' ? (
                      <div className="flex items-center gap-2 text-xs font-semibold text-[#16A36A] bg-[#F0FDF4] border border-[#BBF7D0] px-3 py-1.5 rounded-lg font-mono">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>✓ Code Fix Applied &amp; Active</span>
                      </div>
                    ) : (
                      <span className="text-xs text-[#A0A4B4] italic">Decision Dismissed</span>
                    )}
                  </div>

                  <button
                    onClick={() => onOpenTrace(node.affectedTraceId)}
                    className="text-xs text-[#6558D9] font-medium hover:underline flex items-center gap-1"
                  >
                    <span>Inspect Network Request {node.affectedTraceId}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredDecisions.length === 0 && (
          <div className="bg-white rounded-xl border border-[#E8EAF1] p-12 text-center">
            <CheckCircle2 className="w-8 h-8 text-[#16A36A] mx-auto mb-2" />
            <div className="text-sm font-semibold text-[#202333]">No decisions in this filter</div>
            <p className="text-xs text-[#777B8A] mt-1">
              All architectural refactoring hypotheses are up to date.
            </p>
          </div>
        )}
      </div>

      {/* Modal: Draft Architectural Decision */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-[#202333]/40 backdrop-blur-[2px]"
            onClick={() => setShowCreateModal(false)}
          />
          <div
            className="relative w-full max-w-xl bg-white rounded-xl border border-[#E8EAF1] p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            style={{ boxShadow: '0 24px 48px -12px rgba(32, 35, 51, 0.16)' }}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E8EAF1]">
              <h2 className="font-display font-semibold text-base text-[#202333]">
                Draft Architecture Decision Record (ADR)
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-[#777B8A] hover:text-[#202333]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-[#202333] mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Asynchronous Kafka Consumer Batch Scaling"
                  className="w-full h-[38px] px-3 rounded-lg border border-[#E8EAF1] focus:outline-none focus:border-[#6558D9] text-[#202333]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#202333] mb-1">Target Service</label>
                  <select
                    value={newService}
                    onChange={(e) => setNewService(e.target.value)}
                    className="w-full h-[38px] px-3 rounded-lg border border-[#E8EAF1] focus:outline-none focus:border-[#6558D9] text-[#202333]"
                  >
                    <option value="vector-inference-engine">vector-inference-engine</option>
                    <option value="payment-router">payment-router</option>
                    <option value="order-orchestrator">order-orchestrator</option>
                    <option value="auth-gateway">auth-gateway</option>
                    <option value="ai-inference-proxy">ai-inference-proxy</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-[#202333] mb-1">Target File</label>
                  <input
                    type="text"
                    value={newFilePath}
                    onChange={(e) => setNewFilePath(e.target.value)}
                    className="w-full h-[38px] px-3 rounded-lg border border-[#E8EAF1] focus:outline-none focus:border-[#6558D9] text-[#202333] font-mono text-[11px]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-[#202333] mb-1">Diagnosis & Root Cause</label>
                <textarea
                  rows={2}
                  value={newRootCause}
                  onChange={(e) => setNewRootCause(e.target.value)}
                  placeholder="Describe the bottleneck or concurrency collision observed in traces..."
                  className="w-full p-2.5 rounded-lg border border-[#E8EAF1] focus:outline-none focus:border-[#6558D9] text-[#202333]"
                />
              </div>

              <div>
                <label className="block font-medium text-[#202333] mb-1">Architectural Hypothesis</label>
                <textarea
                  rows={2}
                  value={newHypothesis}
                  onChange={(e) => setNewHypothesis(e.target.value)}
                  placeholder="Explain why this refactoring will resolve the bottleneck..."
                  className="w-full p-2.5 rounded-lg border border-[#E8EAF1] focus:outline-none focus:border-[#6558D9] text-[#202333]"
                />
              </div>

              <div>
                <label className="block font-medium text-[#202333] mb-1">Proposed Code Patch</label>
                <textarea
                  rows={4}
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-[#E8EAF1] focus:outline-none focus:border-[#6558D9] text-[#202333] font-mono text-[11px]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-[#E8EAF1] rounded-lg text-[#777B8A] hover:bg-[#F7F8FC]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#6558D9] hover:bg-[#8B7CF6] text-white font-semibold rounded-lg shadow-sm"
                >
                  Save Decision Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
