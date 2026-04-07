interface SliderProps {
  value: number;
  onChange: (v: number) => void;
  leftLabel?: string;
  rightLabel?: string;
}

export function Slider({ value, onChange, leftLabel = 'Compute', rightLabel = 'Memory' }: SliderProps) {
  return (
    <div className="flex flex-col gap-2 w-full max-w-md">
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1 appearance-none bg-border rounded-full accent-primary cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer"
      />
      <div className="flex justify-between text-[11px] text-text-muted">
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
    </div>
  );
}
