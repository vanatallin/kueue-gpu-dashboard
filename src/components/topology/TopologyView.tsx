import { useDemo } from '../../context/DemoContext';
import { PoolBlock } from './PoolBlock';
import { motion, AnimatePresence } from 'framer-motion';

export function TopologyView() {
  const { state } = useDemo();

  return (
    <div className="bg-surface rounded-[12px] border border-border p-4 min-h-[200px] shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
      <h3 className="text-sm font-medium text-text-primary mb-4">GPU Topology</h3>
      <div className="flex flex-wrap gap-6">
        <AnimatePresence>
          {state.pools.map((pool) => (
            <motion.div
              key={pool.name}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <PoolBlock pool={pool} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
