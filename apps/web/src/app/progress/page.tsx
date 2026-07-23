import Link from 'next/link';
import Sidebar from '@/components/layout/Sidebar';
import TopNavigation from '@/components/layout/TopNavigation';
import MobileHeader from '@/components/layout/MobileHeader';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import { createClient } from '@/utils/supabase/server';
import { getRoadmap } from '@/lib/progress';
import type { RoadmapLevel, RoadmapLesson, SkillProgress } from '@/lib/progress';
import { cefrLabel } from '@/lib/learning';
import {
  Trophy, Flame, Clock, Target, CheckCircle2, Lock, Play, Medal,
  ArrowRight, BookOpen, MapPin,
} from 'lucide-react';

export const metadata = {
  title: 'Mi Progreso | Dialektoz',
  description: 'Tu ruta de aprendizaje y todo lo que has logrado',
};

export default async function ProgressPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { levels, stats, skills, nextUp } = await getRoadmap(supabase, user?.id ?? null);

  return (
    <div className="flex w-full h-[100dvh] bg-background overflow-hidden selection:bg-primary/30">
      <Sidebar />
      <main className="flex-1 overflow-y-auto px-4 md:px-6 lg:px-10 pb-20 md:pb-6 border-x border-border/50 custom-scrollbar relative">
        <MobileHeader />
        <TopNavigation />

        <div className="w-full max-w-4xl 2xl:max-w-5xl mx-auto py-2">
          {/* ── Header ───────────────────────────────── */}
          <header className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
              Mi <span className="text-primary">Progreso</span>
            </h1>
            <p className="text-foreground/60">
              Tu ruta completa de aprendizaje: dónde estás, qué has conquistado y qué viene después.
            </p>
          </header>

          {/* ── Stats ────────────────────────────────── */}
          <section className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-8">
            <StatTile icon={<Trophy className="size-4" />} label="XP total" value={stats.xp.toLocaleString('es')} highlight />
            <StatTile icon={<CheckCircle2 className="size-4" />} label="Lecciones" value={`${stats.lessonsCompleted}/${stats.totalLessons}`} />
            <StatTile icon={<Clock className="size-4" />} label="Horas" value={`${stats.hours}`} />
            <StatTile icon={<Target className="size-4" />} label="Promedio" value={stats.avgScore ? `${stats.avgScore}%` : '—'} />
            <StatTile icon={<Flame className="size-4" />} label="Racha" value={`${stats.streak} ${stats.streak === 1 ? 'día' : 'días'}`} />
          </section>

          {/* ── Continue CTA ─────────────────────────── */}
          {nextUp && (
            <Link
              href={`/learn/${nextUp.levelCode.toLowerCase()}/${nextUp.lessonId}`}
              className="group flex items-center gap-4 mb-10 rounded-2xl border border-primary/30 bg-primary/5 p-5 hover:border-primary/60 transition-colors"
            >
              <div className="size-11 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
                <MapPin className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-0.5">Estás aquí</p>
                <p className="font-bold text-foreground truncate">{nextUp.title}</p>
                <p className="text-xs text-foreground/50">Nivel {nextUp.levelCode}</p>
              </div>
              <span className="flex items-center gap-2 text-sm font-bold text-primary shrink-0">
                <span className="hidden sm:inline">Continuar</span>
                <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </Link>
          )}

          {/* ── Roadmap ──────────────────────────────── */}
          {levels.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed border-border/50 rounded-2xl bg-muted/10">
              <BookOpen className="size-12 text-foreground/30 mx-auto mb-3" />
              <p className="font-medium text-foreground/70">Aún no hay niveles publicados</p>
              <p className="text-sm text-foreground/50 mt-1">Tu ruta aparecerá aquí en cuanto haya contenido.</p>
            </div>
          ) : (
            <section className="space-y-5 mb-10">
              <h2 className="text-xl font-bold tracking-tight">Tu ruta</h2>
              {levels.map((level, i) => (
                <LevelStage key={level.id} level={level} isLast={i === levels.length - 1} />
              ))}
            </section>
          )}

          {/* ── Skills ───────────────────────────────── */}
          {skills.length > 0 && (
            <section className="mb-10">
              <h2 className="text-xl font-bold tracking-tight mb-1">Dominio por habilidad</h2>
              <p className="text-sm text-foreground/50 mb-4">En qué áreas has avanzado más.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {skills.map((s) => <SkillBar key={s.name} skill={s} />)}
              </div>
            </section>
          )}
        </div>
      </main>
      <MobileBottomNav />
    </div>
  );
}

/* ────────────────────────────────────────────── */

function StatTile({ icon, label, value, highlight = false }: { icon: React.ReactNode; label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl border p-3 flex flex-col gap-1 min-w-0 ${highlight ? 'border-primary/30 bg-primary/5' : 'border-border bg-card'}`}>
      <span className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider ${highlight ? 'text-primary' : 'text-foreground/50'}`}>
        {icon} {label}
      </span>
      <span className="text-xl font-bold tabular-nums truncate">{value}</span>
    </div>
  );
}

function LevelStage({ level, isLast }: { level: RoadmapLevel; isLast: boolean }) {
  const isComplete = level.total > 0 && level.completed === level.total;
  const started = level.completed > 0;

  return (
    <div className="relative">
      <div
        className={`rounded-2xl border p-5 md:p-6 transition-colors ${
          isComplete ? 'border-green-500/30 bg-green-500/[0.03]' : started ? 'border-primary/30 bg-card' : 'border-border bg-card'
        }`}
      >
        {/* Level header */}
        <div className="flex items-start gap-4 mb-5">
          <div
            className={`size-14 rounded-2xl flex items-center justify-center font-black text-lg shrink-0 border ${
              isComplete ? 'bg-green-500/15 text-green-600 border-green-500/30'
              : started ? 'bg-primary/15 text-primary border-primary/30'
              : 'bg-muted text-foreground/40 border-border'
            }`}
          >
            {level.code}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-bold text-foreground truncate">{level.title}</h3>
              {isComplete && (
                <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-green-600 bg-green-500/15 px-2 py-0.5 rounded-sm">
                  <Medal className="size-3" /> Completado
                </span>
              )}
            </div>
            <p className="text-xs text-foreground/50 mb-2">{cefrLabel(level.code)} · {level.completed}/{level.total} lecciones</p>
            <div className="flex items-center gap-3">
              <div className="h-1.5 flex-1 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${isComplete ? 'bg-green-500' : 'bg-primary'}`}
                  style={{ width: `${level.percent}%` }}
                />
              </div>
              <span className="text-xs font-bold tabular-nums text-foreground/60 w-9 text-right">{level.percent}%</span>
            </div>
          </div>
        </div>

        {/* Lesson rail */}
        {level.lessons.length > 0 ? (
          <ul className="relative">
            <div className="absolute left-4 top-3 bottom-3 w-px bg-border" aria-hidden />
            {level.lessons.map((lesson) => (
              <LessonNode key={lesson.id} lesson={lesson} levelCode={level.code} />
            ))}
          </ul>
        ) : (
          <p className="text-sm text-foreground/40 italic">Este nivel aún no tiene lecciones.</p>
        )}
      </div>

      {/* Connector to next level */}
      {!isLast && <div className="h-5 w-px bg-border mx-auto" aria-hidden />}
    </div>
  );
}

function LessonNode({ lesson, levelCode }: { lesson: RoadmapLesson; levelCode: string }) {
  const { state } = lesson;
  const isLocked = state === 'locked';

  const node =
    state === 'completed' ? (
      <span className="relative z-10 size-8 rounded-full bg-green-500/15 text-green-600 border border-green-500/30 flex items-center justify-center shrink-0">
        <CheckCircle2 className="size-4" />
      </span>
    ) : state === 'current' ? (
      <span className="relative z-10 size-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 ring-4 ring-primary/20 animate-pulse">
        <Play className="size-3.5 fill-current" />
      </span>
    ) : isLocked ? (
      <span className="relative z-10 size-8 rounded-full bg-muted text-foreground/40 border border-border flex items-center justify-center shrink-0">
        <Lock className="size-3.5" />
      </span>
    ) : (
      <span className="relative z-10 size-8 rounded-full bg-background text-foreground/60 border border-border flex items-center justify-center shrink-0 text-xs font-bold">
        {lesson.order}
      </span>
    );

  const body = (
    <>
      {node}
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-semibold truncate ${isLocked ? 'text-foreground/40' : 'text-foreground'}`}>
          {lesson.title}
        </p>
        <div className="flex items-center gap-2 text-[11px] text-foreground/45 mt-0.5">
          {lesson.skill && <span className="uppercase tracking-wider font-bold text-primary/70">{lesson.skill}</span>}
          {lesson.duration != null && (
            <>
              {lesson.skill && <span>·</span>}
              <span>{lesson.duration} min</span>
            </>
          )}
          {state === 'completed' && lesson.score != null && (
            <>
              <span>·</span>
              <span className="text-green-600 font-bold">{lesson.score}%</span>
            </>
          )}
        </div>
      </div>
      {state === 'current' && (
        <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-1 rounded-sm shrink-0">
          Continuar
        </span>
      )}
    </>
  );

  const rowClass = `flex items-center gap-3 py-2 pr-1 rounded-lg transition-colors ${
    isLocked ? 'cursor-not-allowed' : 'hover:bg-muted/40'
  }`;

  return (
    <li>
      {isLocked ? (
        <div className={rowClass} aria-disabled title="Completa la lección anterior para desbloquearla">
          {body}
        </div>
      ) : (
        <Link href={`/learn/${levelCode.toLowerCase()}/${lesson.id}`} className={rowClass}>
          {body}
        </Link>
      )}
    </li>
  );
}

function SkillBar({ skill }: { skill: SkillProgress }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-2 gap-2">
        <span className="text-sm font-bold text-foreground truncate">{skill.name}</span>
        <span className="text-xs font-bold tabular-nums text-foreground/50 shrink-0">
          {skill.completed}/{skill.total}
        </span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-primary to-accent rounded-full" style={{ width: `${skill.percent}%` }} />
      </div>
    </div>
  );
}
