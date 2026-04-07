import { useState, useCallback, useRef, useEffect } from 'react';
import type { DemoState, DemoStep } from '../types/kueue';
import { DEMO_STATES } from '../data/mock';

export function useDemoSimulation() {
  const [step, setStep] = useState<DemoStep>(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const state: DemoState = DEMO_STATES[step];

  const nextStep = useCallback(() => {
    setStep((s) => (s < 4 ? ((s + 1) as DemoStep) : s));
  }, []);

  const prevStep = useCallback(() => {
    setStep((s) => (s > 1 ? ((s - 1) as DemoStep) : s));
  }, []);

  const reset = useCallback(() => {
    setStep(1);
    setIsPlaying(false);
  }, []);

  const togglePlay = useCallback(() => {
    setIsPlaying((p) => !p);
  }, []);

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setStep((s) => {
          if (s >= 4) {
            setIsPlaying(false);
            return s;
          }
          return (s + 1) as DemoStep;
        });
      }, 3000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying]);

  return { state, step, isPlaying, nextStep, prevStep, reset, togglePlay };
}
