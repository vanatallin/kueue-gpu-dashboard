import { useState, useCallback } from 'react';
import type { Workload, WorkloadStatus } from '../types/kueue';

export type SortDirection = 'asc' | 'desc';

export type SortableField = 'priority' | 'gpusRequested' | 'status' | 'submittedAt';

export interface SortColumn {
  field: SortableField;
  direction: SortDirection;
}

export interface SortConfig {
  primary: SortColumn | null;
  secondary: SortColumn | null;
}

const STATUS_ORDER: Record<WorkloadStatus, number> = {
  running: 0,
  pending: 1,
  resuming: 2,
  preempted: 3,
  completed: 4,
};

function toggleDirection(direction: SortDirection): SortDirection {
  return direction === 'asc' ? 'desc' : 'asc';
}

function compareWorkloads(a: Workload, b: Workload, sortCol: SortColumn): number {
  let result = 0;

  switch (sortCol.field) {
    case 'priority':
      // high > low
      result = (a.priority === 'high' ? 1 : 0) - (b.priority === 'high' ? 1 : 0);
      break;
    case 'gpusRequested':
      result = a.gpusRequested - b.gpusRequested;
      break;
    case 'status':
      result = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
      break;
    case 'submittedAt':
      result = a.submittedAt.localeCompare(b.submittedAt);
      break;
  }

  return sortCol.direction === 'desc' ? -result : result;
}

export function useWorkloadSort() {
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    primary: null,
    secondary: null,
  });

  const handleSort = useCallback((field: SortableField, isShiftKey: boolean) => {
    setSortConfig((prev) => {
      if (isShiftKey && prev.primary && prev.primary.field !== field) {
        // Add or toggle secondary sort
        if (prev.secondary?.field === field) {
          return {
            ...prev,
            secondary: { field, direction: toggleDirection(prev.secondary.direction) },
          };
        }
        return {
          ...prev,
          secondary: { field, direction: 'asc' },
        };
      }

      // Primary sort - toggle direction if same field, otherwise set new
      if (prev.primary?.field === field) {
        return {
          primary: { field, direction: toggleDirection(prev.primary.direction) },
          secondary: null,
        };
      }

      return {
        primary: { field, direction: 'asc' },
        secondary: null,
      };
    });
  }, []);

  const applySort = useCallback((workloads: Workload[]) => {
    if (!sortConfig.primary) return workloads;

    return [...workloads].sort((a, b) => {
      const primaryResult = compareWorkloads(a, b, sortConfig.primary!);
      if (primaryResult !== 0 || !sortConfig.secondary) {
        return primaryResult;
      }
      return compareWorkloads(a, b, sortConfig.secondary);
    });
  }, [sortConfig]);

  const clearSort = useCallback(() => {
    setSortConfig({ primary: null, secondary: null });
  }, []);

  return {
    sortConfig,
    handleSort,
    applySort,
    clearSort,
  };
}
