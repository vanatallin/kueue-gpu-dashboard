import { createContext, useContext, type ReactNode } from 'react';
import type { DemoState, DemoStep } from '../types/kueue';
import { useDemoSimulation } from '../hooks/useDemoSimulation';

interface DemoContextValue {
  state: DemoState;
  step: DemoStep;
  isPlaying: boolean;
  nextStep: () => void;
  prevStep: () => void;
  reset: () => void;
  togglePlay: () => void;
}

const DemoCtx = createContext<DemoContextValue | null>(null);

export function DemoProvider({ children }: { children: ReactNode }) {
  const sim = useDemoSimulation();
  return <DemoCtx.Provider value={sim}>{children}</DemoCtx.Provider>;
}

export function useDemo(): DemoContextValue {
  const ctx = useContext(DemoCtx);
  if (!ctx) throw new Error('useDemo must be used inside DemoProvider');
  return ctx;
}
