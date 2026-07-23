import type { SupabaseClient } from '@supabase/supabase-js';

export type LeaderboardPeriod = 'week' | 'month' | 'all';

export interface LeaderboardRow {
  userId: string;
  name: string;
  xp: number;
}

export interface MyRank {
  rank: number;
  xp: number;
  total: number;
}

export const PERIODS: { value: LeaderboardPeriod; label: string; blurb: string }[] = [
  { value: 'week', label: 'Semanal', blurb: 'Últimos 7 días' },
  { value: 'month', label: 'Mensual', blurb: 'Últimos 30 días' },
  { value: 'all', label: 'Global', blurb: 'Desde el inicio' },
];

export function parsePeriod(value?: string): LeaderboardPeriod {
  return value === 'week' || value === 'month' || value === 'all' ? value : 'week';
}

export async function getLeaderboard(
  supabase: SupabaseClient,
  period: LeaderboardPeriod,
  limit = 25
): Promise<LeaderboardRow[]> {
  const { data, error } = await supabase.rpc('get_leaderboard', {
    limit_count: limit,
    p_period: period,
  });
  if (error || !data) return [];
  return (data as { user_id: string; name: string; xp: number }[]).map((r) => ({
    userId: r.user_id,
    name: r.name,
    xp: Number(r.xp),
  }));
}

export async function getMyRank(
  supabase: SupabaseClient,
  period: LeaderboardPeriod
): Promise<MyRank | null> {
  const { data, error } = await supabase.rpc('get_my_leaderboard_rank', { p_period: period });
  if (error || !data || (Array.isArray(data) && data.length === 0)) return null;
  const row = Array.isArray(data) ? data[0] : data;
  return { rank: Number(row.rank), xp: Number(row.xp), total: Number(row.total) };
}
