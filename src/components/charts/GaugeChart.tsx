interface GaugeChartProps {
  value: number;
}

export function GaugeChart({ value }: GaugeChartProps) {
  const clampedValue = Math.max(0, Math.min(100, value));
  const sweepAngle = 180;
  const needleAngle = -180 + (clampedValue / 100) * sweepAngle;

  const cx = 80;
  const cy = 75;
  const r = 58;
  const strokeWidth = 10;

  function polarToCartesian(angle: number) {
    const rad = (angle * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  function describeArc(start: number, end: number) {
    const s = polarToCartesian(start);
    const e = polarToCartesian(end);
    const largeArc = end - start > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${largeArc} 1 ${e.x} ${e.y}`;
  }

  const segments = [
    { start: -180, end: -108, color: 'var(--color-critical)' },
    { start: -108, end: -54, color: 'var(--color-warning)' },
    { start: -54, end: 0, color: 'var(--color-primary)' },
  ];

  const needleLen = r - 6;
  const needleRad = (needleAngle * Math.PI) / 180;
  const nx = cx + needleLen * Math.cos(needleRad);
  const ny = cy + needleLen * Math.sin(needleRad);

  return (
    <div className="w-full">
      <div className="flex items-start gap-3">
        <div className="relative shrink-0">
          <svg width="160" height="90" viewBox="0 0 160 90">
            {segments.map((seg, i) => (
              <path
                key={i}
                d={describeArc(seg.start, seg.end)}
                fill="none"
                stroke={seg.color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
              />
            ))}
            <line
              x1={cx}
              y1={cy}
              x2={nx}
              y2={ny}
              stroke="var(--color-text-primary)"
              strokeWidth={2}
              strokeLinecap="round"
            />
            <circle cx={cx} cy={cy} r={3.5} fill="var(--color-text-primary)" />
          </svg>
          <div className="absolute bottom-0 left-[80px] -translate-x-1/2 text-center">
            <span className="text-[28px] font-bold text-text-primary leading-none">{clampedValue}</span>
          </div>
        </div>

        <div className="flex flex-col gap-1.5 pt-2 text-[11px] shrink-0">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-critical inline-block shrink-0" />
            <span className="text-text-muted whitespace-nowrap">Under Performing</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-warning inline-block shrink-0" />
            <span className="text-text-muted">Moderate</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-primary inline-block shrink-0" />
            <span className="text-text-muted">Optimal</span>
          </span>
        </div>
      </div>
    </div>
  );
}
