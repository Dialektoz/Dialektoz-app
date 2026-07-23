import type { SupabaseClient } from '@supabase/supabase-js';
import { computeUnlocked, computeStreak } from './learning';

export type LessonState = 'completed' | 'current' | 'unlocked' | 'locked';

export interface RoadmapLesson {
  id: string;
  title: string;
  order: number;
  skill: string | null;
  duration: number | null;
  score: number | null;
  state: LessonState;
}

export interface RoadmapLevel {
  id: string;
  code: string;
  title: string;
  description: string;
  total: number;
  completed: number;
  percent: number;
  lessons: RoadmapLesson[];
}

export interface SkillProgress {
  name: string;
  total: number;
  completed: number;
  percent: number;
}

export interface ProgressStats {
  xp: number;
  lessonsCompleted: number;
  totalLessons: number;
  hours: number;
  avgScore: number;
  streak: number;
  levelsCompleted: number;
}

export interface NextUp {
  lessonId: string;
  levelCode: string;
  title: string;
}

export interface RoadmapData {
  levels: RoadmapLevel[];
  stats: ProgressStats;
  skills: SkillProgress[];
  nextUp: NextUp | null;
}

interface LevelRow {
  id: string;
  code: string;
  title: string;
  description: string | null;
  order_index: number | null;
}
interface LessonRow {
  id: string;
  level_id: string;
  title: string;
  order: number;
  skill_type: string | null;
  duration_minutes: number | null;
}

/**
 * Assembles everything the /progress roadmap needs: levels with their
 * lessons and per-lesson state (completed / current / unlocked / locked),
 * headline stats and a per-skill breakdown.
 */
export async function getRoadmap(supabase: SupabaseClient, userId: string | null): Promise<RoadmapData> {
  const [{ data: levels }, { data: lessons }] = await Promise.all([
    supabase.from('levels').select('id, code, title, description, order_index').eq('published', true).order('order_index', { ascending: true }),
    supabase.from('lessons').select('id, level_id, title, "order", skill_type, duration_minutes').eq('published', true).order('order', { ascending: true }),
  ]);

  let progressRows: { lesson_id: string; status: string; score: number | null }[] = [];
  let activity: { activity_date: string; xp_earned: number; minutes: number }[] = [];
  if (userId) {
    const [{ data: prog }, { data: act }] = await Promise.all([
      supabase.from('user_progress').select('lesson_id, status, score').eq('user_id', userId),
      supabase.from('user_activity').select('activity_date, xp_earned, minutes').eq('user_id', userId),
    ]);
    progressRows = prog ?? [];
    activity = act ?? [];
  }

  const levelRows = (levels as LevelRow[]) ?? [];
  const lessonRows = (lessons as LessonRow[]) ?? [];
  const completedIds = new Set(progressRows.filter((p) => p.status === 'completed').map((p) => p.lesson_id));
  const scoreByLesson = new Map(progressRows.map((p) => [p.lesson_id, p.score]));

  const lessonsByLevel = new Map<string, LessonRow[]>();
  lessonRows.forEach((l) => {
    if (!lessonsByLevel.has(l.level_id)) lessonsByLevel.set(l.level_id, []);
    lessonsByLevel.get(l.level_id)!.push(l);
  });

  const roadmapLevels: RoadmapLevel[] = levelRows.map((lvl) => {
    const ls = (lessonsByLevel.get(lvl.id) ?? []).sort((a, b) => a.order - b.order);
    const unlocked = computeUnlocked(ls, completedIds);
    const done = ls.filter((l) => completedIds.has(l.id)).length;

    return {
      id: lvl.id,
      code: lvl.code,
      title: lvl.title,
      description: lvl.description ?? '',
      total: ls.length,
      completed: done,
      percent: ls.length ? Math.round((done / ls.length) * 100) : 0,
      lessons: ls.map((l) => ({
        id: l.id,
        title: l.title,
        order: l.order,
        skill: l.skill_type,
        duration: l.duration_minutes,
        score: scoreByLesson.get(l.id) ?? null,
        state: completedIds.has(l.id) ? 'completed' : unlocked.has(l.id) ? 'unlocked' : 'locked',
      })),
    };
  });

  // The single "you are here" lesson: the first pending unlocked one,
  // scanning levels in order.
  let nextUp: NextUp | null = null;
  for (const lvl of roadmapLevels) {
    const candidate = lvl.lessons.find((l) => l.state === 'unlocked');
    if (candidate) {
      candidate.state = 'current';
      nextUp = { lessonId: candidate.id, levelCode: lvl.code, title: candidate.title };
      break;
    }
  }

  // Skill breakdown
  const skillMap = new Map<string, { total: number; completed: number }>();
  lessonRows.forEach((l) => {
    const name = (l.skill_type || 'General').trim();
    if (!skillMap.has(name)) skillMap.set(name, { total: 0, completed: 0 });
    const entry = skillMap.get(name)!;
    entry.total++;
    if (completedIds.has(l.id)) entry.completed++;
  });
  const skills: SkillProgress[] = [...skillMap.entries()]
    .map(([name, v]) => ({ name, ...v, percent: v.total ? Math.round((v.completed / v.total) * 100) : 0 }))
    .sort((a, b) => b.total - a.total);

  const completedScores = progressRows.filter((p) => p.status === 'completed').map((p) => p.score ?? 0);
  const stats: ProgressStats = {
    xp: activity.reduce((s, a) => s + (a.xp_earned ?? 0), 0),
    lessonsCompleted: completedIds.size,
    totalLessons: lessonRows.length,
    hours: Math.round((activity.reduce((s, a) => s + (a.minutes ?? 0), 0) / 60) * 10) / 10,
    avgScore: completedScores.length ? Math.round(completedScores.reduce((s, v) => s + v, 0) / completedScores.length) : 0,
    streak: computeStreak(activity.map((a) => a.activity_date)),
    levelsCompleted: roadmapLevels.filter((l) => l.total > 0 && l.completed === l.total).length,
  };

  return { levels: roadmapLevels, stats, skills, nextUp };
}
