import type { QuotaNode } from '../../types/kueue';
import { QuotaTreeNode } from './QuotaTreeNode';

interface QuotaTreeProps {
  root: QuotaNode;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function QuotaTree({ root, selectedId, onSelect }: QuotaTreeProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <QuotaTreeNode node={root} depth={0} selectedId={selectedId} onSelect={onSelect} />
    </div>
  );
}
