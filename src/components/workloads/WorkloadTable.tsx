import { AnimatePresence } from 'framer-motion';
import type { Workload } from '../../types/kueue';
import type { SortConfig, SortableField } from '../../hooks/useWorkloadSort';
import { WorkloadRow } from './WorkloadRow';
import { SortableHeader } from './SortableHeader';

interface WorkloadTableProps {
  workloads: Workload[];
  compact?: boolean;
  sortConfig?: SortConfig;
  onSort?: (field: SortableField, shiftKey: boolean) => void;
}

interface ColumnDef {
  key: string;
  label: string;
  sortable?: SortableField;
}

const COLUMNS: ColumnDef[] = [
  { key: 'workload', label: 'Workload' },
  { key: 'type', label: 'Type' },
  { key: 'namespace', label: 'Namespace' },
  { key: 'priority', label: 'Priority', sortable: 'priority' },
  { key: 'gpus', label: 'GPUs', sortable: 'gpusRequested' },
  { key: 'status', label: 'Status', sortable: 'status' },
  { key: 'pool', label: 'Pool' },
];

export function WorkloadTable({ workloads, compact, sortConfig, onSort }: WorkloadTableProps) {
  return (
    <div className={`bg-surface rounded-[12px] border border-border shadow-[0_4px_16px_rgba(0,0,0,0.4)] ${compact ? '' : 'p-4'}`}>
      {!compact && <h3 className="text-sm font-medium text-text-primary mb-3">Workloads</h3>}
      <div className={compact ? 'p-4' : ''}>
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              {COLUMNS.map((col) =>
                col.sortable && sortConfig && onSort ? (
                  <SortableHeader
                    key={col.key}
                    field={col.sortable}
                    label={col.label}
                    sortConfig={sortConfig}
                    onSort={onSort}
                  />
                ) : (
                  <th
                    key={col.key}
                    className="pb-2 text-left text-[11px] font-medium text-text-muted uppercase tracking-wide"
                  >
                    {col.label}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {workloads.map((wl) => (
                <WorkloadRow key={wl.id} workload={wl} />
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  );
}
