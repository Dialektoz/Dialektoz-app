import { Flame, Trophy, Calendar, Award, Medal } from "lucide-react";

export default function RightPanel() {
  return (
    <aside className="w-[280px] lg:w-[320px] xl:w-[340px] bg-background flex flex-col py-4 px-4 shrink-0 gap-3 border-l border-border/10 overflow-y-auto custom-scrollbar">
      {/* Profile summary */}
      <div className="bg-card/50 rounded-xl p-4 border border-primary/20 flex flex-col items-center relative overflow-hidden shrink-0">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-accent"></div>
        <div className="flex items-center gap-3 mb-4 w-full">
          <div className="w-12 h-12 bg-gradient-to-br from-[#dfc8b0] to-[#c79a6d] rounded-full flex items-center justify-center text-white font-bold text-lg ring-2 ring-background shrink-0 overflow-hidden">
            <span className="text-secondary-foreground/80">F</span>
          </div>
          <div>
            <h3 className="font-bold text-lg leading-tight">Ferney</h3>
            <p className="text-[10px] text-foreground/70 font-medium">Estudiante Premium</p>
          </div>
        </div>

        <div className="flex gap-2 w-full">
          <div className="flex-1 bg-background rounded-lg p-2 text-center border border-border shadow-sm flex items-center justify-center gap-2">
            <Flame size={12} className="text-primary" />
            <span className="font-bold text-sm">5 días</span>
          </div>
          <div className="flex-1 bg-background rounded-lg p-2 text-center border border-border shadow-sm flex items-center justify-center gap-2">
            <Trophy size={12} className="text-primary" />
            <span className="font-bold text-sm">14,300</span>
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="bg-card rounded-xl border border-border flex flex-col shrink-0">
        <div className="p-4 py-3 border-b border-border/50">
          <div className="flex justify-between items-center">
            <h4 className="font-bold text-sm">Clasificación</h4>
            <span className="text-primary text-[9px] font-bold flex items-center gap-1 uppercase tracking-wider bg-primary/10 px-2 py-0.5 rounded-sm">
              <Award size={10} /> Oro
            </span>
          </div>
        </div>
        
        <div className="flex flex-col gap-0.5 p-2">
          <LeaderboardRow rank={1} name="Elena R." xp="1,240 XP" avatarColor="from-gray-200 to-gray-400" />
          <LeaderboardRow rank={2} name="Ferney" xp="1,120 XP" isCurrent avatarColor="from-[#dfc8b0] to-[#c79a6d]" />
          <LeaderboardRow rank={3} name="Carlos M." xp="980 XP" avatarColor="from-zinc-300 to-zinc-500" />
        </div>
        
        <div className="p-2 text-center pb-3">
          <button className="text-primary text-[10px] font-bold tracking-widest uppercase hover:text-accent transition-colors">
            Ver Tabla Completa
          </button>
        </div>
      </div>

      {/* Achievements */}
      <div className="bg-card rounded-xl p-4 border border-border shrink-0">
        <h4 className="font-bold text-sm mb-3">Logros Recientes</h4>
        <div className="flex flex-col gap-3">
          <Achievement icon={<Calendar size={14} />} title="Estudiante Constante" desc="5 días seguidos" />
          <Achievement icon={<Award size={14} />} title="Maestro de la Gramática" desc="Nivel 10" />
          <Achievement icon={<Medal size={14} />} title="Mejor Puesto" desc="Top 3 Global" />
        </div>
      </div>
    </aside>
  );
}

function LeaderboardRow({ rank, name, xp, isCurrent = false, avatarColor = "from-accent to-secondary" }: { rank: number, name: string, xp: string, isCurrent?: boolean, avatarColor?: string }) {
  return (
    <div className={`flex items-center justify-between p-2 rounded-lg ${isCurrent ? 'bg-primary/5 border border-primary/20' : 'hover:bg-background/50'} transition-colors`}>
      <div className="flex items-center gap-2.5">
        <span className={`w-4 text-center font-bold text-xs ${rank === 1 ? 'text-primary' : rank === 2 ? 'text-secondary' : 'text-foreground/40'}`}>{rank}</span>
        <div className={`w-7 h-7 rounded-full bg-gradient-to-tr ${avatarColor} flex items-center justify-center text-[10px] font-bold text-primary-foreground`}>{name.charAt(0)}</div>
        <span className={`text-xs ${isCurrent ? 'font-bold text-accent' : 'font-medium'}`}>{name}</span>
      </div>
      <span className="text-[10px] font-bold text-foreground/80">{xp}</span>
    </div>
  );
}

function Achievement({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="flex flex-col justify-center">
        <h5 className="text-[12px] font-bold leading-tight mb-0.5">{title}</h5>
        <p className="text-[10px] text-foreground/60 leading-tight">{desc}</p>
      </div>
    </div>
  );
}
