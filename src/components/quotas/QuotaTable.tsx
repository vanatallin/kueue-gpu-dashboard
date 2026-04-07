import type { QuotaNode } from '../../types/kueue';
import { ProgressBar } from '../ui/ProgressBar';

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

const COLUMNS = ['Name', 'Type', 'Nominal', 'Used', 'Borrow Limit', 'Priority', 'Usage'];

interface QuotaTableProps {
  root: QuotaNode;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function QuotaTable({ root, selectedId, onSelect }: QuotaTableProps) {
  const rows = flatten(root);

  return (
    <table className="w-full">
      <thead>
        <tr className="border-b border-border">
          {COLUMNS.map((col) => (
            <th key={col} className="pb-2 text-left text-[11px] font-medium text-text-muted uppercase tracking-wide pr-4">
              {col}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map(({ node, depth }) => {
          const pct = node.nominalGpus > 0 ? Math.round((node.usedGpus / node.nominalGpus) * 100) : 0;
          const color = TYPE_COLORS[node.type];
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
                  style={{ backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)`, color }}
                >
                  {TYPE_LABELS[node.type]}
                </span>
              </td>
              <td className="py-2.5 pr-4 text-[13px] text-text-secondary">{node.nominalGpus}</td>
              <td className="py-2.5 pr-4 text-[13px] text-text-secondary">{node.usedGpus}</td>
              <td className="py-2.5 pr-4 text-[13px] text-text-secondary">
                {node.borrowingLimit > 0 ? `+${node.borrowingLimit}` : '—'}
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
