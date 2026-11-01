import React, { useState, useEffect } from 'react';
import {
  Workflow,
  CheckCircle2,
  XCircle,
  Clock,
  Play,
  AlertTriangle,
  GitCommit,
  GitBranch,
  Terminal,
  ArrowRight,
  TrendingUp,
  Search,
  Star,
  GitFork,
  ExternalLink,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { PipelineRun, PipelineStage } from '../../types/telemetry';
import {
  GitHubRepoInfo,
  fetchGitHubPipeline,
} from '../../services/api';

interface PipelineTelemetryViewProps {
  pipelines: PipelineRun[];
  onTriggerPipeline: () => void;
  onOpenTraceForRun?: (runId: string) => void;
  onUpdatePipelines?: (newRuns: PipelineRun[]) => void;
}

export const PipelineTelemetryView: React.FC<PipelineTelemetryViewProps> = ({
  pipelines,
  onTriggerPipeline,
  onOpenTraceForRun,
  onUpdatePipelines,
}) => {
  const [selectedRunId, setSelectedRunId] = useState<string>(pipelines[0]?.id || 'run-8912');
  const [showTerminalLogs, setShowTerminalLogs] = useState(false);

  // Dedicated GitHub Repository State
  const [repoInput, setRepoInput] = useState('facebook/react');
  const [connectedProject, setConnectedProject] = useState<{
    fullName: string;
    name: string;
    description?: string;
    stars: number;
    forks: number;
    defaultBranch: string;
    htmlUrl: string;
  } | null>(null);
  const [isLoadingRepo, setIsLoadingRepo] = useState(false);
  const [repoError, setRepoError] = useState<string | null>(null);

  // Auto-connect to live GitHub repo on initial mount
  useEffect(() => {
    if (!connectedProject) {
      loadLiveRepo('facebook/react');
    }
  }, []);

  const loadLiveRepo = async (targetPath: string) => {
    const clean = targetPath
      .trim()
      .replace('https://github.com/', '')
      .replace('http://github.com/', '');
    if (!clean) return;

    setIsLoadingRepo(true);
    setRepoError(null);

    try {
      const response = await fetchGitHubPipeline(clean);
      setConnectedProject(response.repo);
      if (response.runs && response.runs.length > 0) {
        if (onUpdatePipelines) {
          onUpdatePipelines(response.runs);
        }
        setSelectedRunId(response.runs[0].id);
      }
    } catch (err: any) {
      setRepoError(
        err?.message ||
          'Could not fetch repository from GitHub. Check the repository name or network connection.'
      );
    } finally {
      setIsLoadingRepo(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadLiveRepo(repoInput);
  };

  const selectedRun = pipelines.find((p) => p.id === selectedRunId) || pipelines[0];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-semibold text-xl text-[#202333] flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#202333] flex items-center justify-center text-white shrink-0">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
            </div>
            <span>GitHub Actions CI/CD Pipeline Telemetry &amp; Live Repositories</span>
          </h1>
          <p className="text-xs text-[#777B8A] mt-0.5">
            Real-time telemetry directly connected to GitHub Actions, live commits, and workflow runners.
          </p>
        </div>

        <button
          onClick={onTriggerPipeline}
          className="h-[38px] px-4 bg-[#6558D9] hover:bg-[#8B7CF6] active:scale-[0.99] text-white text-xs font-semibold rounded-lg flex items-center gap-2 shadow-sm transition-all whitespace-nowrap"
        >
          <Play className="w-3.5 h-3.5 fill-white text-white" />
          <span>Trigger New Build</span>
        </button>
      </div>

      {/* Live GitHub Repository Connector Bar */}
      <div className="bg-white rounded-xl border border-[#E8EAF1] p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#E8EAF1]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0 bg-[#202333]">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
            </div>
            <div>
              <span className="font-display font-semibold text-sm text-[#202333] flex items-center gap-2">
                <span>Fetch Live GitHub Repository</span>
                <span className="text-[10px] uppercase font-mono font-bold bg-[#F0FDF4] text-[#16A36A] px-2 py-0.5 rounded-full border border-[#BBF7D0]">
                  ● Live GitHub Actions API
                </span>
              </span>
              <p className="text-xs text-[#777B8A]">
                Enter any public GitHub repository to fetch real live commits, authors, and GitHub Actions workflow runs.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Presets for Popular GitHub Repositories */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-[11px] text-[#777B8A] font-medium mr-1">
            Popular GitHub Repos:
          </span>
          {[
            'facebook/react',
            'vercel/next.js',
            'fastapi/fastapi',
            'torvalds/linux',
            'tailwindlabs/tailwindcss',
            'microsoft/vscode',
          ].map((p) => (
            <button
              key={p}
              onClick={() => {
                setRepoInput(p);
                loadLiveRepo(p);
              }}
              className={`px-2.5 py-1 rounded-md text-[11px] font-mono border transition-all ${
                connectedProject?.fullName.toLowerCase() === p.toLowerCase()
                  ? 'bg-[#202333] border-[#202333] text-white font-semibold shadow-xs'
                  : 'bg-[#F7F8FC] border-[#E8EAF1] text-[#474554] hover:bg-white hover:border-[#CBD0DF]'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#777B8A] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={repoInput}
              onChange={(e) => setRepoInput(e.target.value)}
              placeholder="e.g. facebook/react, vercel/next.js, or owner/repo"
              className="w-full h-[40px] pl-9 pr-3 text-xs bg-white border border-[#E8EAF1] rounded-lg text-[#202333] placeholder-[#A0A4B4] focus:outline-none focus:border-[#202333] focus:ring-2 focus:ring-[#202333]/15 font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={isLoadingRepo}
            className="h-[40px] px-5 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-sm whitespace-nowrap bg-[#202333] hover:bg-[#34384e]"
          >
            {isLoadingRepo ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Connecting GitHub...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Fetch Live GitHub</span>
              </>
            )}
          </button>
        </form>

        {/* Error message */}
        {repoError && (
          <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-lg text-xs text-[#DC6262] flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{repoError}</span>
          </div>
        )}

        {/* Connected Project Details Card */}
        {connectedProject && (
          <div className="p-3.5 bg-[#F7F8FC] border border-[#E8EAF1] rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-[#16A36A] animate-pulse shrink-0" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-[#202333]">
                    {connectedProject.fullName}
                  </span>
                  <span className="font-mono text-[10px] bg-white border border-[#E8EAF1] text-[#777B8A] px-1.5 py-0.5 rounded uppercase">
                    github
                  </span>
                </div>
                {connectedProject.description && (
                  <p className="text-[11px] text-[#777B8A] mt-0.5 line-clamp-1 max-w-xl">
                    {connectedProject.description}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 text-[#777B8A] font-mono text-[11px] shrink-0">
              <span className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-[#E5A23B] fill-[#E5A23B]" />
                <strong className="text-[#202333] font-semibold">{connectedProject.stars.toLocaleString()}</strong>
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <GitFork className="w-3.5 h-3.5 text-[#777B8A]" />
                <strong className="text-[#202333] font-semibold">{connectedProject.forks.toLocaleString()}</strong>
              </span>
              <span>·</span>
              <a
                href={connectedProject.htmlUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-[#202333] font-medium hover:underline"
              >
                <span>View on GitHub</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Regression Alert Banner if detected */}
      {selectedRun?.regressionDetected && (
        <div className="p-4 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-[#E5A23B] shrink-0 mt-0.5" />
          <div className="flex-1 text-xs">
            <div className="font-semibold text-[#E5A23B]">
              Build Regression Detected in Stage: {selectedRun.regressionDetected.stage}
            </div>
            <p className="text-[#474554] mt-1 leading-relaxed">
              {selectedRun.regressionDetected.description}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span className="font-mono text-[11px] font-semibold text-[#E5A23B] bg-white px-2 py-0.5 rounded border border-[#FDE68A]">
                +{selectedRun.regressionDetected.deltaMs}ms execution delta
              </span>
              <span className="text-[#777B8A]">·</span>
              <span className="text-[#777B8A]">Recommended: Inspect lock acquisition traces</span>
            </div>
          </div>
        </div>
      )}

      {/* Pipeline Runs Grid / Selection */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Runs List (Left column) */}
        <div
          className="bg-white rounded-xl border border-[#E8EAF1] p-4 space-y-3"
          style={{ boxShadow: '0 1px 3px 0 rgba(32, 35, 51, 0.03)' }}
        >
          <div className="flex items-center justify-between pb-2 border-b border-[#E8EAF1]">
            <span className="text-xs font-semibold text-[#777B8A] uppercase tracking-wider font-display">
              {connectedProject ? `Live Runs (${connectedProject.name})` : 'Recent Pipeline Runs'}
            </span>
            <span className="text-[10px] font-mono text-[#16A36A] font-semibold">
              ● Live Sync
            </span>
          </div>

          <div className="space-y-2">
            {pipelines.map((run) => {
              const isSelected = selectedRun?.id === run.id;

              return (
                <div
                  key={run.id}
                  onClick={() => setSelectedRunId(run.id)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all text-xs ${
                    isSelected
                      ? 'border-[#FC6D26] bg-[#FFF5EE] shadow-xs'
                      : 'border-[#E8EAF1] hover:border-[#FC6D26]/40 hover:bg-[#F7F8FC]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      {run.status === 'passed' ? (
                        <CheckCircle2 className="w-4 h-4 text-[#16A36A]" />
                      ) : (
                        <XCircle className="w-4 h-4 text-[#DC6262]" />
                      )}
                      <span className="font-mono font-semibold text-[#FC6D26]">{run.commitHash}</span>
                    </div>
                    <span className="font-mono text-[11px] text-[#777B8A]">{run.timestamp}</span>
                  </div>

                  <p className="font-mono text-[12px] text-[#202333] truncate font-medium mb-2">
                    {run.commitMessage}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-[#777B8A] font-mono">
                    <span className="flex items-center gap-1">
                      <GitBranch className="w-3 h-3 text-[#A0A4B4]" />
                      <span>{run.branch}</span>
                      <span className="text-[#A0A4B4]">by</span>
                      <span className="text-[#202333] font-medium">{run.author}</span>
                    </span>
                    <span className="tabular-nums font-semibold text-[#202333]">
                      {run.totalDurationSeconds}s
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Run Stage Inspector (Right column) */}
        {selectedRun && (
          <div
            className="lg:col-span-2 bg-white rounded-xl border border-[#E8EAF1] p-5 space-y-5"
            style={{ boxShadow: '0 1px 3px 0 rgba(32, 35, 51, 0.03)' }}
          >
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-[#E8EAF1] gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm text-[#FC6D26]">
                    Ref: {selectedRun.commitHash}
                  </span>
                  <span
                    className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full ${
                      selectedRun.status === 'passed'
                        ? 'bg-[#F0FDF4] text-[#16A36A] border border-[#BBF7D0]'
                        : 'bg-[#FEF2F2] text-[#DC6262] border border-[#FECACA]'
                    }`}
                  >
                    {selectedRun.status.toUpperCase()}
                  </span>
                </div>
                <h3 className="font-display font-semibold text-base text-[#202333] mt-1">
                  {selectedRun.commitMessage}
                </h3>
                <div className="flex items-center gap-3 text-xs text-[#777B8A] mt-1 font-mono">
                  <span>Author: <strong className="text-[#202333]">{selectedRun.author}</strong></span>
                  <span>·</span>
                  <span>Branch/Ref: <strong className="text-[#202333]">{selectedRun.branch}</strong></span>
                  <span>·</span>
                  <span>Runtime: {selectedRun.totalDurationSeconds}s</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowTerminalLogs(!showTerminalLogs)}
                  className="px-3 py-1.5 rounded-lg border border-[#E8EAF1] bg-[#F7F8FC] hover:bg-white text-xs font-medium text-[#202333] flex items-center gap-1.5 transition-colors"
                >
                  <Terminal className="w-3.5 h-3.5 text-[#777B8A]" />
                  <span>{showTerminalLogs ? 'Hide Logs' : 'View Build Logs'}</span>
                </button>
              </div>
            </div>

            {/* Stages Kinetic Execution Flow */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#202333]">Pipeline Execution Stages</span>
                <span className="font-mono text-[#777B8A] tabular-nums">
                  Total Runtime: {selectedRun.totalDurationSeconds}s
                </span>
              </div>

              <div className="space-y-2.5">
                {selectedRun.stages.map((stage, idx) => {
                  let statusBg = 'bg-[#16A36A]';
                  let statusText = 'Passed';

                  if (stage.status === 'failed') {
                    statusBg = 'bg-[#DC6262]';
                    statusText = 'Failed';
                  } else if (stage.status === 'running') {
                    statusBg = 'bg-[#FC6D26] animate-pulse';
                    statusText = 'Running...';
                  } else if (stage.status === 'queued') {
                    statusBg = 'bg-[#A0A4B4]';
                    statusText = 'Queued';
                  }

                  return (
                    <div
                      key={stage.id}
                      className="p-3 bg-[#F7F8FC] border border-[#E8EAF1] rounded-lg space-y-1.5 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-white border border-[#E8EAF1] flex items-center justify-center font-mono text-[10px] text-[#777B8A] font-bold">
                            {idx + 1}
                          </span>
                          <span className="font-medium text-[#202333]">{stage.name}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="font-mono tabular-nums text-[#777B8A]">
                            {stage.durationSeconds > 0 ? `${stage.durationSeconds}s` : '—'}
                          </span>
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold ${
                              stage.status === 'passed'
                                ? 'bg-[#F0FDF4] text-[#16A36A]'
                                : stage.status === 'failed'
                                ? 'bg-[#FEF2F2] text-[#DC6262]'
                                : 'bg-white text-[#777B8A]'
                            }`}
                          >
                            {statusText}
                          </span>
                        </div>
                      </div>

                      {/* Stage duration bar */}
                      <div className="h-1.5 w-full bg-[#E8EAF1] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${statusBg}`}
                          style={{
                            width:
                              stage.durationSeconds > 0
                                ? `${Math.min((stage.durationSeconds / 60) * 100, 100)}%`
                                : stage.status === 'queued'
                                ? '0%'
                                : '60%',
                          }}
                        />
                      </div>

                      {/* Error details if failed */}
                      {stage.errorDetails && (
                        <div className="mt-2 p-2.5 bg-[#FEF2F2] border border-[#FECACA] rounded text-[11px] font-mono text-[#DC6262]">
                          <strong>Failure: </strong>
                          {stage.errorDetails}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Terminal logs drawer */}
            {showTerminalLogs && (
              <div className="p-4 bg-[#202333] text-[#F0EFFF] rounded-lg font-mono text-[11px] leading-relaxed overflow-x-auto space-y-1">
                <div className="text-[#A0A4B4] pb-2 border-b border-[#474554]">
                  // Live GitHub Actions Runner -{' '}
                  {connectedProject?.fullName || 'Pipeline'} [{selectedRun.commitHash}]
                </div>
                <div className="text-[#16A36A]">
                  ✓ [STAGE 1] Pulled latest git ref {selectedRun.commitHash} from branch {selectedRun.branch}
                </div>
                <div className="text-[#16A36A]">
                  ✓ [STAGE 2] Author: {selectedRun.author} - {selectedRun.commitMessage}
                </div>
                {selectedRun.status === 'failed' ? (
                  <>
                    <div className="text-[#E5A23B]">⚡ [STAGE 3] Running GitHub Actions test matrix runner...</div>
                    <div className="text-[#DC6262]">✗ [ERROR] Check failed during pipeline execution.</div>
                  </>
                ) : (
                  <>
                    <div className="text-[#16A36A]">✓ [STAGE 3] Unit test assertions verified.</div>
                    <div className="text-[#16A36A]">✓ [STAGE 4] Container digest verified and tagged.</div>
                    <div className="text-[#16A36A]">✓ [STAGE 5] Verified telemetry mesh contracts. Error budget: 0.00%.</div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
