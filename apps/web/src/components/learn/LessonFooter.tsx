'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { CheckCircle2, Circle, ArrowLeft, ArrowRight, Loader2, Trophy } from 'lucide-react';
import { useAttempt, scoreOf } from './LessonAttempt';

interface LessonFooterProps {
  lessonId: string;
  levelCode: string;
  initialStatus: 'not_started' | 'in_progress' | 'completed';
  prevLessonId: string | null;
  nextLessonId: string | null;
}

export default function LessonFooter({ lessonId, levelCode, initialStatus, prevLessonId, nextLessonId }: LessonFooterProps) {
  const router = useRouter();
  const [completed, setCompleted] = useState(initialStatus === 'completed');
  const [saving, setSaving] = useState(false);
  const attempt = useAttempt();
  const score = attempt ? scoreOf(attempt.results) : null;
  const hasActivities = !!score && score.total > 0;

  // Mark the lesson as in-progress on first view (never downgrade a completed one).
  useEffect(() => {
    if (initialStatus === 'completed') return;
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from('user_progress').upsert(
        { user_id: user.id, lesson_id: lessonId, status: 'in_progress', last_accessed_at: new Date().toISOString() },
        { onConflict: 'user_id,lesson_id' }
      );
    })();
  }, [lessonId, initialStatus]);

  const markComplete = async () => {
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      return;
    }
    const { error } = await supabase.from('user_progress').upsert(
      { user_id: user.id, lesson_id: lessonId, status: 'completed', score: score ? score.percent : 0, last_accessed_at: new Date().toISOString() },
      { onConflict: 'user_id,lesson_id' }
    );
    setSaving(false);
    if (!error) {
      setCompleted(true);
      router.refresh();
    }
  };

  const base = `/learn/${levelCode.toLowerCase()}`;

  return (
    <div className="mt-12 pt-6 border-t border-border/50">
      <div className="flex flex-col items-center gap-4">
        {hasActivities && (
          <div className="w-full max-w-sm rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Trophy className="w-4 h-4 text-primary" /> Tu puntuación
              </span>
              <span className="text-sm font-bold text-primary">{score!.correct} / {score!.total}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${score!.percent}%` }} />
            </div>
            {score!.answered < score!.total && (
              <p className="text-xs text-muted-foreground mt-2">Te faltan {score!.total - score!.answered} actividad(es) por responder.</p>
            )}
          </div>
        )}
        <button
          onClick={markComplete}
          disabled={saving || completed}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-colors ${
            completed
              ? 'bg-green-500/15 text-green-600 cursor-default'
              : 'bg-primary text-primary-foreground hover:bg-primary/90'
          }`}
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : completed ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
          {completed ? 'Lección completada' : 'Marcar como completada'}
        </button>

        <div className="flex items-center justify-between w-full">
          {prevLessonId ? (
            <Link href={`${base}/${prevLessonId}`} className="inline-flex items-center gap-2 text-sm font-semibold text-foreground/60 hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" /> Anterior
            </Link>
          ) : <span />}
          {nextLessonId ? (
            <Link href={`${base}/${nextLessonId}`} className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
              Siguiente lección <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <Link href={base} className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
              Volver al nivel <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
