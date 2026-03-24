import { Flame, Trophy, Calendar, Award, Medal } from "lucide-react";

export default function RightPanel() {
  return (
    <aside className="w-[300px] lg:w-[340px] bg-background flex flex-col py-6 px-4 lg:px-6 overflow-y-auto shrink-0 gap-6 custom-scrollbar border-l border-border/10">
      
      {/* Profile summary */}
      <div className="bg-card/50 rounded-xl p-5 border border-primary/20 flex flex-col items-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-accent"></div>
        <div className="flex items-center gap-4 mb-6 w-full">
          <div className="w-14 h-14 bg-gradient-to-br from-[#dfc8b0] to-[#c79a6d] rounded-full flex items-center justify-center text-white font-bold text-xl ring-2 ring-background shrink-0 overflow-hidden">
            {/* Replace with user avatar image tag later */}
            <span className="text-secondary-foreground/80">F</span>
          </div>
          <div>
            <h3 className="font-bold text-xl leading-tight">Ferney</h3>
            <p className="text-xs text-foreground/70 font-medium">Estudiante Premium</p>
          </div>
        </div>

        <div className="flex gap-3 w-full">
          <div className="flex-1 bg-background rounded-lg p-3 text-center border border-border shadow-sm">
            <div className="flex justify-center items-center gap-1.5 text-primary mb-1">
              <Flame size={14} /> <span className="text-[10px] tracking-wider font-bold">RACHA</span>
            </div>
            <p className="font-bold text-xl">5 días</p>
          </div>
          <div className="flex-1 bg-background rounded-lg p-3 text-center border border-border shadow-sm">
            <div className="flex justify-center items-center gap-1.5 text-primary mb-1">
              <Trophy size={14} /> <span className="text-[10px] tracking-wider font-bold">XP TOTAL</span>
            </div>
            <p className="font-bold text-xl">14,300</p>
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="bg-card rounded-xl border border-border flex flex-col">
        <div className="p-5 pb-4 border-b border-border/50">
          <div className="flex justify-between items-center">
            <h4 className="font-bold text-[15px]">Clasificación</h4>
            <span className="text-primary text-[10px] font-bold flex items-center gap-1 uppercase tracking-wider bg-primary/10 px-2 py-1 rounded-sm">
              <Award size={12} /> Liga de Oro
            </span>
          </div>
        </div>
        
        <div className="flex flex-col gap-1 p-3">
          <LeaderboardRow rank={1} name="Elena R." xp="1,240 XP" avatarColor="from-gray-200 to-gray-400" />
          <LeaderboardRow rank={2} name="Ferney" xp="1,120 XP" isCurrent avatarColor="from-[#dfc8b0] to-[#c79a6d]" />
          <LeaderboardRow rank={3} name="Carlos M." xp="980 XP" avatarColor="from-zinc-300 to-zinc-500" />
        </div>
        
        <div className="p-4 pt-2 text-center pb-5">
          <button className="text-primary text-xs font-bold tracking-widest uppercase hover:text-accent transition-colors">
            Ver Tabla Completa
          </button>
        </div>
      </div>

      {/* Achievements */}
      <div className="bg-card rounded-xl p-5 border border-border">
        <h4 className="font-bold text-[15px] mb-5">Logros Recientes</h4>
        <div className="flex flex-col gap-5">
          <Achievement icon={<Calendar size={18} />} title="Estudiante Constante" desc="Completaste 5 días seguidos" />
          <Achievement icon={<Award size={18} />} title="Maestro de la Gramática" desc="Nivel 10 alcanzado" />
          <Achievement icon={<Medal size={18} />} title="Mejor Puesto" desc="Top 3 en la Liga de Oro" />
        </div>
      </div>

    </aside>
  );
}

function LeaderboardRow({ rank, name, xp, isCurrent = false, avatarColor = "from-accent to-secondary" }: { rank: number, name: string, xp: string, isCurrent?: boolean, avatarColor?: string }) {
  return (
    <div className={`flex items-center justify-between p-2.5 rounded-lg ${isCurrent ? 'bg-primary/5 border border-primary/20' : 'hover:bg-background/50'} transition-colors`}>
      <div className="flex items-center gap-3">
        <span className={`w-5 text-center font-bold text-sm ${rank === 1 ? 'text-primary' : rank === 2 ? 'text-secondary' : 'text-foreground/40'}`}>{rank}</span>
        <div className={`w-8 h-8 rounded-full bg-gradient-to-tr ${avatarColor} flex items-center justify-center text-xs font-bold text-primary-foreground`}>{name.charAt(0)}</div>
        <span className={`text-sm ${isCurrent ? 'font-bold text-accent' : 'font-medium'}`}>{name}</span>
      </div>
      <span className="text-xs font-bold text-foreground/80">{xp}</span>
    </div>
  );
}

function Achievement({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="flex items-start gap-3.5">
      <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="flex flex-col justify-center">
        <h5 className="text-[13px] font-bold mb-0.5">{title}</h5>
        <p className="text-[11px] text-foreground/60">{desc}</p>
      </div>
    </div>
  );
}
