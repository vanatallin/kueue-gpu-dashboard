import { Play, Pause, SkipForward, SkipBack, RotateCcw } from 'lucide-react';
import { useDemo } from '../../context/DemoContext';
import { STEP_LABELS } from '../../data/mock';

export function DemoControlBar() {
  const { step, isPlaying, nextStep, prevStep, reset, togglePlay } = useDemo();

  return (
    <div className="fixed bottom-0 left-60 right-0 h-14 bg-surface border-t border-border flex items-center justify-between px-6 z-50">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          {([1, 2, 3, 4] as const).map((s) => (
            <div
              key={s}
              className={`w-2 h-2 rounded-full transition-colors ${
                s === step ? 'bg-primary' : s < step ? 'bg-primary/40' : 'bg-border'
              }`}
            />
          ))}
        </div>
        <span className="text-[13px] font-medium text-text-primary">
          Step {step} of 4:
        </span>
        <span className="text-[13px] text-text-secondary">
          {STEP_LABELS[step]}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={reset}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-2 text-text-muted hover:text-text-primary transition-colors"
        >
          <RotateCcw size={16} />
        </button>
        <button
          onClick={prevStep}
          disabled={step === 1}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-2 text-text-muted hover:text-text-primary transition-colors disabled:opacity-30"
        >
          <SkipBack size={16} />
        </button>
        <button
          onClick={togglePlay}
          className="w-9 h-9 flex items-center justify-center rounded-[8px] bg-primary text-white hover:bg-primary/90 transition-colors"
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} />}
        </button>
        <button
          onClick={nextStep}
          disabled={step === 4}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-2 text-text-muted hover:text-text-primary transition-colors disabled:opacity-30"
        >
          <SkipForward size={16} />
        </button>
      </div>
    </div>
  );
}
