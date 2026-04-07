interface StepperProps {
  steps: string[];
  activeStep: number;
}

export function Stepper({ steps, activeStep }: StepperProps) {
  return (
    <div className="flex items-center gap-2 h-16">
      {steps.map((label, i) => {
        const active = i === activeStep;
        const completed = i < activeStep;
        return (
          <div key={label} className="flex items-center gap-2">
            {i > 0 && <div className={`w-8 h-px ${completed ? 'bg-primary' : 'bg-border'}`} />}
            <div className="flex items-center gap-2">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold ${
                  active
                    ? 'bg-primary text-white'
                    : completed
                    ? 'bg-primary/20 text-primary'
                    : 'bg-surface-2 text-text-muted'
                }`}
              >
                {i + 1}
              </div>
              <span className={`text-[13px] ${active ? 'font-semibold text-text-primary' : 'text-text-muted'}`}>
                {label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
