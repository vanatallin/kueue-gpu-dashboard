import { useState, type ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { CopilotPanel } from '../copilot/CopilotPanel';
import { DemoControlBar } from '../demo/DemoControlBar';

const PAGE_TITLES: Record<string, string> = {
  cluster: 'Cluster Control',
  workloads: 'Workloads',
  pools: 'Resource Monitor',
  metrics: 'Metrics',
  settings: 'Settings',
};

interface AppShellProps {
  activePage: string;
  onNavigate: (page: string) => void;
  children: ReactNode;
}

export function AppShell({ activePage, onNavigate, children }: AppShellProps) {
  const [copilotOpen, setCopilotOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      <Sidebar activePage={activePage} onNavigate={onNavigate} />
      <div className="flex flex-col flex-1 min-w-0">
        <TopBar
          title={PAGE_TITLES[activePage] ?? 'Dashboard'}
          onToggleCopilot={() => setCopilotOpen((o) => !o)}
        />
        <div className="flex flex-1 overflow-hidden">
          <main className="flex-1 overflow-y-auto p-6 pb-24">
            {children}
          </main>
          {copilotOpen && <CopilotPanel onClose={() => setCopilotOpen(false)} />}
        </div>
        <DemoControlBar />
      </div>
    </div>
  );
}
