import { LogIn, LogOut, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function LoginButton() {
  const { isAuthenticated, isLoading, user, login, logout } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 text-[13px] text-text-muted">
        <Loader2 size={14} className="animate-spin" />
        <span>Loading...</span>
      </div>
    );
  }

  if (isAuthenticated && user) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-[13px] text-text-secondary">{user.name}</span>
        <button
          onClick={logout}
          className="flex items-center gap-2 px-3 py-1.5 text-[13px] text-text-secondary hover:text-text-primary hover:bg-surface-2 rounded-lg transition-colors"
        >
          <LogOut size={14} />
          <span>Logout</span>
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={login}
      className="flex items-center gap-2 px-4 py-2 text-[13px] font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors"
    >
      <LogIn size={14} />
      <span>Login with OpenShift</span>
    </button>
  );
}
