interface DonutChartProps {
  allocated: number;
  unallocated: number;
  utilization: number;
  healthy: number;
  warning: number;
}

export function DonutChart({ allocated, unallocated, utilization, healthy, warning }: DonutChartProps) {
  const size = 100;
  const strokeWidth = 10;
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const filled = (utilization / 100) * circumference;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <div>
            <span className="text-[28px] font-bold text-text-primary leading-none">{allocated}</span>
            <p className="text-[11px] text-text-muted mt-0.5">Allocated</p>
          </div>
          <div>
            <span className="text-[28px] font-bold text-text-primary leading-none">{unallocated}</span>
            <p className="text-[11px] text-text-muted mt-0.5">Unallocated</p>
          </div>
        </div>

        <div className="relative shrink-0">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke="var(--color-border)"
              strokeWidth={strokeWidth}
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke="var(--color-primary)"
              strokeWidth={strokeWidth}
              strokeDasharray={`${filled} ${circumference - filled}`}
              strokeLinecap="round"
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[18px] font-bold text-primary leading-none">{utilization}%</span>
            <span className="text-[9px] text-primary mt-0.5">Utilization</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 mt-4 text-[11px]">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-status-running inline-block" />
          <span className="text-text-muted">{healthy} Healthy</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-warning inline-block" />
          <span className="text-text-muted">{warning} Warning</span>
        </span>
      </div>
    </div>
  );
}
