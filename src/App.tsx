import { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { DemoProvider } from './context/DemoContext';
import { SearchProvider } from './context/SearchContext';
import { SettingsProvider } from './context/SettingsContext';
import { RefreshProvider } from './context/RefreshContext';
import { AppShell } from './components/layout/AppShell';
import { ClusterControl } from './pages/ClusterControl';
import { ClusterQueues } from './pages/ClusterQueues';
import { Workloads } from './pages/Workloads';
import { Quotas } from './pages/Quotas';
import { ResourcePools } from './pages/ResourcePools';
import { Nodes } from './pages/Nodes';
import { Metrics } from './pages/Metrics';
import { Settings } from './pages/Settings';

export default function App() {
  const [page, setPage] = useState('cluster');

  return (
    <AuthProvider>
      <SettingsProvider>
        <RefreshProvider>
          <DemoProvider>
            <SearchProvider>
              <AppShell activePage={page} onNavigate={setPage}>
              {page === 'cluster' && <ClusterControl />}
              {page === 'clusterqueues' && <ClusterQueues />}
              {page === 'workloads' && <Workloads />}
              {page === 'quotas' && <Quotas />}
              {page === 'pools' && <ResourcePools />}
              {page === 'nodes' && <Nodes />}
              {page === 'metrics' && <Metrics />}
              {page === 'settings' && <Settings />}
              {!['cluster', 'clusterqueues', 'workloads', 'quotas', 'pools', 'nodes', 'metrics', 'settings'].includes(page) && (
                <div className="flex items-center justify-center h-64 text-text-muted text-sm">
                  {page.charAt(0).toUpperCase() + page.slice(1)} — coming soon
                </div>
              )}
              </AppShell>
            </SearchProvider>
          </DemoProvider>
        </RefreshProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}
