import { Search, MessageSquare, X, RefreshCw } from 'lucide-react';
import { LoginButton } from '../auth/LoginButton';
import { useSearch } from '../../context/SearchContext';
import { useRefresh } from '../../context/RefreshContext';
import { useSettings } from '../../context/SettingsContext';
import { useAuth } from '../../context/AuthContext';

interface TopBarProps {
  title: string;
  onToggleCopilot: () => void;
}

function formatLastUpdated(date: Date | null): string {
  if (!date) return '';
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 5) return 'just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  return date.toLocaleTimeString();
}

export function TopBar({ title, onToggleCopilot }: TopBarProps) {
  const { query, setQuery, clearQuery } = useSearch();
  const { triggerRefresh, lastUpdated, isRefreshing } = useRefresh();
  const { settings } = useSettings();
  const { isAuthenticated } = useAuth();

  return (
    <header className="h-16 shrink-0 flex items-center justify-between px-6 border-b border-border bg-surface">
      <h1 className="text-2xl font-semibold leading-8 text-text-primary">
        {title}
      </h1>
      <div className="flex items-center gap-4">
        {/* Refresh Section */}
        {isAuthenticated && (
          <div className="flex items-center gap-2">
            {lastUpdated && (
              <span className="text-[11px] text-text-muted">
                {formatLastUpdated(lastUpdated)}
                {settings.autoRefreshEnabled && (
                  <span className="ml-1 text-text-muted/60">
                    (auto {settings.autoRefreshInterval}s)
                  </span>
                )}
              </span>
            )}
            <button
              onClick={triggerRefresh}
              disabled={isRefreshing}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-2 text-text-secondary hover:text-primary transition-colors disabled:opacity-50"
              title="Refresh data"
            >
              <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
            </button>
          </div>
        )}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder={`Search ${title.toLowerCase()}...`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-60 h-9 pl-9 pr-8 bg-surface-2 border border-border rounded-[6px] text-[13px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors"
          />
          {query && (
            <button
              onClick={clearQuery}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>
        {settings.copilotEnabled && (
          <button
            onClick={onToggleCopilot}
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-surface-2 text-text-secondary hover:text-primary transition-colors"
            title="Toggle Copilot"
          >
            <MessageSquare size={18} />
          </button>
        )}
        <LoginButton />
      </div>
    </header>
  );
}
