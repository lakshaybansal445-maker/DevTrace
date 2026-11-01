import React, { useState } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Clock,
  Sliders,
  RefreshCw,
  TrendingDown,
  Info,
} from 'lucide-react';
import { ServiceLevelObjective } from '../../types/telemetry';

interface SloGovernanceViewProps {
  slos: ServiceLevelObjective[];
  onTriggerAudit: () => void;
}

export const SloGovernanceView: React.FC<SloGovernanceViewProps> = ({
  slos,
  onTriggerAudit,
}) => {
  const [filterWindow, setFilterWindow] = useState<'all' | '7d' | '30d'>('all');

  const filteredSlos = slos.filter((s) => {
    if (filterWindow === 'all') return true;
    return s.timeWindow === filterWindow;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-semibold text-xl text-[#202333] flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-[#6558D9]" />
            <span>Service Level Objectives & Error Budgets</span>
          </h1>
          <p className="text-xs text-[#777B8A] mt-0.5">
            Architectural reliability governance, error budget consumption rate, and automated deployment gate policies.
          </p>
        </div>

        <button
          onClick={onTriggerAudit}
          className="h-[38px] px-4 bg-[#6558D9] hover:bg-[#8B7CF6] active:scale-[0.99] text-white text-xs font-semibold rounded-lg flex items-center gap-2 shadow-sm transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Audit Error Budgets</span>
        </button>
      </div>

      {/* Governance Policy Rule Card */}
      <div className="p-4 rounded-xl bg-white border border-[#E8EAF1] flex items-start gap-3 shadow-xs">
        <Info className="w-5 h-5 text-[#6558D9] shrink-0 mt-0.5" />
        <div className="text-xs">
          <div className="font-semibold text-[#202333]">
            DevTrace Automated Governance Policy: Invariant Gate #4
          </div>
          <p className="text-[#474554] mt-0.5 leading-relaxed">
            Services exceeding a <strong>2.0x burn rate ratio</strong> over 7 days trigger Canary Deployment freezes. Services with exhausted error budgets require principal architectural approval before prod promotions.
          </p>
        </div>
      </div>

      {/* SLO Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredSlos.map((slo) => {
          let statusBadge = (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-[#F0FDF4] text-[#16A36A] border border-[#BBF7D0]">
              <CheckCircle2 className="w-3 h-3" /> Nominal
            </span>
          );

          if (slo.status === 'warning') {
            statusBadge = (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-[#FFFBEB] text-[#E5A23B] border border-[#FDE68A]">
                <Flame className="w-3 h-3" /> High Burn Rate
              </span>
            );
          } else if (slo.status === 'breached') {
            statusBadge = (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-[#FEF2F2] text-[#DC6262] border border-[#FECACA]">
                <AlertTriangle className="w-3 h-3" /> Budget Breached
              </span>
            );
          }

          return (
            <div
              key={slo.id}
              className="bg-white rounded-xl border border-[#E8EAF1] p-5 space-y-4 hover:border-[#6558D9]/30 transition-all"
              style={{ boxShadow: '0 1px 3px 0 rgba(32, 35, 51, 0.03)' }}
            >
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#E8EAF1]">
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#777B8A] bg-[#F7F8FC] px-1.5 py-0.5 rounded border border-[#E8EAF1]">
                    {slo.service}
                  </span>
                  <h3 className="font-display font-semibold text-sm text-[#202333] mt-1.5">
                    {slo.name}
                  </h3>
                </div>
                {statusBadge}
              </div>

              {/* Progress bar of remaining budget */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#777B8A]">Remaining Error Budget</span>
                  <span className="font-mono font-bold text-[#202333] tabular-nums">
                    {slo.remainingBudgetPercent.toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 w-full bg-[#E8EAF1] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      slo.remainingBudgetPercent > 30
                        ? 'bg-[#16A36A]'
                        : slo.remainingBudgetPercent > 0
                        ? 'bg-[#E5A23B]'
                        : 'bg-[#DC6262]'
                    }`}
                    style={{ width: `${Math.max(slo.remainingBudgetPercent, 2)}%` }}
                  />
                </div>
              </div>

              {/* Metrics Details */}
              <div className="grid grid-cols-3 gap-2 p-3 bg-[#F7F8FC] rounded-lg border border-[#E8EAF1] text-center text-xs">
                <div>
                  <div className="text-[10px] text-[#777B8A]">Target SLO</div>
                  <div className="font-mono font-semibold text-[#202333] tabular-nums mt-0.5">
                    {slo.targetPercent}%
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-[#777B8A]">Actual ({slo.timeWindow})</div>
                  <div
                    className={`font-mono font-semibold tabular-nums mt-0.5 ${
                      slo.actualPercent >= slo.targetPercent ? 'text-[#16A36A]' : 'text-[#DC6262]'
                    }`}
                  >
                    {slo.actualPercent}%
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-[#777B8A]">Burn Rate</div>
                  <div className="font-mono font-semibold text-[#202333] tabular-nums mt-0.5 flex items-center justify-center gap-1">
                    <span>{slo.burnRateRatio}x</span>
                    {slo.burnRateRatio > 1 && (
                      <Flame className="w-3 h-3 text-[#E5A23B] shrink-0" />
                    )}
                  </div>
                </div>
              </div>

              {/* Policy status footer */}
              <div className="flex items-center justify-between text-[11px] text-[#777B8A] pt-1">
                <span>Time Window: {slo.timeWindow} rolling</span>
                <span className="font-mono text-[#202333]">
                  {slo.remainingBudgetPercent > 0 ? 'Deployments Allowed' : 'Deployment Blocked'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
