import React from 'react';
import {
  Activity,
  Sparkles,
  Network,
  Workflow,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Radio,
  Sliders,
  Layers,
  Search,
} from 'lucide-react';

export type NavScreen = 'traces' | 'decisions' | 'mesh' | 'pipelines' | 'slos';

interface SidebarRailProps {
  currentScreen: NavScreen;
  onSelectScreen: (screen: NavScreen) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  pendingAdrCount: number;
  liveStreaming: boolean;
  onToggleLiveStreaming: () => void;
  onOpenSearch: () => void;
}

export const SidebarRail: React.FC<SidebarRailProps> = ({
  currentScreen,
  onSelectScreen,
  isCollapsed,
  onToggleCollapse,
  pendingAdrCount,
  liveStreaming,
  onToggleLiveStreaming,
  onOpenSearch,
}) => {
  const navItems = [
    {
      id: 'traces' as NavScreen,
      label: 'Live Requests',
      sublabel: 'Inspect traces & errors',
      icon: Activity,
      count: undefined,
    },
    {
      id: 'decisions' as NavScreen,
      label: 'AI Fixes & ADRs',
      sublabel: 'Code patches & root causes',
      icon: Sparkles,
      count: pendingAdrCount > 0 ? pendingAdrCount : undefined,
      countColor: 'bg-[#6558D9] text-white',
    },
    {
      id: 'mesh' as NavScreen,
      label: 'System Map',
      sublabel: 'Microservice health',
      icon: Network,
      count: undefined,
    },
    {
      id: 'pipelines' as NavScreen,
      label: 'GitHub & CI/CD',
      sublabel: 'Live repos & pipelines',
      icon: Workflow,
      count: undefined,
    },
    {
      id: 'slos' as NavScreen,
      label: 'Reliability Goals',
      sublabel: 'Service error budgets',
      icon: ShieldAlert,
      count: undefined,
    },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 bottom-0 z-40 bg-white border-r border-[#E8EAF1] transition-all duration-200 flex flex-col ${
        isCollapsed ? 'w-16' : 'w-60'
      }`}
      style={{
        boxShadow: '0 1px 3px 0 rgba(32, 35, 51, 0.03)',
      }}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-3 border-b border-[#E8EAF1]">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-lg bg-[#6558D9] flex items-center justify-center shrink-0 text-white font-display font-bold shadow-sm">
            <Layers className="w-5 h-5 text-white" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-display font-semibold text-[15px] tracking-tight text-[#202333] truncate">
                DevTrace
              </span>
              <span className="text-[10px] tracking-wider font-mono text-[#777B8A] uppercase truncate">
                Kinetic Intel
              </span>
            </div>
          )}
        </div>

        <button
          onClick={onToggleCollapse}
          className="w-7 h-7 rounded-md border border-[#E8EAF1] bg-[#F7F8FC] hover:bg-white text-[#777B8A] hover:text-[#202333] flex items-center justify-center transition-colors"
          title={isCollapsed ? 'Expand sidebar (240px)' : 'Collapse sidebar (64px)'}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Quick Search Button (in rail) */}
      <div className="p-2 border-b border-[#E8EAF1]">
        <button
          onClick={onOpenSearch}
          className={`w-full flex items-center gap-2 rounded-lg border border-[#E8EAF1] bg-[#F7F8FC] text-[#777B8A] hover:text-[#202333] hover:border-[#6558D9]/40 transition-colors ${
            isCollapsed ? 'justify-center p-2 h-9' : 'px-2.5 py-1.5 text-xs'
          }`}
          title="Quick search (Cmd+K)"
        >
          <Search className="w-4 h-4 shrink-0 text-[#777B8A]" />
          {!isCollapsed && (
            <>
              <span className="truncate text-left flex-1 text-[12px]">Quick search...</span>
              <kbd className="px-1.5 py-0.5 text-[10px] bg-white border border-[#E8EAF1] rounded text-[#777B8A] font-mono">
                ⌘K
              </kbd>
            </>
          )}
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
        {!isCollapsed && (
          <div className="px-2 py-1 text-[11px] font-semibold text-[#A0A4B4] uppercase tracking-wider font-display">
            Observability
          </div>
        )}

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentScreen === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectScreen(item.id)}
              className={`w-full flex items-center gap-3 rounded-lg text-left transition-all ${
                isCollapsed ? 'justify-center p-2.5 h-10' : 'px-3 py-2 text-xs'
              } ${
                isActive
                  ? 'bg-[#F3F2FF] text-[#6558D9] font-medium'
                  : 'text-[#474554] hover:bg-[#F7F8FC] hover:text-[#202333]'
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon
                className={`w-4 h-4 shrink-0 transition-colors ${
                  isActive ? 'text-[#6558D9]' : 'text-[#777B8A]'
                }`}
              />

              {!isCollapsed && (
                <div className="flex-1 min-w-0 flex items-center justify-between">
                  <div className="flex flex-col truncate">
                    <span className="truncate font-display font-medium text-[13px]">{item.label}</span>
                  </div>
                  {item.count !== undefined && (
                    <span
                      className={`text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded-full ${
                        item.countColor || 'bg-[#F0FDF4] text-[#16A36A]'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </div>
              )}

              {/* Collapsed dot badge */}
              {isCollapsed && item.count !== undefined && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#6558D9]" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Live Stream Telemetry Controller */}
      <div className="p-2 border-t border-[#E8EAF1] bg-[#F7F8FC]/60">
        <button
          onClick={onToggleLiveStreaming}
          className={`w-full flex items-center rounded-lg border text-xs transition-colors ${
            liveStreaming
              ? 'bg-[#F0FDF4] border-[#BBF7D0] text-[#16A36A]'
              : 'bg-white border-[#E8EAF1] text-[#777B8A] hover:text-[#202333]'
          } ${isCollapsed ? 'justify-center p-2 h-9' : 'px-2.5 py-2'}`}
          title={liveStreaming ? 'Telemetry stream is ACTIVE' : 'Telemetry stream is PAUSED'}
        >
          <Radio className={`w-4 h-4 shrink-0 ${liveStreaming ? 'text-[#16A36A] animate-pulse' : 'text-[#777B8A]'}`} />
          {!isCollapsed && (
            <div className="ml-2 flex-1 text-left flex items-center justify-between">
              <span className="font-medium text-[12px]">{liveStreaming ? 'Live Stream On' : 'Stream Paused'}</span>
              <span
                className={`w-2 h-2 rounded-full ${
                  liveStreaming ? 'bg-[#16A36A] shadow-[0_0_8px_#16A36A]' : 'bg-[#A0A4B4]'
                }`}
              />
            </div>
          )}
        </button>
      </div>

      {/* User / Workspace Profile Footer */}
      <div className="p-3 border-t border-[#E8EAF1] flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-[#ECECFF] border border-[#C8C4D6] flex items-center justify-center font-display font-semibold text-xs text-[#4C3DBF] shrink-0">
          PO
        </div>
        {!isCollapsed && (
          <div className="flex flex-col min-w-0">
            <span className="text-[12px] font-semibold text-[#202333] truncate">Elena Rostova</span>
            <span className="text-[11px] text-[#777B8A] truncate">Principal Architect</span>
          </div>
        )}
      </div>
    </aside>
  );
};
