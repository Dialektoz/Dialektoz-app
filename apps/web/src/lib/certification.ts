import type { SupabaseClient } from '@supabase/supabase-js';
import { flattenBlocks, isSupportedQuestion } from './exam/grading';

export interface CertificationLevel {
  levelId: string;
  code: string;
  title: string;
  description: string;
  totalLessons: number;
  completedLessons: number;
  eligible: boolean;
  questionCount: number;
  hours: number;
  passingScore: number;
  timeLimitMinutes: number;
  maxAttempts: number;
  attemptsUsed: number;
  attemptsLeft: number;
  bestScore: number | null;
  certificate: { serial: string; score: number; issuedAt: string } | null;
  /** Exam exists, is published and has questions. */
  available: boolean;
}

interface LessonRow {
  id: string;
  level_id: string;
  quiz: unknown;
  duration_minutes: number | null;
}

export async function getCertificationLevels(
  supabase: SupabaseClient,
  userId: string | null
): Promise<CertificationLevel[]> {
  const [{ data: levels }, { data: lessons }, { data: exams }] = await Promise.all([
    supabase.from('levels').select('id, code, title, description, order_index').eq('published', true).order('order_index', { ascending: true }),
    supabase.from('lessons').select('id, level_id, quiz, duration_minutes').eq('published', true),
    supabase.from('exams').select('id, level_id, passing_score, time_limit_minutes, max_attempts, published'),
  ]);

  let completed = new Set<string>();
  let certificates: { level_id: string; serial: string; score: number; issued_at: string }[] = [];
  let attempts: { exam_id: string; score: number | null; submitted_at: string | null }[] = [];

  if (userId) {
    const [{ data: prog }, { data: certs }, { data: atts }] = await Promise.all([
      supabase.from('user_progress').select('lesson_id').eq('user_id', userId).eq('status', 'completed'),
      supabase.from('certificates').select('level_id, serial, score, issued_at').eq('user_id', userId),
      supabase.from('exam_attempts').select('exam_id, score, submitted_at').eq('user_id', userId).not('submitted_at', 'is', null),
    ]);
    completed = new Set((prog ?? []).map((p: { lesson_id: string }) => p.lesson_id));
    certificates = certs ?? [];
    attempts = atts ?? [];
  }

  const lessonRows = (lessons as LessonRow[]) ?? [];
  const examByLevel = new Map((exams ?? []).map((e: { level_id: string }) => [e.level_id, e]));

  return ((levels ?? []) as { id: string; code: string; title: string; description: string | null }[]).map((level) => {
    const levelLessons = lessonRows.filter((l) => l.level_id === level.id);
    const done = levelLessons.filter((l) => completed.has(l.id)).length;

    const questionCount = levelLessons.reduce(
      (sum, l) => sum + flattenBlocks(l.quiz).filter((b) => isSupportedQuestion(b.type)).length,
      0
    );
    const minutes = levelLessons.reduce((sum, l) => sum + (l.duration_minutes ?? 0), 0);

    const exam = examByLevel.get(level.id) as
      | { id: string; passing_score: number; time_limit_minutes: number; max_attempts: number; published: boolean }
      | undefined;

    const levelAttempts = exam ? attempts.filter((a) => a.exam_id === exam.id) : [];
    const cert = certificates.find((c) => c.level_id === level.id) ?? null;
    const maxAttempts = exam?.max_attempts ?? 3;

    return {
      levelId: level.id,
      code: level.code,
      title: level.title,
      description: level.description ?? '',
      totalLessons: levelLessons.length,
      completedLessons: done,
      eligible: levelLessons.length > 0 && done === levelLessons.length,
      questionCount,
      hours: Math.round((minutes / 60) * 10) / 10,
      passingScore: exam?.passing_score ?? 70,
      timeLimitMinutes: exam?.time_limit_minutes ?? 20,
      maxAttempts,
      attemptsUsed: levelAttempts.length,
      attemptsLeft: Math.max(0, maxAttempts - levelAttempts.length),
      bestScore: levelAttempts.length ? Math.max(...levelAttempts.map((a) => a.score ?? 0)) : null,
      certificate: cert ? { serial: cert.serial, score: cert.score, issuedAt: cert.issued_at } : null,
      available: Boolean(exam?.published) && questionCount > 0,
    };
  });
}
