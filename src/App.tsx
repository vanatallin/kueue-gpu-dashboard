import { useState } from 'react';
import { DemoProvider } from './context/DemoContext';
import { AppShell } from './components/layout/AppShell';
import { ClusterControl } from './pages/ClusterControl';
import { Workloads } from './pages/Workloads';
import { Quotas } from './pages/Quotas';
import { ResourcePools } from './pages/ResourcePools';

export default function App() {
  const [page, setPage] = useState('cluster');

  return (
    <DemoProvider>
      <AppShell activePage={page} onNavigate={setPage}>
        {page === 'cluster' && <ClusterControl />}
        {page === 'workloads' && <Workloads />}
        {page === 'quotas' && <Quotas />}
        {page === 'pools' && <ResourcePools />}
        {!['cluster', 'workloads', 'quotas', 'pools'].includes(page) && (
          <div className="flex items-center justify-center h-64 text-text-muted text-sm">
            {page.charAt(0).toUpperCase() + page.slice(1)} — coming soon
          </div>
        )}
      </AppShell>
    </DemoProvider>
  );
}
