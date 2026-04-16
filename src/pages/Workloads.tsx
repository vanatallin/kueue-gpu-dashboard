import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useDemo } from '../context/DemoContext';
import { useSearch } from '../context/SearchContext';
import { useWorkloads } from '../hooks/useKueueData';
import { useWorkloadFilters } from '../hooks/useWorkloadFilters';
import { useWorkloadSort } from '../hooks/useWorkloadSort';
import { WorkloadTable } from '../components/workloads/WorkloadTable';
import { WorkloadFilters } from '../components/workloads/WorkloadFilters';
import { EventLog } from '../components/workloads/EventLog';
import { Loader2, AlertCircle } from 'lucide-react';

export function Workloads() {
  const { isAuthenticated } = useAuth();
  const { state: demoState } = useDemo();
  const { query } = useSearch();
  const { workloads, isLoading, error } = useWorkloads();

  // Filter and sort hooks
  const {
    filters,
    updateFilter,
    clearFilter,
    clearAllFilters,
    activeFilterCount,
    applyFilters,
  } = useWorkloadFilters();
  const { sortConfig, handleSort, applySort } = useWorkloadSort();

  // Use real data if authenticated, otherwise demo data
  const allWorkloads = isAuthenticated ? workloads : demoState.workloads;
  const displayEvents = isAuthenticated ? [] : demoState.events; // Events not available from API yet

  // Combined pipeline: search -> filter -> sort
  const displayWorkloads = useMemo(() => {
    let result = allWorkloads;

    // 1. Text search
    if (query.trim()) {
      const lowerQuery = query.toLowerCase();
      result = result.filter(
        (w) =>
          (w.name?.toLowerCase() || '').includes(lowerQuery) ||
          (w.namespace?.toLowerCase() || '').includes(lowerQuery) ||
          (w.type?.toLowerCase() || '').includes(lowerQuery) ||
          (w.pool?.toLowerCase() || '').includes(lowerQuery) ||
          (w.status?.toLowerCase() || '').includes(lowerQuery)
      );
    }

    // 2. Apply filters
    result = applyFilters(result);

    // 3. Apply sort
    result = applySort(result);

    return result;
  }, [allWorkloads, query, applyFilters, applySort]);

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
      <WorkloadFilters
        filters={filters}
        workloads={allWorkloads}
        onUpdateFilter={updateFilter}
        onClearFilter={clearFilter}
        onClearAll={clearAllFilters}
        activeCount={activeFilterCount}
      />
      <WorkloadTable
        workloads={displayWorkloads}
        sortConfig={sortConfig}
        onSort={handleSort}
      />
      {displayEvents.length > 0 && <EventLog events={displayEvents} />}
    </div>
  );
}
