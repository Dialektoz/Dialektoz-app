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
  first: <Star size={14} />,
  streak3: <Flame size={14} />,
  five: <Zap size={14} />,
  perfect: <Target size={14} />,
  level: <Award size={14} />,
};

export default function RightPanel({ profile, stats, achievements, leaderboard, currentUserId }: RightPanelProps) {
  const unlocked = achievements.filter((a) => a.unlocked);
  const shown = unlocked.length > 0 ? unlocked.slice(0, 4) : achievements.slice(0, 3);

  return (
    <aside className="w-[280px] lg:w-[320px] xl:w-[340px] bg-background flex flex-col py-4 px-4 shrink-0 gap-3 border-l border-border/10 overflow-y-auto custom-scrollbar">
      {/* Profile summary */}
      <div className="bg-card/50 rounded-xl p-4 border border-primary/20 flex flex-col items-center relative overflow-hidden shrink-0">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-accent"></div>
        <div className="flex items-center gap-3 mb-4 w-full">
          <div className="w-12 h-12 bg-gradient-to-br from-[#dfc8b0] to-[#c79a6d] rounded-full flex items-center justify-center text-white font-bold text-lg ring-2 ring-background shrink-0 overflow-hidden">
            {profile.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatarUrl} alt={profile.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-secondary-foreground/80">{profile.name.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-lg leading-tight truncate">{profile.name}</h3>
            <p className="text-[10px] text-foreground/70 font-medium">{profile.roleLabel}</p>
          </div>
        </div>

        <div className="flex gap-2 w-full">
          <div className="flex-1 bg-background rounded-lg p-2 text-center border border-border shadow-sm flex items-center justify-center gap-2">
            <Flame size={12} className="text-primary" />
            <span className="font-bold text-sm">{stats.streak} {stats.streak === 1 ? "día" : "días"}</span>
          </div>
          <div className="flex-1 bg-background rounded-lg p-2 text-center border border-border shadow-sm flex items-center justify-center gap-2">
            <Trophy size={12} className="text-primary" />
            <span className="font-bold text-sm">{stats.xp.toLocaleString("es")}</span>
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="bg-card rounded-xl border border-border flex flex-col shrink-0">
        <div className="p-4 py-3 border-b border-border/50">
          <div className="flex justify-between items-center">
            <h4 className="font-bold text-sm">Clasificación</h4>
            <span className="text-primary text-[9px] font-bold flex items-center gap-1 uppercase tracking-wider bg-primary/10 px-2 py-0.5 rounded-sm">
              <Award size={10} /> Global
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-0.5 p-2">
          {leaderboard.length > 0 ? (
            leaderboard.map((entry, i) => (
              <LeaderboardRow key={entry.userId} rank={i + 1} name={entry.name} xp={`${entry.xp.toLocaleString("es")} XP`} isCurrent={entry.userId === currentUserId} />
            ))
          ) : (
            <p className="text-xs text-foreground/50 text-center py-4">Sé el primero en la tabla.</p>
          )}
        </div>
      </div>

      {/* Achievements */}
      <div className="bg-card rounded-xl p-4 border border-border shrink-0">
        <h4 className="font-bold text-sm mb-3">Logros{unlocked.length > 0 ? ` (${unlocked.length}/${achievements.length})` : ""}</h4>
        <div className="flex flex-col gap-3">
          {shown.map((a) => (
            <AchievementRow key={a.key} icon={achievementIcons[a.key]} title={a.title} desc={a.desc} unlocked={a.unlocked} />
          ))}
        </div>
      </div>
    </aside>
  );
}

function LeaderboardRow({ rank, name, xp, isCurrent = false }: { rank: number; name: string; xp: string; isCurrent?: boolean }) {
  const rankColor = rank === 1 ? "text-primary" : rank === 2 ? "text-secondary" : rank === 3 ? "text-accent" : "text-foreground/40";
  return (
    <div className={`flex items-center justify-between p-2 rounded-lg ${isCurrent ? "bg-primary/5 border border-primary/20" : "hover:bg-background/50"} transition-colors`}>
      <div className="flex items-center gap-2.5 min-w-0">
        <span className={`w-4 text-center font-bold text-xs ${rankColor}`}>{rank}</span>
        <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#dfc8b0] to-[#c79a6d] flex items-center justify-center text-[10px] font-bold text-primary-foreground shrink-0">
          {name.charAt(0).toUpperCase()}
        </div>
        <span className={`text-xs truncate ${isCurrent ? "font-bold text-accent" : "font-medium"}`}>{name}{isCurrent ? " (tú)" : ""}</span>
      </div>
      <span className="text-[10px] font-bold text-foreground/80 shrink-0">{xp}</span>
    </div>
  );
}

function AchievementRow({ icon, title, desc, unlocked }: { icon: React.ReactNode; title: string; desc: string; unlocked: boolean }) {
  return (
    <div className={`flex items-center gap-3 ${unlocked ? "" : "opacity-40"}`}>
      <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${unlocked ? "bg-primary/10 border-primary/20 text-primary" : "bg-muted border-border text-muted-foreground"}`}>
        {unlocked ? icon : <Lock size={14} />}
      </div>
      <div className="flex flex-col justify-center min-w-0">
        <h5 className="text-[12px] font-bold leading-tight mb-0.5 flex items-center gap-1">
          {title}
          {unlocked && <CheckCircle2 size={11} className="text-green-500" />}
        </h5>
        <p className="text-[10px] text-foreground/60 leading-tight">{desc}</p>
      </div>
    </div>
  );
}
