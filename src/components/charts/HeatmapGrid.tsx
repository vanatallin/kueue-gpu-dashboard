interface HeatmapGridProps {
  values: number[];
}

function getHeatColor(value: number): string {
  if (value < 20) return 'rgba(124, 92, 255, 0.1)';
  if (value < 40) return 'rgba(124, 92, 255, 0.25)';
  if (value < 60) return 'rgba(124, 92, 255, 0.45)';
  if (value < 80) return 'rgba(124, 92, 255, 0.7)';
  return 'rgba(124, 92, 255, 1.0)';
}

export function HeatmapGrid({ values }: HeatmapGridProps) {
  return (
    <div>
      <div className="grid grid-cols-6 gap-[3px]">
        {values.map((v, i) => (
          <div
            key={i}
            className="w-7 h-7 rounded-[3px]"
            style={{ backgroundColor: getHeatColor(v) }}
            title={`GPU-${i}: ${v}% memory`}
          />
        ))}
      </div>
      <div className="flex items-center justify-between mt-3 text-[10px] text-text-muted">
        <span>Not Utilized</span>
        <div
          className="flex-1 mx-3 h-2 rounded-full"
          style={{
            background: 'linear-gradient(to right, rgba(124,92,255,0.1), rgba(124,92,255,1))',
          }}
        />
        <span>Fully Utilized</span>
      </div>
    </div>
  );
}
