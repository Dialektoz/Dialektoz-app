import type { SupabaseClient } from '@supabase/supabase-js';
import { cefrLabel } from './learning';

const XP_PER_LESSON = 50;

interface LessonRow {
  id: string;
  level_id: string;
  title: string;
  order: number;
  duration_minutes: number | null;
}
interface ProgressRow {
  lesson_id: string;
  status: 'not_started' | 'in_progress' | 'completed';
  score: number | null;
  last_accessed_at: string | null;
}
interface LevelRow {
  id: string;
  code: string;
  title: string;
  description: string | null;
  order_index: number | null;
}

export interface DashboardStats {
  xp: number;
  completedCount: number;
  inProgressCount: number;
  levelsCompleted: number;
  perfectCount: number;
  streak: number;
}

export interface CurrentCourse {
  code: string;
  title: string;
  levelLabel: string;
  percent: number;
  completed: number;
  total: number;
  nextLessonId: string | null;
  nextLessonTitle: string | null;
  description: string;
}

export interface ReviewItem {
  lessonId: string;
  levelCode: string;
  title: string;
  score: number | null;
}

export interface Achievement {
  key: string;
  title: string;
  desc: string;
  unlocked: boolean;
}

export interface DashboardData {
  stats: DashboardStats;
  currentCourse: CurrentCourse | null;
  review: ReviewItem[];
  achievements: Achievement[];
  hasAnyProgress: boolean;
}

function computeStreak(dates: string[]): number {
  // dates: ISO timestamps. Count consecutive days ending today or yesterday.
  const days = new Set(dates.map((d) => new Date(d).toISOString().slice(0, 10)));
  if (days.size === 0) return 0;
  const dayMs = 86400000;
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const todayStr = today.toISOString().slice(0, 10);
  const yesterdayStr = new Date(today.getTime() - dayMs).toISOString().slice(0, 10);
  if (!days.has(todayStr) && !days.has(yesterdayStr)) return 0;

  let streak = 0;
  const cursor = new Date(today);
  // If no activity today, start counting from yesterday.
  if (!days.has(todayStr)) cursor.setTime(cursor.getTime() - dayMs);
  while (days.has(cursor.toISOString().slice(0, 10))) {
    streak++;
    cursor.setTime(cursor.getTime() - dayMs);
  }
  return streak;
}

export async function getDashboardData(supabase: SupabaseClient, userId: string | null): Promise<DashboardData> {
  const [{ data: levels }, { data: lessons }] = await Promise.all([
    supabase.from('levels').select('id, code, title, description, order_index').eq('published', true).order('order_index', { ascending: true }),
    supabase.from('lessons').select('id, level_id, title, "order", duration_minutes').eq('published', true).order('order', { ascending: true }),
  ]);

  let progress: ProgressRow[] = [];
  if (userId) {
    const { data } = await supabase
      .from('user_progress')
      .select('lesson_id, status, score, last_accessed_at')
      .eq('user_id', userId);
    progress = (data as ProgressRow[]) ?? [];
  }

  const levelRows = (levels as LevelRow[]) ?? [];
  const lessonRows = (lessons as LessonRow[]) ?? [];
  const progressByLesson = new Map(progress.map((p) => [p.lesson_id, p]));
  const lessonById = new Map(lessonRows.map((l) => [l.id, l]));

  // Stats
  const completed = progress.filter((p) => p.status === 'completed');
  const xp = completed.reduce((sum, p) => sum + XP_PER_LESSON + (p.score ?? 0), 0);
  const perfectCount = completed.filter((p) => (p.score ?? 0) >= 100).length;
  const streak = computeStreak(progress.map((p) => p.last_accessed_at).filter((d): d is string => !!d));

  // Per-level aggregates
  const lessonsByLevel = new Map<string, LessonRow[]>();
  lessonRows.forEach((l) => {
    if (!lessonsByLevel.has(l.level_id)) lessonsByLevel.set(l.level_id, []);
    lessonsByLevel.get(l.level_id)!.push(l);
  });

  let levelsCompleted = 0;
  const levelInfo = levelRows.map((lvl) => {
    const ls = (lessonsByLevel.get(lvl.id) ?? []).sort((a, b) => a.order - b.order);
    const total = ls.length;
    const done = ls.filter((l) => progressByLesson.get(l.id)?.status === 'completed').length;
    const percent = total ? Math.round((done / total) * 100) : 0;
    if (total > 0 && done === total) levelsCompleted++;
    const lastActivity = ls
      .map((l) => progressByLesson.get(l.id)?.last_accessed_at)
      .filter((d): d is string => !!d)
      .sort()
      .pop();
    const nextLesson = ls.find((l) => progressByLesson.get(l.id)?.status !== 'completed') ?? null;
    return { lvl, total, done, percent, lastActivity, nextLesson };
  });

  // Choose the "current course": most recently active in-progress level,
  // else the first not-yet-complete level, else the first level.
  const inProgress = levelInfo
    .filter((li) => li.percent > 0 && li.percent < 100 && li.lastActivity)
    .sort((a, b) => (a.lastActivity! < b.lastActivity! ? 1 : -1));
  const firstIncomplete = levelInfo.find((li) => li.percent < 100 && li.total > 0);
  const chosen = inProgress[0] ?? firstIncomplete ?? levelInfo[0] ?? null;

  const currentCourse: CurrentCourse | null = chosen
    ? {
        code: chosen.lvl.code,
        title: chosen.lvl.title,
        levelLabel: cefrLabel(chosen.lvl.code),
        percent: chosen.percent,
        completed: chosen.done,
        total: chosen.total,
        nextLessonId: chosen.nextLesson?.id ?? null,
        nextLessonTitle: chosen.nextLesson?.title ?? null,
        description: chosen.lvl.description ?? '',
      }
    : null;

  // Review: most recently completed lessons (prioritize imperfect scores).
  const review: ReviewItem[] = completed
    .filter((p) => lessonById.has(p.lesson_id))
    .sort((a, b) => {
      const sa = a.score ?? 100;
      const sb = b.score ?? 100;
      if (sa !== sb) return sa - sb; // lower score first
      return (b.last_accessed_at ?? '') < (a.last_accessed_at ?? '') ? -1 : 1;
    })
    .slice(0, 4)
    .map((p) => {
      const l = lessonById.get(p.lesson_id)!;
      const lvl = levelRows.find((v) => v.id === l.level_id);
      return { lessonId: l.id, levelCode: lvl?.code ?? '', title: l.title, score: p.score };
    })
    .filter((r) => r.levelCode);

  const stats: DashboardStats = {
    xp,
    completedCount: completed.length,
    inProgressCount: progress.filter((p) => p.status === 'in_progress').length,
    levelsCompleted,
    perfectCount,
    streak,
  };

  const achievements: Achievement[] = [
    { key: 'first', title: 'Primer paso', desc: 'Completa tu primera lección', unlocked: stats.completedCount >= 1 },
    { key: 'streak3', title: 'En racha', desc: '3 días seguidos', unlocked: stats.streak >= 3 },
    { key: 'five', title: 'Dedicado', desc: 'Completa 5 lecciones', unlocked: stats.completedCount >= 5 },
    { key: 'perfect', title: 'Puntuación perfecta', desc: 'Saca 100% en una actividad', unlocked: stats.perfectCount >= 1 },
    { key: 'level', title: 'Nivel superado', desc: 'Completa un nivel entero', unlocked: stats.levelsCompleted >= 1 },
  ];

  return { stats, currentCourse, review, achievements, hasAnyProgress: progress.length > 0 };
}

export interface LeaderboardEntry {
  userId: string;
  name: string;
  xp: number;
}

export async function getLeaderboard(supabase: SupabaseClient, limit = 5): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase.rpc('get_leaderboard', { limit_count: limit });
  if (error || !data) return [];
  return (data as { user_id: string; name: string; xp: number }[]).map((r) => ({ userId: r.user_id, name: r.name, xp: Number(r.xp) }));
}
