import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface Settings {
  autoRefreshEnabled: boolean;
  autoRefreshInterval: number; // in seconds
  demoSliderEnabled: boolean;
  copilotEnabled: boolean;
}

interface SettingsContextValue {
  settings: Settings;
  updateSettings: (updates: Partial<Settings>) => void;
}

const DEFAULT_SETTINGS: Settings = {
  autoRefreshEnabled: true,
  autoRefreshInterval: 10,
  demoSliderEnabled: false,
  copilotEnabled: true,
};

const STORAGE_KEY = 'kueue-dashboard-settings';

const SettingsCtx = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch {
      // Ignore parse errors
    }
    return DEFAULT_SETTINGS;
  });

  // Persist settings to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // Ignore storage errors
    }
  }, [settings]);

  const updateSettings = (updates: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  };

  return (
    <SettingsCtx.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsCtx.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsCtx);
  if (!ctx) throw new Error('useSettings must be used inside SettingsProvider');
  return ctx;
}
