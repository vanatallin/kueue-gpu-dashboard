import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { api, type AuthStatus } from '../services/api';

interface AuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthStatus['user'] | null;
  error: string | null;
  login: () => void;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

const AuthCtx = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<AuthStatus['user'] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkAuth = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const status = await api.checkAuth();
      setIsAuthenticated(status.authenticated);
      setUser(status.user || null);
    } catch (err) {
      setIsAuthenticated(false);
      setUser(null);
      // Don't set error for initial auth check failure
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Check for error in URL params (from OAuth callback)
    const params = new URLSearchParams(window.location.search);
    const urlError = params.get('error');
    if (urlError) {
      setError(urlError);
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }

    checkAuth();
  }, []);

  const login = () => {
    window.location.href = api.getLoginUrl();
  };

  const logout = () => {
    window.location.href = api.getLogoutUrl();
  };

  return (
    <AuthCtx.Provider
      value={{
        isAuthenticated,
        isLoading,
        user,
        error,
        login,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
