interface StepAllocationProps {
  selected: number;
  onChange: (count: number) => void;
  maxGpus?: number;
}

export function StepAllocation({ selected, onChange, maxGpus = 8 }: StepAllocationProps) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-[13px] text-text-secondary">
        Select the number of GPUs for this pool ({selected} selected).
      </p>
      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: maxGpus }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            onClick={() => onChange(n)}
            className={`w-10 h-10 rounded-lg flex items-center justify-center text-[13px] font-medium transition-colors ${
              n <= selected
                ? 'bg-primary text-white'
                : 'bg-surface-2 text-text-muted border border-border hover:border-primary/50'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}
