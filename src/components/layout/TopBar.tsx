import { Search, MessageSquare, User } from 'lucide-react';

interface TopBarProps {
  title: string;
  onToggleCopilot: () => void;
}

export function TopBar({ title, onToggleCopilot }: TopBarProps) {
  return (
    <header className="h-16 shrink-0 flex items-center justify-between px-6 border-b border-border bg-surface">
      <h1 className="text-2xl font-semibold leading-8 text-text-primary">
        {title}
      </h1>
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search..."
            className="w-60 h-9 pl-9 pr-3 bg-surface-2 border border-border rounded-[6px] text-[13px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors"
          />
        </div>
        <button
          onClick={onToggleCopilot}
          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-surface-2 text-text-secondary hover:text-primary transition-colors"
        >
          <MessageSquare size={18} />
        </button>
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
          <User size={16} className="text-primary" />
        </div>
      </div>
    </header>
  );
}
