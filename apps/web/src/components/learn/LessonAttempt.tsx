'use client';

import { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';

/** null = the activity is present but not yet answered. */
type Result = boolean | null;

interface AttemptCtx {
  register: (id: string) => void;
  unregister: (id: string) => void;
  report: (id: string, correct: boolean) => void;
  results: Record<string, Result>;
}

const Ctx = createContext<AttemptCtx | null>(null);

export function LessonAttemptProvider({ children }: { children: React.ReactNode }) {
  const [results, setResults] = useState<Record<string, Result>>({});

  const register = useCallback((id: string) => {
    setResults((r) => (id in r ? r : { ...r, [id]: null }));
  }, []);
  const unregister = useCallback((id: string) => {
    setResults((r) => {
      if (!(id in r)) return r;
      const next = { ...r };
      delete next[id];
      return next;
    });
  }, []);
  const report = useCallback((id: string, correct: boolean) => {
    setResults((r) => ({ ...r, [id]: correct }));
  }, []);

  // Memoize so the context value only changes when `results` changes
  // (register/unregister/report are stable). Prevents effect churn in consumers.
  const value = useMemo(
    () => ({ register, unregister, report, results }),
    [register, unregister, report, results]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAttempt() {
  return useContext(Ctx);
}

/**
 * Hook for gradable blocks: registers the activity on mount and returns a
 * `report(correct)` function to call when the student checks their answer.
 * Safe no-op when rendered outside a provider (e.g. the admin editor preview).
 */
export function useGradedActivity(blockId?: string) {
  const ctx = useContext(Ctx);
  // Extract the STABLE function refs so the effect doesn't re-run every render
  // (the ctx object identity changes whenever results change).
  const register = ctx?.register;
  const unregister = ctx?.unregister;
  const report = ctx?.report;

  useEffect(() => {
    if (!register || !unregister || !blockId) return;
    register(blockId);
    return () => unregister(blockId);
  }, [register, unregister, blockId]);

  return useCallback(
    (correct: boolean) => {
      if (report && blockId) report(blockId, correct);
    },
    [report, blockId]
  );
}

export function scoreOf(results: Record<string, Result>) {
  const values = Object.values(results);
  const total = values.length;
  const answered = values.filter((v) => v !== null).length;
  const correct = values.filter((v) => v === true).length;
  return { total, answered, correct, percent: total ? Math.round((correct / total) * 100) : 0 };
}
