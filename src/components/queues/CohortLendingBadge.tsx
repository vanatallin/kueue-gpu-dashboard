import { ArrowRightLeft } from 'lucide-react';

interface CohortLendingBadgeProps {
  gpuCount: number;
  compact?: boolean;
}

export function CohortLendingBadge({ gpuCount, compact = false }: CohortLendingBadgeProps) {
  if (gpuCount <= 0) return null;

  const label = `${gpuCount} GPU${gpuCount !== 1 ? 's' : ''} lent within cohort`;

  if (compact) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] text-compute font-medium">
        <ArrowRightLeft size={10} />
        {label}
      </span>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-compute/10 rounded-lg border border-compute/20">
      <ArrowRightLeft size={14} className="text-compute shrink-0" />
      <span className="text-[12px] text-compute">{label}</span>
    </div>
  );
}
