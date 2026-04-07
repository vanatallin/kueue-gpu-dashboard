import { LayoutDashboard, GitBranch, ListTodo, BarChart3, Settings, Server } from 'lucide-react';

interface SidebarProps {
  activePage: string;
  onNavigate: (page: string) => void;
}

const NAV_ITEMS = [
  { id: 'cluster', label: 'Cluster Control', icon: LayoutDashboard },
  { id: 'pools', label: 'Resource Monitor', icon: Server },
  { id: 'workloads', label: 'Workloads', icon: ListTodo },
  { id: 'quotas', label: 'Quotas', icon: GitBranch },
  { id: 'metrics', label: 'Metrics', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function Sidebar({ activePage, onNavigate }: SidebarProps) {
  return (
    <aside className="w-60 shrink-0 h-screen bg-surface border-r border-border p-4 flex flex-col gap-2">
      <div className="text-lg font-semibold text-text-primary mb-4 px-3">
        Kueue
      </div>
      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const active = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex items-center gap-3 h-10 px-3 rounded-lg text-[13px] font-medium transition-colors duration-120 ${
                active
                  ? 'bg-surface-2 text-text-primary border-l-3 border-primary'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-2/50'
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
