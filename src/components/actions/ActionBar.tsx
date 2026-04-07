import { Button } from '../ui/Button';

interface ActionBarProps {
  onCreatePool: () => void;
}

export function ActionBar({ onCreatePool }: ActionBarProps) {
  return (
    <div className="flex items-center gap-3 h-14">
      <Button variant="primary">Rebalance Pools</Button>
      <Button variant="secondary" onClick={onCreatePool}>Create Pool</Button>
      <Button variant="ghost">Schedule Workload</Button>
    </div>
  );
}
