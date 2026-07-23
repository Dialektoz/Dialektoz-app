import Link from 'next/link';
import Sidebar from '@/components/layout/Sidebar';
import TopNavigation from '@/components/layout/TopNavigation';
import MobileHeader from '@/components/layout/MobileHeader';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import { createClient } from '@/utils/supabase/server';
import { getLeaderboard, getMyRank, parsePeriod, PERIODS } from '@/lib/leaderboard';
import type { LeaderboardRow } from '@/lib/leaderboard';
import { Trophy, Medal, Crown, EyeOff, Users, ArrowRight } from 'lucide-react';

export const metadata = {
  title: 'Clasificación | Dialektoz',
  description: 'Compite sanamente con otros estudiantes',
};

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { period: periodParam } = await searchParams;
  const period = parsePeriod(periodParam);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [rows, myRank] = await Promise.all([
    getLeaderboard(supabase, period, 25),
    user ? getMyRank(supabase, period) : Promise.resolve(null),
  ]);

  const podium = rows.slice(0, 3);
  const rest = rows.slice(3);
  const inList = rows.some((r) => r.userId === user?.id);
  const optedOut = !!user && myRank === null;

  return (
    <div className="flex w-full h-[100dvh] bg-background overflow-hidden selection:bg-primary/30">
      <Sidebar />
      <main className="flex-1 overflow-y-auto px-4 md:px-6 lg:px-10 pb-20 md:pb-6 border-x border-border/50 custom-scrollbar relative">
        <MobileHeader />
        <TopNavigation />

        <div className="w-full max-w-3xl 2xl:max-w-4xl mx-auto py-2">
          <header className="mb-6">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
              Clasifi<span className="text-primary">cación</span>
            </h1>
            <p className="text-foreground/60">Gana XP completando lecciones. Cada lección suma 50 puntos más tu puntuación.</p>
          </header>

          {/* Period tabs — plain links, so the page stays a fast server component */}
          <nav className="flex gap-1 p-1 rounded-xl bg-card border border-border w-fit mb-6">
            {PERIODS.map((p) => {
              const active = p.value === period;
              return (
                <Link
                  key={p.value}
                  href={`/leaderboard?period=${p.value}`}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                    active ? 'bg-primary text-primary-foreground' : 'text-foreground/60 hover:text-foreground hover:bg-muted'
                  }`}
                >
                  {p.label}
                </Link>
              );
            })}
          </nav>

          {rows.length === 0 || rows.every((r) => r.xp === 0) ? (
            <EmptyState />
          ) : (
            <>
              {/* Podium */}
              {podium.length > 0 && (
                <section className="grid grid-cols-3 gap-2 sm:gap-3 mb-6 items-end">
                  {reorderPodium(podium).map(({ row, place }) => (
                    <PodiumCard key={row.userId} row={row} place={place} isMe={row.userId === user?.id} />
                  ))}
                </section>
              )}

              {/* Rest of the table */}
              {rest.length > 0 && (
                <section className="rounded-2xl border border-border bg-card overflow-hidden mb-6">
                  {rest.map((row, i) => (
                    <Row key={row.userId} rank={i + 4} row={row} isMe={row.userId === user?.id} />
                  ))}
                </section>
              )}
            </>
          )}

          {/* Your position */}
          {optedOut ? (
            <div className="rounded-2xl border border-border bg-card p-5 flex items-center gap-4">
              <div className="size-11 rounded-xl bg-muted text-foreground/50 flex items-center justify-center shrink-0">
                <EyeOff className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-foreground">Estás oculto de la clasificación</p>
                <p className="text-sm text-foreground/50">Tu progreso se sigue guardando. Puedes reaparecer cuando quieras.</p>
              </div>
              <Link href="/settings" className="text-sm font-bold text-primary shrink-0 flex items-center gap-1.5">
                Ajustes <ArrowRight className="size-4" />
              </Link>
            </div>
          ) : myRank && !inList ? (
            <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5 flex items-center gap-4">
              <span className="size-11 rounded-xl bg-primary/15 text-primary flex items-center justify-center font-black shrink-0 tabular-nums">
                {myRank.rank}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-foreground">Tu posición</p>
                <p className="text-sm text-foreground/50 tabular-nums">
                  {myRank.xp.toLocaleString('es')} XP · de {myRank.total.toLocaleString('es')} estudiantes
                </p>
              </div>
              <Link href="/learn" className="text-sm font-bold text-primary shrink-0 flex items-center gap-1.5">
                Subir <ArrowRight className="size-4" />
              </Link>
            </div>
          ) : null}
        </div>
      </main>
      <MobileBottomNav />
    </div>
  );
}

/* ─────────────────────────────────────────── */

/** Visual podium order: 2nd, 1st, 3rd. */
function reorderPodium(rows: LeaderboardRow[]): { row: LeaderboardRow; place: number }[] {
  const withPlace = rows.map((row, i) => ({ row, place: i + 1 }));
  const first = withPlace.find((p) => p.place === 1);
  const second = withPlace.find((p) => p.place === 2);
  const third = withPlace.find((p) => p.place === 3);
  return [second, first, third].filter(Boolean) as { row: LeaderboardRow; place: number }[];
}

const PLACE_STYLE: Record<number, { ring: string; badge: string; height: string; icon: React.ReactNode }> = {
  1: { ring: 'ring-primary', badge: 'bg-primary text-primary-foreground', height: 'pt-6 pb-7', icon: <Crown className="size-4" /> },
  2: { ring: 'ring-foreground/30', badge: 'bg-foreground/15 text-foreground', height: 'pt-5 pb-5', icon: <Medal className="size-4" /> },
  3: { ring: 'ring-accent/50', badge: 'bg-accent/20 text-accent', height: 'pt-5 pb-4', icon: <Medal className="size-4" /> },
};

function PodiumCard({ row, place, isMe }: { row: LeaderboardRow; place: number; isMe: boolean }) {
  const s = PLACE_STYLE[place] ?? PLACE_STYLE[3];
  return (
    <div
      className={`rounded-2xl border bg-card px-2 sm:px-3 ${s.height} flex flex-col items-center text-center gap-2 min-w-0 ${
        isMe ? 'border-primary/50' : 'border-border'
      }`}
    >
      <div className={`size-12 sm:size-14 rounded-full bg-gradient-to-br from-[#dfc8b0] to-[#c79a6d] flex items-center justify-center font-bold text-lg text-secondary-foreground/80 ring-2 ${s.ring}`}>
        {row.name.charAt(0).toUpperCase()}
      </div>
      <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${s.badge}`}>
        {s.icon} {place}º
      </span>
      <p className="text-xs sm:text-sm font-bold text-foreground truncate w-full">
        {row.name}{isMe ? ' (tú)' : ''}
      </p>
      <p className="text-[11px] font-bold text-primary tabular-nums">{row.xp.toLocaleString('es')} XP</p>
    </div>
  );
}

function Row({ rank, row, isMe }: { rank: number; row: LeaderboardRow; isMe: boolean }) {
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 border-b border-border/50 last:border-0 ${
        isMe ? 'bg-primary/5' : ''
      }`}
    >
      <span className="w-6 text-center text-sm font-bold text-foreground/40 tabular-nums shrink-0">{rank}</span>
      <div className="size-8 rounded-full bg-gradient-to-tr from-[#dfc8b0] to-[#c79a6d] flex items-center justify-center text-[11px] font-bold text-secondary-foreground/80 shrink-0">
        {row.name.charAt(0).toUpperCase()}
      </div>
      <span className={`flex-1 min-w-0 truncate text-sm ${isMe ? 'font-bold text-accent' : 'font-medium text-foreground'}`}>
        {row.name}{isMe ? ' (tú)' : ''}
      </span>
      <span className="text-sm font-bold text-foreground/70 tabular-nums shrink-0">{row.xp.toLocaleString('es')} XP</span>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16 border-2 border-dashed border-border/50 rounded-2xl bg-muted/10 mb-6">
      <Trophy className="size-12 text-foreground/30 mx-auto mb-3" />
      <p className="font-medium text-foreground/70">Nadie ha puntuado en este periodo</p>
      <p className="text-sm text-foreground/50 mt-1 mb-4">Completa una lección y serás el primero en aparecer.</p>
      <Link href="/learn" className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-bold text-sm px-5 py-2.5 rounded-lg">
        <Users className="size-4" /> Ir a aprender
      </Link>
    </div>
  );
}
