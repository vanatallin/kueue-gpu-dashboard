import { AnimatePresence } from 'framer-motion';
import type { Workload } from '../../types/kueue';
import { WorkloadRow } from './WorkloadRow';

interface WorkloadTableProps {
  workloads: Workload[];
  compact?: boolean;
}

const COLUMNS = ['Workload', 'Team', 'Priority', 'GPUs', 'Status', 'Progress', 'Pool'];

export function WorkloadTable({ workloads, compact }: WorkloadTableProps) {
  return (
    <div className={`bg-surface rounded-[12px] border border-border shadow-[0_4px_16px_rgba(0,0,0,0.4)] ${compact ? '' : 'p-4'}`}>
      {!compact && <h3 className="text-sm font-medium text-text-primary mb-3">Workloads</h3>}
      <div className={compact ? 'p-4' : ''}>
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              {COLUMNS.map((col) => (
                <th key={col} className="pb-2 text-left text-[11px] font-medium text-text-muted uppercase tracking-wide">
                  {col}
                </th>
              ))}
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
