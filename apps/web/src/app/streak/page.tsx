import Link from 'next/link';
import Sidebar from '@/components/layout/Sidebar';
import TopNavigation from '@/components/layout/TopNavigation';
import MobileHeader from '@/components/layout/MobileHeader';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import { createClient } from '@/utils/supabase/server';
import { getStreakData } from '@/lib/streak';
import type { HeatCell } from '@/lib/streak';
import { Flame, Trophy, CalendarDays, Target, ArrowRight } from 'lucide-react';

export const metadata = {
  title: 'Racha Diaria | Dialektoz',
  description: 'Tu constancia día a día',
};

const WEEKLY_GOAL = 5; // days per week

export default async function StreakPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const data = await getStreakData(supabase, user?.id ?? null);

  const goalPct = Math.min(100, Math.round((data.weekDays / WEEKLY_GOAL) * 100));

  return (
    <div className="flex w-full h-[100dvh] bg-background overflow-hidden selection:bg-primary/30">
      <Sidebar />
      <main className="flex-1 overflow-y-auto px-4 md:px-6 lg:px-10 pb-20 md:pb-6 border-x border-border/50 custom-scrollbar relative">
        <MobileHeader />
        <TopNavigation />

        <div className="w-full max-w-4xl 2xl:max-w-5xl mx-auto py-2">
          <header className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
              Racha <span className="text-primary">Diaria</span>
            </h1>
            <p className="text-foreground/60">La constancia vence al talento. Un poco cada día suma más que un maratón al mes.</p>
          </header>

          {/* Hero streak */}
          <section className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-transparent p-6 md:p-8 mb-5 flex flex-col sm:flex-row items-center gap-6">
            <div className="flex items-center gap-4 shrink-0">
              <Flame className={`size-16 ${data.current > 0 ? 'text-primary' : 'text-foreground/20'}`} />
              <div>
                <p className="text-5xl font-black tabular-nums leading-none">{data.current}</p>
                <p className="text-sm font-semibold text-foreground/60 mt-1">
                  {data.current === 1 ? 'día seguido' : 'días seguidos'}
                </p>
              </div>
            </div>
            <div className="flex-1 min-w-0 w-full">
              <p className="text-sm text-foreground/70 mb-3">
                {data.current === 0
                  ? 'Empieza hoy una lección y enciende tu racha. 🔥'
                  : `¡Sigue así! Tu mejor marca es de ${data.longest} ${data.longest === 1 ? 'día' : 'días'}.`}
              </p>
              <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                <span className="text-foreground/60">Meta semanal · {data.weekDays}/{WEEKLY_GOAL} días</span>
                <span className="text-primary tabular-nums">{goalPct}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${goalPct}%` }} />
              </div>
            </div>
          </section>

          {/* Stats */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
            <Stat icon={<Trophy className="size-4" />} label="Mejor racha" value={`${data.longest} ${data.longest === 1 ? 'día' : 'días'}`} />
            <Stat icon={<CalendarDays className="size-4" />} label="Días activos" value={`${data.activeDays}`} />
            <Stat icon={<Flame className="size-4" />} label="XP esta semana" value={data.weekXp.toLocaleString('es')} />
            <Stat icon={<Target className="size-4" />} label="Mejor día" value={`${data.bestDayXp.toLocaleString('es')} XP`} />
          </section>

          {/* Heatmap */}
          <section className="rounded-2xl border border-border bg-card p-5 md:p-6 mb-8">
            <div className="flex items-baseline justify-between gap-3 mb-4 flex-wrap">
              <div>
                <h2 className="font-bold text-lg">Tu último año</h2>
                <p className="text-sm text-foreground/50">Cada cuadro es un día. Mientras más intenso, más aprendiste.</p>
              </div>
              <Legend />
            </div>

            <div className="overflow-x-auto pb-2">
              <div className="grid grid-rows-7 grid-flow-col gap-[3px] w-max">
                {data.cells.map((cell, i) => (
                  <Cell key={cell.date ?? `pad-${i}`} cell={cell} />
                ))}
              </div>
            </div>
          </section>

          {/* CTA */}
          <Link
            href="/learn"
            className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-5 hover:border-primary/50 transition-colors"
          >
            <div className="size-11 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
              <Flame className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-foreground">Mantén viva tu racha</p>
              <p className="text-sm text-foreground/50">Una lección corta es suficiente para sumar el día de hoy.</p>
            </div>
            <ArrowRight className="size-5 text-primary shrink-0 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </main>
      <MobileBottomNav />
    </div>
  );
}

/* ─────────────────────────────────────────── */

function intensity(xp: number): string {
  if (xp <= 0) return 'bg-muted';
  if (xp < 60) return 'bg-primary/25';
  if (xp < 120) return 'bg-primary/50';
  if (xp < 220) return 'bg-primary/75';
  return 'bg-primary';
}

function Cell({ cell }: { cell: HeatCell }) {
  if (!cell.date) return <span className="size-[11px] rounded-[2px] opacity-0" aria-hidden />;
  const label =
    cell.xp > 0
      ? `${cell.date} · ${cell.xp} XP · ${cell.lessons} ${cell.lessons === 1 ? 'lección' : 'lecciones'}`
      : `${cell.date} · sin actividad`;
  return <span title={label} className={`size-[11px] rounded-[2px] ${intensity(cell.xp)}`} />;
}

function Legend() {
  return (
    <div className="flex items-center gap-1.5 text-[10px] text-foreground/50">
      <span>Menos</span>
      <span className="size-[11px] rounded-[2px] bg-muted" />
      <span className="size-[11px] rounded-[2px] bg-primary/25" />
      <span className="size-[11px] rounded-[2px] bg-primary/50" />
      <span className="size-[11px] rounded-[2px] bg-primary/75" />
      <span className="size-[11px] rounded-[2px] bg-primary" />
      <span>Más</span>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3 flex flex-col gap-1 min-w-0">
      <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-foreground/50">
        {icon} {label}
      </span>
      <span className="text-xl font-bold tabular-nums truncate">{value}</span>
    </div>
  );
}
