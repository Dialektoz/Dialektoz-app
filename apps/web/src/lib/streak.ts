import type { SupabaseClient } from '@supabase/supabase-js';
import { computeStreak } from './learning';

export interface HeatCell {
  /** 'YYYY-MM-DD', or null for padding cells before the range starts. */
  date: string | null;
  xp: number;
  lessons: number;
}

export interface StreakData {
  current: number;
  longest: number;
  activeDays: number;
  weekXp: number;
  weekDays: number;
  totalXp: number;
  /** Column-major weeks (each of 7 cells, Monday first) for the heatmap. */
  cells: HeatCell[];
  bestDayXp: number;
}

const DAY_MS = 86400000;
const iso = (d: Date) => d.toISOString().slice(0, 10);

/** Longest run of consecutive days present in the set. */
function computeLongest(dates: string[]): number {
  const sorted = [...new Set(dates.map((d) => d.slice(0, 10)))].sort();
  let longest = 0;
  let run = 0;
  let prev: number | null = null;

  for (const day of sorted) {
    const t = Date.parse(`${day}T00:00:00Z`);
    run = prev !== null && t - prev === DAY_MS ? run + 1 : 1;
    prev = t;
    if (run > longest) longest = run;
  }
  return longest;
}

export async function getStreakData(supabase: SupabaseClient, userId: string | null): Promise<StreakData> {
  let rows: { activity_date: string; xp_earned: number; lessons_completed: number }[] = [];
  if (userId) {
    const { data } = await supabase
      .from('user_activity')
      .select('activity_date, xp_earned, lessons_completed')
      .eq('user_id', userId)
      .order('activity_date', { ascending: true });
    rows = data ?? [];
  }

  const byDate = new Map(rows.map((r) => [r.activity_date.slice(0, 10), r]));
  const dates = rows.map((r) => r.activity_date);

  // Build a 53-week window ending today, aligned so every column is a
  // Monday→Sunday week.
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const start = new Date(today.getTime() - 364 * DAY_MS);
  const weekdayFromMonday = (start.getUTCDay() + 6) % 7; // 0 = Monday
  start.setTime(start.getTime() - weekdayFromMonday * DAY_MS);

  const cells: HeatCell[] = [];
  for (let t = start.getTime(); t <= today.getTime(); t += DAY_MS) {
    const key = iso(new Date(t));
    const row = byDate.get(key);
    cells.push({ date: key, xp: row?.xp_earned ?? 0, lessons: row?.lessons_completed ?? 0 });
  }
  // Pad the final partial week so the grid stays rectangular.
  while (cells.length % 7 !== 0) cells.push({ date: null, xp: 0, lessons: 0 });

  const weekStart = iso(new Date(today.getTime() - 6 * DAY_MS));
  const lastWeek = rows.filter((r) => r.activity_date.slice(0, 10) >= weekStart);

  return {
    current: computeStreak(dates),
    longest: computeLongest(dates),
    activeDays: byDate.size,
    weekXp: lastWeek.reduce((s, r) => s + (r.xp_earned ?? 0), 0),
    weekDays: lastWeek.length,
    totalXp: rows.reduce((s, r) => s + (r.xp_earned ?? 0), 0),
    cells,
    bestDayXp: rows.reduce((m, r) => Math.max(m, r.xp_earned ?? 0), 0),
  };
}
