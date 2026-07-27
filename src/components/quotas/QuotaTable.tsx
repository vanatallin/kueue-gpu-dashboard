import type { QuotaNode } from '../../types/kueue';
import { ProgressBar } from '../ui/ProgressBar';
import { formatCpu, formatMemoryGi } from '../../utils/formatResources';
import type { QuotaResourceView } from './QuotaTreeNode';

interface FlatRow {
  node: QuotaNode;
  depth: number;
}

function flatten(node: QuotaNode, depth: number = 0): FlatRow[] {
  const rows: FlatRow[] = [{ node, depth }];
  for (const child of node.children) {
    rows.push(...flatten(child, depth + 1));
  }
  return rows;
}

const TYPE_COLORS: Record<string, string> = {
  cohort: 'var(--color-primary)',
  clusterQueue: 'var(--color-compute)',
  localQueue: 'var(--color-memory)',
};

const TYPE_LABELS: Record<string, string> = {
  cohort: 'Cohort',
  clusterQueue: 'ClusterQueue',
  localQueue: 'LocalQueue',
};

function getResourceValues(node: QuotaNode, view: QuotaResourceView) {
  switch (view) {
    case 'cpu':
      return {
        used: node.usedCpu ?? 0,
        nominal: node.nominalCpu ?? 0,
        color: 'var(--color-compute)',
        formatNominal: (v: number) => formatCpu(v),
        formatUsed: (v: number) => formatCpu(v),
        unit: 'cores',
      };
    case 'memory':
      return {
        used: node.usedMemory ?? 0,
        nominal: node.nominalMemory ?? 0,
        color: 'var(--color-memory)',
        formatNominal: (v: number) => formatMemoryGi(v),
        formatUsed: (v: number) => formatMemoryGi(v),
        unit: 'GiB',
      };
    default:
      return {
        used: node.usedGpus,
        nominal: node.nominalGpus,
        color: TYPE_COLORS[node.type],
        formatNominal: (v: number) => String(v),
        formatUsed: (v: number) => String(v),
        unit: 'GPUs',
      };
  }
}

interface QuotaTableProps {
  root: QuotaNode;
  selectedId: string | null;
  onSelect: (id: string) => void;
  resourceView: QuotaResourceView;
}

export function QuotaTable({ root, selectedId, onSelect, resourceView }: QuotaTableProps) {
  const rows = flatten(root);
  const resourceLabel = resourceView === 'gpu' ? 'GPU' : resourceView === 'cpu' ? 'CPU' : 'Memory';
  const columns = ['Name', 'Type', `Nominal ${resourceLabel}`, `Used ${resourceLabel}`, 'Borrow Limit', 'Priority', 'Usage'];

  return (
    <table className="w-full">
      <thead>
        <tr className="border-b border-border">
          {columns.map((col) => (
            <th key={col} className="pb-2 text-left text-[11px] font-medium text-text-muted uppercase tracking-wide pr-4">
              {col}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map(({ node, depth }) => {
          const resource = getResourceValues(node, resourceView);
          const pct = resource.nominal > 0 ? Math.round((resource.used / resource.nominal) * 100) : 0;
          const color = resource.color;
          const selected = selectedId === node.id;
          return (
            <tr
              key={node.id}
              onClick={() => onSelect(node.id)}
              className={`border-b border-border/30 cursor-pointer transition-colors ${
                selected ? 'bg-primary/10' : 'hover:bg-surface-2/40'
              }`}
            >
              <td className="py-2.5 pr-4 text-[13px] font-medium text-text-primary" style={{ paddingLeft: `${depth * 20 + 8}px` }}>
                {node.name}
              </td>
              <td className="py-2.5 pr-4">
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                  style={{ backgroundColor: `color-mix(in srgb, ${TYPE_COLORS[node.type]} 15%, transparent)`, color: TYPE_COLORS[node.type] }}
                >
                  {TYPE_LABELS[node.type]}
                </span>
              </td>
              <td className="py-2.5 pr-4 text-[13px] text-text-secondary">
                {resource.formatNominal(resource.nominal)} {resourceView !== 'gpu' ? resource.unit : ''}
              </td>
              <td className="py-2.5 pr-4 text-[13px] text-text-secondary">
                {resource.formatUsed(resource.used)} {resourceView !== 'gpu' ? resource.unit : ''}
              </td>
              <td className="py-2.5 pr-4 text-[13px] text-text-secondary">
                {resourceView === 'gpu' && node.borrowingLimit > 0 ? `+${node.borrowingLimit}` : '—'}
              </td>
              <td className="py-2.5 pr-4 text-[13px] text-text-secondary">{node.priority}</td>
              <td className="py-2.5 pr-4 w-28">
                <div className="flex items-center gap-2">
                  <ProgressBar value={pct} color={pct > 85 ? 'var(--color-warning)' : color} />
                  <span className="text-[11px] text-text-muted w-8 text-right">{pct}%</span>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
