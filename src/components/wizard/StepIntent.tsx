import { Brain, GraduationCap, Bot } from 'lucide-react';

const INTENTS = [
  { id: 'inference', label: 'LLM Inference', icon: Brain },
  { id: 'training', label: 'Training', icon: GraduationCap },
  { id: 'agent', label: 'Agent Workflow', icon: Bot },
];

interface StepIntentProps {
  selected: string | null;
  onSelect: (id: string) => void;
}

export function StepIntent({ selected, onSelect }: StepIntentProps) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-[13px] text-text-secondary">What will this pool be used for?</p>
      <div className="flex gap-4">
        {INTENTS.map((intent) => (
          <button
            key={intent.id}
            onClick={() => onSelect(intent.id)}
            className={`w-40 h-[100px] rounded-[10px] border flex flex-col items-center justify-center gap-2 transition-colors ${
              selected === intent.id
                ? 'border-primary bg-primary/10'
                : 'border-border bg-surface-2 hover:border-primary/50'
            }`}
          >
            <intent.icon size={24} className={selected === intent.id ? 'text-primary' : 'text-text-muted'} />
            <span className="text-[13px] font-medium text-text-primary">{intent.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
