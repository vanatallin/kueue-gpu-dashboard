interface PoolData {
  name: string;
  utilized: number;
}

interface HorizontalBarChartProps {
  data: PoolData[];
}

export function HorizontalBarChart({ data }: HorizontalBarChartProps) {
  return (
    <div className="w-full flex flex-col gap-3">
      {data.map((pool) => (
        <div key={pool.name} className="flex items-center gap-3">
          <span className="w-10 text-[12px] text-text-secondary shrink-0 text-right">
            {pool.name}
          </span>
          <div className="flex-1 h-6 bg-surface-2 rounded-[3px] overflow-hidden">
            <div
              className="h-full bg-compute rounded-[3px]"
              style={{ width: `${pool.utilized}%` }}
            />
          </div>
        </div>
      ))}
      <div className="flex items-center gap-4 mt-1 text-[10px] text-text-muted">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-[2px] bg-compute inline-block" />
          Utilized %
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-[2px] bg-surface-2 inline-block" />
          Idle %
        </span>
      </div>
    </div>
  );
}
