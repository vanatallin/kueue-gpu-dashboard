interface GpuTypeData {
  type: string;
  vendor: 'nvidia' | 'amd';
  utilized: number;
}

interface GpuVendorChartProps {
  data: GpuTypeData[];
}

export function GpuVendorChart({ data }: GpuVendorChartProps) {
  return (
    <div className="w-full flex flex-col gap-3">
      {data.map((gpu) => (
        <div key={gpu.type} className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{
              backgroundColor: gpu.vendor === 'nvidia' ? 'var(--color-status-running)' : '#555',
            }}
          />
          <span className="w-[52px] text-[12px] text-text-secondary shrink-0">{gpu.type}</span>
          <div className="flex-1 h-6 bg-surface-2 rounded-[3px] overflow-hidden relative">
            <div
              className="h-full bg-primary rounded-[3px]"
              style={{ width: `${gpu.utilized}%` }}
            />
            {100 - gpu.utilized > 5 && (
              <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-text-muted font-medium">
                {100 - gpu.utilized}%
              </span>
            )}
          </div>
          <span className="w-10 text-[13px] text-text-primary font-semibold text-right shrink-0">
            {gpu.utilized}%
          </span>
        </div>
      ))}
      <div className="flex items-center gap-4 mt-1 text-[10px] text-text-muted">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-[2px] bg-primary inline-block" />
          Utilized GPU %
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-[2px] bg-surface-2 inline-block" />
          Idle GPU %
        </span>
      </div>
    </div>
  );
}
