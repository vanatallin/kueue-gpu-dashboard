import { useState, type ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { CopilotPanel } from '../copilot/CopilotPanel';
import { DemoControlBar } from '../demo/DemoControlBar';
import { useSettings } from '../../context/SettingsContext';

const PAGE_TITLES: Record<string, string> = {
  cluster: 'Cluster Control',
  clusterqueues: 'Cluster Queues',
  pools: 'Resource Monitor',
  nodes: 'Nodes',
  workloads: 'Workloads',
  quotas: 'Quotas',
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
  const { settings } = useSettings();

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      <Sidebar activePage={activePage} onNavigate={onNavigate} />
      <div className="flex flex-col flex-1 min-w-0">
        <TopBar
          title={PAGE_TITLES[activePage] ?? 'Dashboard'}
          onToggleCopilot={() => setCopilotOpen((o) => !o)}
        />
        <div className="flex flex-1 overflow-hidden">
          <main className={`flex-1 overflow-y-auto p-6 ${settings.demoSliderEnabled ? 'pb-24' : ''}`}>
            {children}
          </main>
          {copilotOpen && <CopilotPanel onClose={() => setCopilotOpen(false)} />}
        </div>
      </div>
      {settings.demoSliderEnabled && <DemoControlBar />}
    </div>
  );
}
