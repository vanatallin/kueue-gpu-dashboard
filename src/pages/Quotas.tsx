import { useState, useCallback, useEffect, useMemo } from 'react';
import type { QuotaNode } from '../types/kueue';
import { QUOTA_TREE } from '../data/quotas';
import { useSearch } from '../context/SearchContext';
import { useSettings } from '../context/SettingsContext';
import { useQuotas } from '../hooks/useKueueData';
import { QuotaTree } from '../components/quotas/QuotaTree';
import { QuotaTable } from '../components/quotas/QuotaTable';
import { QuotaEditPanel } from '../components/quotas/QuotaEditPanel';
import { QuotaViewToggle } from '../components/quotas/QuotaViewToggle';
import { AnimatePresence } from 'framer-motion';
import { Loader2, AlertCircle } from 'lucide-react';

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

// Filter tree nodes by search query, keeping ancestors of matching nodes
function filterTree(node: QuotaNode, query: string): QuotaNode | null {
  const lowerQuery = query.toLowerCase();
  const nameMatches = (node.name?.toLowerCase() || '').includes(lowerQuery);
  const typeMatches = (node.type?.toLowerCase() || '').includes(lowerQuery);

  // Filter children recursively
  const filteredChildren = (node.children || [])
    .map((child) => filterTree(child, query))
    .filter((child): child is QuotaNode => child !== null);

  // Keep node if it matches or has matching descendants
  if (nameMatches || typeMatches || filteredChildren.length > 0) {
    return { ...node, children: filteredChildren };
  }

  return null;
}

// Convert flat quotas array to tree structure
function buildQuotaTree(quotas: QuotaNode[]): QuotaNode {
  if (quotas.length === 0) {
    return QUOTA_TREE; // fallback to demo
  }

  // If we only have one root, return it
  if (quotas.length === 1) {
    return quotas[0];
  }

  // Otherwise wrap in a virtual root
  return {
    id: 'root',
    name: 'Cluster',
    type: 'cohort',
    nominalGpus: quotas.reduce((sum, q) => sum + q.nominalGpus, 0),
    usedGpus: quotas.reduce((sum, q) => sum + q.usedGpus, 0),
    borrowingLimit: 0,
    lendingLimit: 0,
    priority: 0,
    children: quotas,
  };
}

export function Quotas() {
  const { settings } = useSettings();
  const { query } = useSearch();
  const { quotas: apiQuotas, isLoading, error } = useQuotas();

  const [tree, setTree] = useState<QuotaNode>(QUOTA_TREE);
  const [viewMode, setViewMode] = useState<ViewMode>('tree');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Update tree when API data changes
  useEffect(() => {
    if (!settings.demoMode && apiQuotas.length > 0) {
      setTree(buildQuotaTree(apiQuotas));
    } else if (settings.demoMode) {
      setTree(QUOTA_TREE);
    }
  }, [settings.demoMode, apiQuotas]);

  // Filter tree by search query
  const filteredTree = useMemo(() => {
    if (!query.trim()) return tree;
    const filtered = filterTree(tree, query);
    return filtered || { ...tree, children: [] };
  }, [tree, query]);

  const selectedNode = selectedId ? findNode(tree, selectedId) : null;

  const handleSave = useCallback((updated: QuotaNode) => {
    setTree((prev) => updateNode(prev, updated));
  }, []);

  if (!settings.demoMode && isLoading) {
    return (
      <div className="flex items-center justify-center h-64 gap-3 text-text-muted">
        <Loader2 size={20} className="animate-spin" />
        <span>Loading quotas...</span>
      </div>
    );
  }

  if (!settings.demoMode && error) {
    return (
      <div className="flex items-center justify-center h-64 gap-3 text-critical">
        <AlertCircle size={20} />
        <span>{error}</span>
      </div>
    );
  }

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

      {settings.demoMode && (
        <div className="bg-surface-2 border border-border rounded-lg p-3 text-[13px] text-text-secondary">
          Showing demo data. Login with OpenShift to see real quotas.
        </div>
      )}

      <div className="flex gap-0 flex-1 min-h-0">
        <div className="flex-1 bg-surface rounded-[12px] border border-border p-4 overflow-y-auto shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
          {filteredTree.children.length === 0 && query ? (
            <div className="flex items-center justify-center h-32 text-text-muted text-[13px]">
              No quotas match your search
            </div>
          ) : viewMode === 'tree' ? (
            <QuotaTree root={filteredTree} selectedId={selectedId} onSelect={setSelectedId} />
          ) : (
            <QuotaTable root={filteredTree} selectedId={selectedId} onSelect={setSelectedId} />
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
