import { useState, useMemo, useCallback } from 'react';
import type { Workload, WorkloadStatus, Priority } from '../types/kueue';

export interface WorkloadFilters {
  status: WorkloadStatus[];
  type: string[];
  priority: Priority[];
  hasGpus: boolean | null; // true = has GPUs, false = no GPUs, null = all
}

const INITIAL_FILTERS: WorkloadFilters = {
  status: [],
  type: [],
  priority: [],
  hasGpus: null,
};

export function useWorkloadFilters() {
  const [filters, setFilters] = useState<WorkloadFilters>(INITIAL_FILTERS);

  const updateFilter = useCallback(<K extends keyof WorkloadFilters>(
    key: K,
    value: WorkloadFilters[K]
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const clearFilter = useCallback((key: keyof WorkloadFilters) => {
    setFilters((prev) => ({
      ...prev,
      [key]: key === 'hasGpus' ? null : [],
    }));
  }, []);

  const clearAllFilters = useCallback(() => {
    setFilters(INITIAL_FILTERS);
  }, []);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    count += filters.status.length;
    count += filters.type.length;
    count += filters.priority.length;
    if (filters.hasGpus !== null) count += 1;
    return count;
  }, [filters]);

  const applyFilters = useCallback((workloads: Workload[]) => {
    return workloads.filter((w) => {
      // Status filter
      if (filters.status.length > 0 && !filters.status.includes(w.status)) {
        return false;
      }
      // Type filter
      if (filters.type.length > 0 && !filters.type.includes(w.type || 'Job')) {
        return false;
      }
      // Priority filter
      if (filters.priority.length > 0 && !filters.priority.includes(w.priority)) {
        return false;
      }
      // GPU filter
      if (filters.hasGpus === true && w.gpusRequested === 0) {
        return false;
      }
      if (filters.hasGpus === false && w.gpusRequested > 0) {
        return false;
      }
      return true;
    });
  }, [filters]);

  return {
    filters,
    updateFilter,
    clearFilter,
    clearAllFilters,
    activeFilterCount,
    applyFilters,
  };
}
