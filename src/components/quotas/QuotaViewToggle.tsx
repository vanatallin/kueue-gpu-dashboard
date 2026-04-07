import { TreePine, Table2 } from 'lucide-react';

type ViewMode = 'tree' | 'table';

interface QuotaViewToggleProps {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

export function QuotaViewToggle({ mode, onChange }: QuotaViewToggleProps) {
  return (
    <div className="flex items-center bg-surface-2 rounded-[8px] p-0.5 border border-border">
      {([
        { id: 'tree' as const, icon: TreePine, label: 'Tree' },
        { id: 'table' as const, icon: Table2, label: 'Table' },
      ]).map((opt) => (
        <button
          key={opt.id}
          onClick={() => onChange(opt.id)}
          className={`flex items-center gap-1.5 h-7 px-3 rounded-[6px] text-[12px] font-medium transition-colors ${
            mode === opt.id
              ? 'bg-primary text-white'
              : 'text-text-muted hover:text-text-primary'
          }`}
        >
          <opt.icon size={14} />
          {opt.label}
        </button>
      ))}
    </div>
  );
}
