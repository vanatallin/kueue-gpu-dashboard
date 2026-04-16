import { useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import type { WorkloadFilters as Filters } from '../../hooks/useWorkloadFilters';
import type { Workload, WorkloadStatus, Priority } from '../../types/kueue';
import { FilterDropdown } from './FilterDropdown';
import { FilterChip } from './FilterChip';

interface WorkloadFiltersProps {
  filters: Filters;
  workloads: Workload[];
  onUpdateFilter: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
  onClearFilter: (key: keyof Filters) => void;
  onClearAll: () => void;
  activeCount: number;
}

const STATUS_OPTIONS = [
  { value: 'running', label: 'Running', color: 'var(--color-status-running)' },
  { value: 'pending', label: 'Pending', color: 'var(--color-status-pending)' },
  { value: 'resuming', label: 'Resuming', color: 'var(--color-status-resuming)' },
  { value: 'preempted', label: 'Preempted', color: 'var(--color-status-preempted)' },
  { value: 'completed', label: 'Completed', color: 'var(--color-status-completed)' },
];

const PRIORITY_OPTIONS = [
  { value: 'high', label: 'High', color: 'var(--color-critical)' },
  { value: 'low', label: 'Low', color: 'var(--color-text-muted)' },
];

const STATUS_COLORS: Record<string, string> = {
  running: 'var(--color-status-running)',
  pending: 'var(--color-status-pending)',
  resuming: 'var(--color-status-resuming)',
  preempted: 'var(--color-status-preempted)',
  completed: 'var(--color-status-completed)',
};

const PRIORITY_COLORS: Record<string, string> = {
  high: 'var(--color-critical)',
  low: 'var(--color-text-muted)',
};

export function WorkloadFilters({
  filters,
  workloads,
  onUpdateFilter,
  onClearFilter,
  onClearAll,
  activeCount,
}: WorkloadFiltersProps) {
  // Derive type options dynamically from workloads
  const typeOptions = useMemo(() => {
    const types = new Set<string>();
    workloads.forEach((w) => {
      if (w.type) {
        types.add(w.type);
      }
    });
    return Array.from(types)
      .sort()
      .map((type) => ({ value: type, label: type }));
  }, [workloads]);

  const removeStatusFilter = (status: WorkloadStatus) => {
    onUpdateFilter('status', filters.status.filter((s) => s !== status));
  };

  const removeTypeFilter = (type: string) => {
    onUpdateFilter('type', filters.type.filter((t) => t !== type));
  };

  const removePriorityFilter = (priority: Priority) => {
    onUpdateFilter('priority', filters.priority.filter((p) => p !== priority));
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Filter dropdowns row */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-[12px] text-text-muted uppercase tracking-wide">Filter:</span>

        <FilterDropdown
          label="Status"
          options={STATUS_OPTIONS}
          selected={filters.status}
          onChange={(selected) => onUpdateFilter('status', selected as WorkloadStatus[])}
        />

        <FilterDropdown
          label="Type"
          options={typeOptions}
          selected={filters.type}
          onChange={(selected) => onUpdateFilter('type', selected)}
          allowFreeText
          freeTextPlaceholder="Add type..."
        />

        <FilterDropdown
          label="Priority"
          options={PRIORITY_OPTIONS}
          selected={filters.priority}
          onChange={(selected) => onUpdateFilter('priority', selected as Priority[])}
        />

        {/* GPU toggle */}
        <div className="flex items-center bg-surface-2 border border-border rounded-[6px] overflow-hidden">
          {[
            { value: null, label: 'All GPUs' },
            { value: true, label: 'Has GPUs' },
            { value: false, label: 'No GPUs' },
          ].map((option) => (
            <button
              key={String(option.value)}
              onClick={() => onUpdateFilter('hasGpus', option.value)}
              className={`px-3 py-1.5 text-[13px] transition-colors ${
                filters.hasGpus === option.value
                  ? 'bg-primary text-white'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Active filters chips row */}
      {activeCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[12px] text-text-muted">Active:</span>

          <AnimatePresence mode="popLayout">
            {filters.status.map((status) => (
              <FilterChip
                key={`status-${status}`}
                label="Status"
                value={status}
                color={STATUS_COLORS[status]}
                onRemove={() => removeStatusFilter(status)}
              />
            ))}

            {filters.type.map((type) => (
              <FilterChip
                key={`type-${type}`}
                label="Type"
                value={type}
                onRemove={() => removeTypeFilter(type)}
              />
            ))}

            {filters.priority.map((priority) => (
              <FilterChip
                key={`priority-${priority}`}
                label="Priority"
                value={priority}
                color={PRIORITY_COLORS[priority]}
                onRemove={() => removePriorityFilter(priority)}
              />
            ))}

            {filters.hasGpus !== null && (
              <FilterChip
                key="gpu-filter"
                label="GPUs"
                value={filters.hasGpus ? 'Has GPUs' : 'No GPUs'}
                onRemove={() => onClearFilter('hasGpus')}
              />
            )}
          </AnimatePresence>

          <button
            onClick={onClearAll}
            className="flex items-center gap-1 px-2 py-1 text-[12px] text-text-muted hover:text-text-primary transition-colors"
          >
            <X size={12} />
            Clear All
          </button>
        </div>
      )}
    </div>
  );
}
