import type { QuotaNode } from '../../types/kueue';
import { QuotaTreeNode, type QuotaResourceView } from './QuotaTreeNode';

interface QuotaTreeProps {
  root: QuotaNode;
  selectedId: string | null;
  onSelect: (id: string) => void;
  resourceView: QuotaResourceView;
}

export function QuotaTree({ root, selectedId, onSelect, resourceView }: QuotaTreeProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <QuotaTreeNode node={root} depth={0} selectedId={selectedId} onSelect={onSelect} resourceView={resourceView} />
    </div>
  );
}
