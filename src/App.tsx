import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DemoProvider } from './context/DemoContext';
import { SearchProvider } from './context/SearchContext';
import { SettingsProvider } from './context/SettingsContext';
import { RefreshProvider } from './context/RefreshContext';
import { AppShell } from './components/layout/AppShell';
import { LoginPage } from './pages/LoginPage';
import { ClusterControl } from './pages/ClusterControl';
import { ClusterQueues } from './pages/ClusterQueues';
import { Workloads } from './pages/Workloads';
import { Quotas } from './pages/Quotas';
import { ResourcePools } from './pages/ResourcePools';
import { Nodes } from './pages/Nodes';
import { Metrics } from './pages/Metrics';
import { Settings } from './pages/Settings';
import { Loader2 } from 'lucide-react';

function AppContent() {
  const [page, setPage] = useState('cluster');
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-bg gap-3 text-text-muted">
        <Loader2 size={20} className="animate-spin" />
        <span>Checking authentication...</span>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
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
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <AppContent />
      </SettingsProvider>
    </AuthProvider>
  );
}
