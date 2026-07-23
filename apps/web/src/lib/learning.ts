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

/**
 * Sequential gating: a lesson is unlocked when every earlier lesson in the
 * level is completed. In practice that means "everything completed, plus the
 * first pending one". `lessons` must already be ordered by `order`.
 * Mirrors the server-side rule enforced by the record_progress() RPC.
 */
export function computeUnlocked<T extends { id: string }>(
  lessons: T[],
  completed: Set<string>
): Set<string> {
  const unlocked = new Set<string>();
  for (const lesson of lessons) {
    unlocked.add(lesson.id);
    if (!completed.has(lesson.id)) break;
  }
  return unlocked;
}

/**
 * Current streak from a list of activity dates ('YYYY-MM-DD').
 * Counts consecutive days ending today (or yesterday, so the streak
 * survives until the day is over).
 */
export function computeStreak(dates: string[]): number {
  const days = new Set(dates.map((d) => d.slice(0, 10)));
  if (days.size === 0) return 0;

  const dayMs = 86400000;
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const todayStr = today.toISOString().slice(0, 10);
  const yesterdayStr = new Date(today.getTime() - dayMs).toISOString().slice(0, 10);
  if (!days.has(todayStr) && !days.has(yesterdayStr)) return 0;

  let streak = 0;
  const cursor = new Date(today);
  if (!days.has(todayStr)) cursor.setTime(cursor.getTime() - dayMs);
  while (days.has(cursor.toISOString().slice(0, 10))) {
    streak++;
    cursor.setTime(cursor.getTime() - dayMs);
  }
  return streak;
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
