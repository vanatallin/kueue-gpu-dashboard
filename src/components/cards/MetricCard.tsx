import { ProgressBar } from '../ui/ProgressBar';

interface MetricCardProps {
  label: string;
  value: string | number;
  sub?: string;
  barValue: number;
  barMax?: number;
  barColor: string;
}

export function MetricCard({ label, value, sub, barValue, barMax = 100, barColor }: MetricCardProps) {
  return (
    <div className="bg-surface rounded-[12px] border border-border p-4 flex flex-col justify-between h-[120px] shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
      <div>
        <p className="text-[11px] text-text-muted leading-4 uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-text-primary leading-8 mt-1">{value}</p>
        {sub && <p className="text-[11px] text-text-secondary leading-4 mt-0.5">{sub}</p>}
      </div>
      <ProgressBar value={barValue} max={barMax} color={barColor} />
    </div>
  );
}
