import { motion } from 'framer-motion';
import type { Workload } from '../../types/kueue';
import { StatusBadge } from './StatusBadge';

interface WorkloadRowProps {
  workload: Workload;
}

const PRIORITY_STYLES = {
  high: 'bg-critical/15 text-critical',
  low: 'bg-surface-2 text-text-muted',
};

const TYPE_STYLES: Record<string, string> = {
  PyTorchJob: 'bg-orange-500/15 text-orange-400',
  RayJob: 'bg-blue-500/15 text-blue-400',
  MPIJob: 'bg-purple-500/15 text-purple-400',
  TFJob: 'bg-yellow-500/15 text-yellow-400',
  Job: 'bg-surface-2 text-text-muted',
};

export function WorkloadRow({ workload }: WorkloadRowProps) {
  const typeStyle = TYPE_STYLES[workload.type || 'Job'] || TYPE_STYLES.Job;

  return (
    <motion.tr
      layout
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25 }}
      className="border-b border-border/50 last:border-b-0"
    >
      <td className="py-3 pr-4 text-[13px] text-text-primary font-medium max-w-[200px] truncate" title={workload.name}>
        {workload.name}
      </td>
      <td className="py-3 pr-4">
        <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${typeStyle}`}>
          {workload.type || 'Job'}
        </span>
      </td>
      <td className="py-3 pr-4 text-[13px] text-text-secondary">{workload.namespace || workload.team}</td>
      <td className="py-3 pr-4">
        <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${PRIORITY_STYLES[workload.priority]}`}>
          {workload.priority.toUpperCase()}
        </span>
      </td>
      <td className="py-3 pr-4 text-[13px] text-text-secondary">{workload.gpusRequested}</td>
      <td className="py-3 pr-4">
        <StatusBadge status={workload.status} />
      </td>
      <td className="py-3 text-[13px] text-text-secondary">{workload.pool}</td>
    </motion.tr>
  );
}
