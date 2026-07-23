import { Flame, Trophy, Award, Star, Target, Zap, CheckCircle2, Lock } from "lucide-react";
import type { DashboardStats, Achievement, LeaderboardEntry } from "@/lib/dashboard";

interface RightPanelProps {
  profile: { name: string; roleLabel: string; avatarUrl: string | null };
  stats: DashboardStats;
  achievements: Achievement[];
  leaderboard: LeaderboardEntry[];
  currentUserId: string | null;
}

const achievementIcons: Record<string, React.ReactNode> = {
  first: <Star className="size-3.5" />,
  streak3: <Flame className="size-3.5" />,
  five: <Zap className="size-3.5" />,
  perfect: <Target className="size-3.5" />,
  level: <Award className="size-3.5" />,
};

export default function RightPanel({ profile, stats, achievements, leaderboard, currentUserId }: RightPanelProps) {
  const unlocked = achievements.filter((a) => a.unlocked);
  const shown = unlocked.length > 0 ? unlocked.slice(0, 4) : achievements.slice(0, 3);

  return (
    /* Fluid width: never cramped on tight screens, never lost on huge ones. */
    <aside className="hidden xl:flex w-[clamp(17rem,20vw,28rem)] shrink-0 bg-background flex-col gap-3 border-l border-border/10 overflow-y-auto custom-scrollbar py-4 px-3 2xl:px-4">
      {/* Profile summary */}
      <div className="bg-card/50 rounded-xl p-4 border border-primary/20 flex flex-col relative overflow-hidden shrink-0">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-accent" />
        <div className="flex items-center gap-3 mb-4 w-full min-w-0">
          <div className="size-11 2xl:size-12 bg-gradient-to-br from-[#dfc8b0] to-[#c79a6d] rounded-full flex items-center justify-center text-white font-bold text-lg ring-2 ring-background shrink-0 overflow-hidden">
            {profile.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatarUrl} alt={profile.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-secondary-foreground/80">{profile.name.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-base 2xl:text-lg leading-tight truncate">{profile.name}</h3>
            <p className="text-[10px] text-foreground/70 font-medium truncate">{profile.roleLabel}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 w-full">
          <Stat icon={<Flame className="size-3.5 text-primary shrink-0" />} value={`${stats.streak} ${stats.streak === 1 ? "día" : "días"}`} />
          <Stat icon={<Trophy className="size-3.5 text-primary shrink-0" />} value={`${stats.xp.toLocaleString("es")} XP`} />
        </div>
      </div>

      {/* Leaderboard */}
      <div className="bg-card rounded-xl border border-border flex flex-col shrink-0">
        <div className="px-4 py-3 border-b border-border/50 flex justify-between items-center gap-2">
          <h4 className="font-bold text-sm truncate">Clasificación</h4>
          <span className="text-primary text-[9px] font-bold flex items-center gap-1 uppercase tracking-wider bg-primary/10 px-2 py-0.5 rounded-sm shrink-0">
            <Award className="size-2.5" /> Global
          </span>
        </div>

        <div className="flex flex-col gap-0.5 p-2">
          {leaderboard.length > 0 ? (
            leaderboard.map((entry, i) => (
              <LeaderboardRow
                key={entry.userId}
                rank={i + 1}
                name={entry.name}
                xp={entry.xp}
                isCurrent={entry.userId === currentUserId}
              />
            ))
          ) : (
            <p className="text-xs text-foreground/50 text-center py-4">Sé el primero en la tabla.</p>
          )}
        </div>
      </div>

      {/* Achievements */}
      <div className="bg-card rounded-xl p-4 border border-border shrink-0">
        <h4 className="font-bold text-sm mb-3 truncate">
          Logros{unlocked.length > 0 ? ` (${unlocked.length}/${achievements.length})` : ""}
        </h4>
        <div className="flex flex-col gap-3">
          {shown.map((a) => (
            <AchievementRow key={a.key} icon={achievementIcons[a.key]} title={a.title} desc={a.desc} unlocked={a.unlocked} />
          ))}
        </div>
      </div>
    </aside>
  );
}

function Stat({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <div className="min-w-0 bg-background rounded-lg px-2 py-2 border border-border shadow-sm flex items-center justify-center gap-1.5">
      {icon}
      <span className="font-bold text-sm tabular-nums truncate">{value}</span>
    </div>
  );
}

function LeaderboardRow({ rank, name, xp, isCurrent = false }: { rank: number; name: string; xp: number; isCurrent?: boolean }) {
  const rankColor =
    rank === 1 ? "text-primary" : rank === 2 ? "text-secondary" : rank === 3 ? "text-accent" : "text-foreground/40";
  return (
    <div
      className={`flex items-center justify-between gap-2 p-2 rounded-lg min-w-0 ${
        isCurrent ? "bg-primary/5 border border-primary/20" : "hover:bg-background/50"
      } transition-colors`}
    >
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <span className={`w-4 text-center font-bold text-xs shrink-0 ${rankColor}`}>{rank}</span>
        <div className="size-7 rounded-full bg-gradient-to-tr from-[#dfc8b0] to-[#c79a6d] flex items-center justify-center text-[10px] font-bold text-primary-foreground shrink-0">
          {name.charAt(0).toUpperCase()}
        </div>
        <span className={`text-xs truncate ${isCurrent ? "font-bold text-accent" : "font-medium"}`}>
          {name}
          {isCurrent ? " (tú)" : ""}
        </span>
      </div>
      <span className="text-[10px] font-bold text-foreground/80 shrink-0 tabular-nums">{xp.toLocaleString("es")} XP</span>
    </div>
  );
}

function AchievementRow({ icon, title, desc, unlocked }: { icon: React.ReactNode; title: string; desc: string; unlocked: boolean }) {
  return (
    <div className={`flex items-center gap-3 min-w-0 ${unlocked ? "" : "opacity-40"}`}>
      <div
        className={`size-8 rounded-lg border flex items-center justify-center shrink-0 ${
          unlocked ? "bg-primary/10 border-primary/20 text-primary" : "bg-muted border-border text-muted-foreground"
        }`}
      >
        {unlocked ? icon : <Lock className="size-3.5" />}
      </div>
      <div className="flex flex-col justify-center min-w-0 flex-1">
        <h5 className="text-[12px] font-bold leading-tight mb-0.5 flex items-center gap-1 min-w-0">
          <span className="truncate">{title}</span>
          {unlocked && <CheckCircle2 className="size-3 text-green-500 shrink-0" />}
        </h5>
        <p className="text-[10px] text-foreground/60 leading-tight truncate">{desc}</p>
      </div>
    </div>
  );
}
