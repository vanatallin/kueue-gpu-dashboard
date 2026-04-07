import { motion } from 'framer-motion';
import type { WorkloadStatus } from '../../types/kueue';

const STATUS_CONFIG: Record<WorkloadStatus, { color: string; label: string }> = {
  running: { color: 'var(--color-status-running)', label: 'Running' },
  pending: { color: 'var(--color-status-pending)', label: 'Pending' },
  preempted: { color: 'var(--color-status-preempted)', label: 'Preempted' },
  completed: { color: 'var(--color-status-completed)', label: 'Completed' },
  resuming: { color: 'var(--color-status-resuming)', label: 'Resuming' },
};

interface StatusBadgeProps {
  status: WorkloadStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const cfg = STATUS_CONFIG[status];
  return (
    <motion.span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium"
      style={{ backgroundColor: `color-mix(in srgb, ${cfg.color} 15%, transparent)`, color: cfg.color }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      key={status}
    >
      <motion.span
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: cfg.color }}
        animate={status === 'running' ? { opacity: [1, 0.4, 1] } : {}}
        transition={status === 'running' ? { repeat: Infinity, duration: 1.5 } : {}}
      />
      {cfg.label}
    </motion.span>
  );
}
