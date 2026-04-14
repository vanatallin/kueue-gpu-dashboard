import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface RefreshContextValue {
  refreshTrigger: number;
  triggerRefresh: () => void;
  lastUpdated: Date | null;
  setLastUpdated: (date: Date) => void;
  isRefreshing: boolean;
  setIsRefreshing: (value: boolean) => void;
}

const RefreshCtx = createContext<RefreshContextValue | null>(null);

export function RefreshProvider({ children }: { children: ReactNode }) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const triggerRefresh = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  return (
    <RefreshCtx.Provider
      value={{
        refreshTrigger,
        triggerRefresh,
        lastUpdated,
        setLastUpdated,
        isRefreshing,
        setIsRefreshing,
      }}
    >
      {children}
    </RefreshCtx.Provider>
  );
}

export function useRefresh(): RefreshContextValue {
  const ctx = useContext(RefreshCtx);
  if (!ctx) throw new Error('useRefresh must be used inside RefreshProvider');
  return ctx;
}
