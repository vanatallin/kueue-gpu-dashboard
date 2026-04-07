import { useState } from 'react';
import { ChevronRight, ChevronDown, Server, Layers, Inbox } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { QuotaNode } from '../../types/kueue';
import { ProgressBar } from '../ui/ProgressBar';

const TYPE_CONFIG: Record<string, { icon: typeof Server; label: string; color: string }> = {
  cohort: { icon: Server, label: 'Cohort', color: 'var(--color-primary)' },
  clusterQueue: { icon: Layers, label: 'ClusterQueue', color: 'var(--color-compute)' },
  localQueue: { icon: Inbox, label: 'LocalQueue', color: 'var(--color-memory)' },
};

interface QuotaTreeNodeProps {
  node: QuotaNode;
  depth: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function QuotaTreeNode({ node, depth, selectedId, onSelect }: QuotaTreeNodeProps) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children.length > 0;
  const cfg = TYPE_CONFIG[node.type];
  const Icon = cfg.icon;
  const selected = selectedId === node.id;
  const usagePct = node.nominalGpus > 0 ? Math.round((node.usedGpus / node.nominalGpus) * 100) : 0;

  return (
    <div>
      <div
        className={`flex items-center gap-2 h-10 px-3 rounded-lg cursor-pointer transition-colors group ${
          selected ? 'bg-primary/10 border border-primary/40' : 'hover:bg-surface-2/60 border border-transparent'
        }`}
        style={{ paddingLeft: `${depth * 24 + 12}px` }}
        onClick={() => onSelect(node.id)}
      >
        {hasChildren ? (
          <button
            className="w-5 h-5 flex items-center justify-center shrink-0 text-text-muted hover:text-text-primary"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded((v) => !v);
            }}
          >
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        ) : (
          <span className="w-5 shrink-0" />
        )}

        <Icon size={14} style={{ color: cfg.color }} className="shrink-0" />

        <span className="text-[13px] font-medium text-text-primary truncate">{node.name}</span>

        <span
          className="text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0"
          style={{ backgroundColor: `color-mix(in srgb, ${cfg.color} 15%, transparent)`, color: cfg.color }}
        >
          {cfg.label}
        </span>

        <div className="ml-auto flex items-center gap-3 shrink-0">
          <div className="w-20">
            <ProgressBar
              value={node.usedGpus}
              max={node.nominalGpus}
              color={usagePct > 85 ? 'var(--color-warning)' : cfg.color}
            />
          </div>
          <span className="text-[11px] text-text-muted w-20 text-right">
            {node.usedGpus}/{node.nominalGpus} GPUs
          </span>
          {node.borrowingLimit > 0 && (
            <span className="text-[10px] text-text-muted">
              +{node.borrowingLimit} borrow
            </span>
          )}
        </div>
      </div>

      <AnimatePresence initial={false}>
        {expanded && hasChildren && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {node.children.map((child) => (
              <QuotaTreeNode
                key={child.id}
                node={child}
                depth={depth + 1}
                selectedId={selectedId}
                onSelect={onSelect}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
