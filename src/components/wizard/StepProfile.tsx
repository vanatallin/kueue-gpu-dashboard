import { Slider } from '../ui/Slider';

interface StepProfileProps {
  value: number;
  onChange: (v: number) => void;
}

export function StepProfile({ value, onChange }: StepProfileProps) {
  return (
    <div className="flex flex-col gap-6">
      <p className="text-[13px] text-text-secondary">
        Adjust the compute vs memory balance for this pool.
      </p>
      <div className="flex flex-col items-center gap-4">
        <Slider value={value} onChange={onChange} />
        <div className="flex gap-6 text-[13px]">
          <span className="text-compute">Compute: {100 - value}%</span>
          <span className="text-memory">Memory: {value}%</span>
        </div>
      </div>
    </div>
  );
}
