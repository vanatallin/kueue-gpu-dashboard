import { motion } from 'framer-motion';
import type { GpuSlice } from '../../types/kueue';

const SLICE_COLORS = {
  compute: 'var(--color-compute)',
  memory: 'var(--color-memory)',
  mixed: undefined,
};

interface GpuSliceBarProps {
  slice: GpuSlice;
}

export function GpuSliceBar({ slice }: GpuSliceBarProps) {
  const bg = SLICE_COLORS[slice.type];
  const style = bg
    ? { backgroundColor: bg, opacity: slice.utilization }
    : {
        background: `linear-gradient(90deg, var(--color-compute), var(--color-memory))`,
        opacity: slice.utilization,
      };

  return (
    <motion.div
      className="h-2.5 rounded-md"
      style={style}
      initial={{ scaleX: 0, originX: 0 }}
      animate={{ scaleX: 1 }}
      exit={{ scaleX: 0, opacity: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    />
  );
}
