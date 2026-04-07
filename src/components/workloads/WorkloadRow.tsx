import { motion } from 'framer-motion';
import type { Workload } from '../../types/kueue';
import { StatusBadge } from './StatusBadge';
import { ProgressBar } from '../ui/ProgressBar';

interface WorkloadRowProps {
  workload: Workload;
}

const PRIORITY_STYLES = {
  high: 'bg-critical/15 text-critical',
  low: 'bg-surface-2 text-text-muted',
};

export function WorkloadRow({ workload }: WorkloadRowProps) {
  return (
    <motion.tr
      layout
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25 }}
      className="border-b border-border/50 last:border-b-0"
    >
      <td className="py-3 pr-4 text-[13px] text-text-primary font-medium">{workload.name}</td>
      <td className="py-3 pr-4 text-[13px] text-text-secondary">{workload.team}</td>
      <td className="py-3 pr-4">
        <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${PRIORITY_STYLES[workload.priority]}`}>
          {workload.priority.toUpperCase()}
        </span>
      </td>
      <td className="py-3 pr-4 text-[13px] text-text-secondary">{workload.gpusRequested} GPUs</td>
      <td className="py-3 pr-4">
        <StatusBadge status={workload.status} />
      </td>
      <td className="py-3 pr-4 w-32">
        <div className="flex items-center gap-2">
          <ProgressBar
            value={workload.progress}
            color={workload.status === 'preempted' ? 'var(--color-critical)' : 'var(--color-primary)'}
          />
          <span className="text-[11px] text-text-muted w-8 text-right">{workload.progress}%</span>
        </div>
      </td>
      <td className="py-3 text-[13px] text-text-secondary">{workload.pool}</td>
    </motion.tr>
  );
}
