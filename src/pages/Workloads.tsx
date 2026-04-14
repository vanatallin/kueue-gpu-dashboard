import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useDemo } from '../context/DemoContext';
import { useSearch } from '../context/SearchContext';
import { useWorkloads } from '../hooks/useKueueData';
import { WorkloadTable } from '../components/workloads/WorkloadTable';
import { EventLog } from '../components/workloads/EventLog';
import { Loader2, AlertCircle } from 'lucide-react';

export function Workloads() {
  const { isAuthenticated } = useAuth();
  const { state: demoState } = useDemo();
  const { query } = useSearch();
  const { workloads, isLoading, error } = useWorkloads();

  // Use real data if authenticated, otherwise demo data
  const allWorkloads = isAuthenticated ? workloads : demoState.workloads;
  const displayEvents = isAuthenticated ? [] : demoState.events; // Events not available from API yet

  // Filter workloads by search query
  const displayWorkloads = useMemo(() => {
    if (!query.trim()) return allWorkloads;
    const lowerQuery = query.toLowerCase();
    return allWorkloads.filter(
      (w) =>
        (w.name?.toLowerCase() || '').includes(lowerQuery) ||
        (w.namespace?.toLowerCase() || '').includes(lowerQuery) ||
        (w.type?.toLowerCase() || '').includes(lowerQuery) ||
        (w.pool?.toLowerCase() || '').includes(lowerQuery) ||
        (w.status?.toLowerCase() || '').includes(lowerQuery)
    );
  }, [allWorkloads, query]);

  if (isAuthenticated && isLoading) {
    return (
      <div className="flex items-center justify-center h-64 gap-3 text-text-muted">
        <Loader2 size={20} className="animate-spin" />
        <span>Loading workloads...</span>
      </div>
    );
  }

  if (isAuthenticated && error) {
    return (
      <div className="flex items-center justify-center h-64 gap-3 text-critical">
        <AlertCircle size={20} />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-[1200px]">
      {!isAuthenticated && (
        <div className="bg-surface-2 border border-border rounded-lg p-3 text-[13px] text-text-secondary">
          Showing demo data. Login with OpenShift to see real workloads.
        </div>
      )}
      <WorkloadTable workloads={displayWorkloads} />
      {displayEvents.length > 0 && <EventLog events={displayEvents} />}
    </div>
  );
}
