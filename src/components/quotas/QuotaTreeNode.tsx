import { useState } from 'react';
import { ChevronRight, ChevronDown, Server, Layers, Inbox } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { QuotaNode } from '../../types/kueue';
import { ProgressBar } from '../ui/ProgressBar';
import { formatCpu, formatMemoryGi } from '../../utils/formatResources';
import { CohortLendingBadge } from '../queues/CohortLendingBadge';

export type QuotaResourceView = 'gpu' | 'cpu' | 'memory';

const TYPE_CONFIG: Record<string, { icon: typeof Server; label: string; color: string }> = {
  cohort: { icon: Server, label: 'Cohort', color: 'var(--color-primary)' },
  clusterQueue: { icon: Layers, label: 'ClusterQueue', color: 'var(--color-compute)' },
  localQueue: { icon: Inbox, label: 'LocalQueue', color: 'var(--color-memory)' },
};

function getResourceValues(node: QuotaNode, view: QuotaResourceView) {
  switch (view) {
    case 'cpu':
      return {
        used: node.usedCpu ?? 0,
        nominal: node.nominalCpu ?? 0,
        label: 'CPU',
        color: 'var(--color-compute)',
        format: (v: number) => `${formatCpu(v)} cores`,
      };
    case 'memory':
      return {
        used: node.usedMemory ?? 0,
        nominal: node.nominalMemory ?? 0,
        label: 'Memory',
        color: 'var(--color-memory)',
        format: (v: number) => `${formatMemoryGi(v)} GiB`,
      };
    default:
      return {
        used: node.usedGpus,
        nominal: node.nominalGpus,
        label: 'GPUs',
        color: TYPE_CONFIG[node.type]?.color || 'var(--color-primary)',
        format: (v: number) => `${v} GPUs`,
      };
  }
}

interface QuotaTreeNodeProps {
  node: QuotaNode;
  depth: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
  resourceView: QuotaResourceView;
}

export function QuotaTreeNode({ node, depth, selectedId, onSelect, resourceView }: QuotaTreeNodeProps) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children.length > 0;
  const cfg = TYPE_CONFIG[node.type];
  const Icon = cfg.icon;
  const selected = selectedId === node.id;
  const resource = getResourceValues(node, resourceView);
  const usagePct = resource.nominal > 0 ? Math.round((resource.used / resource.nominal) * 100) : 0;

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

        {node.type === 'cohort' && resourceView === 'gpu' && (
          <CohortLendingBadge gpuCount={node.borrowedGpus ?? 0} compact />
        )}

        <div className="ml-auto flex items-center gap-3 shrink-0">
          <div className="w-20">
            <ProgressBar
              value={resource.used}
              max={resource.nominal || 1}
              color={usagePct > 85 ? 'var(--color-warning)' : resource.color}
            />
          </div>
          <span className="text-[11px] text-text-muted w-28 text-right">
            {resource.format(resource.used)}/{resource.format(resource.nominal)}
          </span>
          {resourceView === 'gpu' && node.borrowingLimit > 0 && (
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
                resourceView={resourceView}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
