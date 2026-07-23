'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';

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

  return <Ctx.Provider value={{ register, unregister, report, results }}>{children}</Ctx.Provider>;
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
  useEffect(() => {
    if (!ctx || !blockId) return;
    ctx.register(blockId);
    return () => ctx.unregister(blockId);
  }, [ctx, blockId]);
  return useCallback(
    (correct: boolean) => {
      if (ctx && blockId) ctx.report(blockId, correct);
    },
    [ctx, blockId]
  );
}

export function scoreOf(results: Record<string, Result>) {
  const values = Object.values(results);
  const total = values.length;
  const answered = values.filter((v) => v !== null).length;
  const correct = values.filter((v) => v === true).length;
  return { total, answered, correct, percent: total ? Math.round((correct / total) * 100) : 0 };
}
