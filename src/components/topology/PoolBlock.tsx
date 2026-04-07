import { motion, AnimatePresence } from 'framer-motion';
import type { GpuPool } from '../../types/kueue';
import { GpuSliceBar } from './GpuSliceBar';

interface PoolBlockProps {
  pool: GpuPool;
}

export function PoolBlock({ pool }: PoolBlockProps) {
  return (
    <motion.div
      className="w-[280px] min-h-[120px] p-3 rounded-[10px] bg-surface-2 border border-border cursor-pointer transition-colors hover:border-primary"
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-text-primary">{pool.name}</span>
        <span className="text-[11px] text-text-muted">
          {pool.usedGpus}/{pool.gpuCount} GPUs
        </span>
      </div>
      <div className="flex flex-col gap-1.5">
        <AnimatePresence>
          {pool.slices.map((slice) => (
            <GpuSliceBar key={slice.id} slice={slice} />
          ))}
        </AnimatePresence>
      </div>
      {pool.workloads.length > 0 && (
        <div className="mt-2 pt-2 border-t border-border/50">
          {pool.workloads.map((wl) => (
            <div key={wl.id} className="flex items-center justify-between text-[11px]">
              <span className="text-text-secondary">{wl.name}</span>
              <span className={wl.priority === 'high' ? 'text-critical' : 'text-text-muted'}>
                {wl.priority.toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
