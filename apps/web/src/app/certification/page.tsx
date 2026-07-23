import Link from 'next/link';
import Sidebar from '@/components/layout/Sidebar';
import TopNavigation from '@/components/layout/TopNavigation';
import MobileHeader from '@/components/layout/MobileHeader';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import { createClient } from '@/utils/supabase/server';
import { getCertificationLevels } from '@/lib/certification';
import type { CertificationLevel } from '@/lib/certification';
import { cefrLabel } from '@/lib/learning';
import {
  Award, Lock, Clock, FileQuestion, CheckCircle2, ArrowRight, ShieldCheck, GraduationCap,
} from 'lucide-react';

export const metadata = {
  title: 'Certificación | Dialektoz',
  description: 'Certifica tu nivel de inglés',
};

export default async function CertificationPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const levels = await getCertificationLevels(supabase, user?.id ?? null);
  const earned = levels.filter((l) => l.certificate).length;

  return (
    <div className="flex w-full h-[100dvh] bg-background overflow-hidden selection:bg-primary/30">
      <Sidebar />
      <main className="flex-1 overflow-y-auto px-4 md:px-6 lg:px-10 pb-20 md:pb-6 border-x border-border/50 custom-scrollbar relative">
        <MobileHeader />
        <TopNavigation />

        <div className="w-full max-w-4xl 2xl:max-w-5xl mx-auto py-2">
          <header className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
              Certifi<span className="text-primary">cación</span>
            </h1>
            <p className="text-foreground/60 max-w-2xl">
              Completa todas las lecciones de un nivel y presenta su examen para obtener un certificado
              verificable. Todos los exámenes son <b className="text-foreground/80">gratuitos</b>.
            </p>
            {earned > 0 && (
              <p className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-green-600 bg-green-500/10 px-3 py-1.5 rounded-lg">
                <Award className="size-4" /> {earned} {earned === 1 ? 'certificado obtenido' : 'certificados obtenidos'}
              </p>
            )}
          </header>

          {levels.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed border-border/50 rounded-2xl bg-muted/10">
              <GraduationCap className="size-12 text-foreground/30 mx-auto mb-3" />
              <p className="font-medium text-foreground/70">Aún no hay niveles disponibles</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {levels.map((level) => <LevelCard key={level.levelId} level={level} />)}
            </div>
          )}

          <section className="mt-10 rounded-2xl border border-border bg-card p-5 flex items-start gap-4">
            <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <ShieldCheck className="size-5" />
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-foreground mb-1">Certificados verificables</h2>
              <p className="text-sm text-foreground/60">
                Cada certificado lleva un código único que cualquiera puede validar públicamente — ideal
                para adjuntarlo a tu CV o a tu perfil profesional.
              </p>
            </div>
          </section>
        </div>
      </main>
      <MobileBottomNav />
    </div>
  );
}

function LevelCard({ level }: { level: CertificationLevel }) {
  const passed = !!level.certificate;
  const noAttempts = level.attemptsLeft === 0 && !passed;
  const canTake = level.eligible && level.available && !passed && !noAttempts;

  return (
    <div
      className={`rounded-2xl border p-5 flex flex-col ${
        passed ? 'border-green-500/40 bg-green-500/[0.04]' : canTake ? 'border-primary/40 bg-card' : 'border-border bg-card'
      }`}
    >
      <div className="flex items-start gap-4 mb-4">
        <div
          className={`size-14 rounded-2xl flex items-center justify-center font-black text-lg shrink-0 border ${
            passed ? 'bg-green-500/15 text-green-600 border-green-500/30'
              : canTake ? 'bg-primary/15 text-primary border-primary/30'
              : 'bg-muted text-foreground/40 border-border'
          }`}
        >
          {passed ? <Award className="size-7" /> : level.code}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-foreground truncate">{level.title}</h3>
          <p className="text-xs text-foreground/50">{level.code} · {cefrLabel(level.code)}</p>
        </div>
      </div>

      {/* Meta */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-foreground/60 mb-4">
        <span className="flex items-center gap-1.5"><FileQuestion className="size-3.5" /> {level.questionCount} preguntas</span>
        <span className="flex items-center gap-1.5"><Clock className="size-3.5" /> {level.timeLimitMinutes} min</span>
        <span className="flex items-center gap-1.5"><CheckCircle2 className="size-3.5" /> Aprueba con {level.passingScore}%</span>
      </div>

      {/* Status */}
      {passed ? (
        <div className="mt-auto">
          <p className="text-sm font-bold text-green-600 mb-3">
            ¡Aprobado con {level.certificate!.score}%!
          </p>
          <Link
            href={`/certificate/${level.certificate!.serial}`}
            className="inline-flex items-center gap-2 bg-green-600 text-white font-bold text-sm px-4 py-2.5 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Award className="size-4" /> Ver certificado
          </Link>
        </div>
      ) : !level.eligible ? (
        <div className="mt-auto">
          <div className="flex items-center justify-between text-xs font-semibold text-foreground/60 mb-1.5">
            <span>Completa el nivel para desbloquear</span>
            <span className="tabular-nums">{level.completedLessons}/{level.totalLessons}</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-primary rounded-full"
              style={{ width: `${level.totalLessons ? (level.completedLessons / level.totalLessons) * 100 : 0}%` }}
            />
          </div>
          <Link href={`/learn/${level.code.toLowerCase()}`} className="inline-flex items-center gap-2 text-sm font-bold text-primary">
            Seguir estudiando <ArrowRight className="size-4" />
          </Link>
        </div>
      ) : !level.available ? (
        <p className="mt-auto text-sm text-foreground/50 flex items-center gap-2">
          <Lock className="size-4" /> El examen de este nivel aún no está disponible.
        </p>
      ) : noAttempts ? (
        <p className="mt-auto text-sm text-destructive font-semibold">
          Sin intentos disponibles{level.bestScore != null ? ` · mejor nota: ${level.bestScore}%` : ''}
        </p>
      ) : (
        <div className="mt-auto">
          {level.bestScore != null && (
            <p className="text-xs text-foreground/50 mb-2">Mejor intento: {level.bestScore}%</p>
          )}
          <Link
            href={`/certification/${level.code.toLowerCase()}`}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-bold text-sm px-4 py-2.5 rounded-lg hover:bg-primary/90 transition-colors"
          >
            Presentar examen <ArrowRight className="size-4" />
          </Link>
          <p className="text-[11px] text-foreground/40 mt-2">
            {level.attemptsLeft} de {level.maxAttempts} intentos restantes
          </p>
        </div>
      )}
    </div>
  );
}
