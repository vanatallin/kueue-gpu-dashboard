import { useState, useCallback } from 'react';
import type { QuotaNode } from '../types/kueue';
import { QUOTA_TREE } from '../data/quotas';
import { QuotaTree } from '../components/quotas/QuotaTree';
import { QuotaTable } from '../components/quotas/QuotaTable';
import { QuotaEditPanel } from '../components/quotas/QuotaEditPanel';
import { QuotaViewToggle } from '../components/quotas/QuotaViewToggle';
import { AnimatePresence } from 'framer-motion';

type ViewMode = 'tree' | 'table';

function findNode(root: QuotaNode, id: string): QuotaNode | null {
  if (root.id === id) return root;
  for (const child of root.children) {
    const found = findNode(child, id);
    if (found) return found;
  }
  return null;
}

function updateNode(root: QuotaNode, updated: QuotaNode): QuotaNode {
  if (root.id === updated.id) return { ...updated, children: root.children };
  return {
    ...root,
    children: root.children.map((c) => updateNode(c, updated)),
  };
}

export function Quotas() {
  const [tree, setTree] = useState<QuotaNode>(QUOTA_TREE);
  const [viewMode, setViewMode] = useState<ViewMode>('tree');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedNode = selectedId ? findNode(tree, selectedId) : null;

  const handleSave = useCallback((updated: QuotaNode) => {
    setTree((prev) => updateNode(prev, updated));
  }, []);

  return (
    <div className="flex flex-col gap-4 h-full max-w-[1200px]">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">Quota Hierarchy</h2>
          <p className="text-[13px] text-text-secondary mt-0.5">
            Manage GPU quotas across cohorts, cluster queues, and local queues.
          </p>
        </div>
        <QuotaViewToggle mode={viewMode} onChange={setViewMode} />
      </div>

      <div className="flex gap-0 flex-1 min-h-0">
        <div className="flex-1 bg-surface rounded-[12px] border border-border p-4 overflow-y-auto shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
          {viewMode === 'tree' ? (
            <QuotaTree root={tree} selectedId={selectedId} onSelect={setSelectedId} />
          ) : (
            <QuotaTable root={tree} selectedId={selectedId} onSelect={setSelectedId} />
          )}
        </div>

        <AnimatePresence>
          {selectedNode && (
            <QuotaEditPanel
              key={selectedNode.id}
              node={selectedNode}
              onSave={handleSave}
              onClose={() => setSelectedId(null)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
