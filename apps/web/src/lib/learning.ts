import type { SupabaseClient } from '@supabase/supabase-js';

export interface LevelProgress {
  total: number;
  completed: number;
  percent: number;
}

/**
 * Computes, per level, how many published lessons the user has completed.
 * Reads all published lessons (small dataset) + the user's completed rows.
 */
export async function getLevelProgressMap(
  supabase: SupabaseClient,
  userId: string | null
): Promise<Map<string, LevelProgress>> {
  const { data: lessons } = await supabase.from('lessons').select('id, level_id').eq('published', true);

  const totals = new Map<string, number>();
  const lessonToLevel = new Map<string, string>();
  (lessons ?? []).forEach((l: { id: string; level_id: string }) => {
    totals.set(l.level_id, (totals.get(l.level_id) ?? 0) + 1);
    lessonToLevel.set(l.id, l.level_id);
  });

  const map = new Map<string, LevelProgress>();
  totals.forEach((total, levelId) => map.set(levelId, { total, completed: 0, percent: 0 }));

  if (userId) {
    const { data: prog } = await supabase
      .from('user_progress')
      .select('lesson_id')
      .eq('user_id', userId)
      .eq('status', 'completed');
    (prog ?? []).forEach((p: { lesson_id: string }) => {
      const levelId = lessonToLevel.get(p.lesson_id);
      if (levelId && map.has(levelId)) map.get(levelId)!.completed++;
    });
  }

  map.forEach((v) => {
    v.percent = v.total ? Math.round((v.completed / v.total) * 100) : 0;
  });
  return map;
}

/** Returns the set of completed lesson ids for a user among the given lessons. */
export async function getCompletedLessonIds(
  supabase: SupabaseClient,
  userId: string | null,
  lessonIds: string[]
): Promise<Set<string>> {
  if (!userId || lessonIds.length === 0) return new Set();
  const { data } = await supabase
    .from('user_progress')
    .select('lesson_id')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .in('lesson_id', lessonIds);
  return new Set((data ?? []).map((r: { lesson_id: string }) => r.lesson_id));
}

/** CEFR display label for a level code. */
export function cefrLabel(code: string): string {
  const map: Record<string, string> = {
    A1: 'Principiante',
    A2: 'Elemental',
    B1: 'Intermedio',
    B2: 'Intermedio alto',
    C1: 'Avanzado',
    C2: 'Maestría',
  };
  return map[code?.toUpperCase()] ?? 'Nivel';
}
