'use client'

import { Home, BookOpen, Award, FlaskConical, Settings, LogOut, Flame, Trophy, BarChart2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

export default function Sidebar() {
  const supabase = createClient();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <aside className="w-56 lg:w-64 bg-background flex flex-col justify-between py-6 px-3 lg:px-4 shrink-0">
      <div>
        <div className="mb-12 px-4 pt-2 flex items-center justify-start">
           <img src="/logo-vector.svg" alt="Dialektoz Logo" className="w-44 h-auto object-contain -ml-2" />
        </div>
        
        {/* User profile brief */}
        <div className="flex items-center gap-3 mb-8 px-2 border-b border-border/50 pb-6">
          <div className="w-10 h-10 bg-card rounded-md flex items-center justify-center text-primary">
            <UserIcon /> 
          </div>
          <div>
            <p className="font-bold text-foreground text-sm">Estudiante Élite</p>
            <p className="text-xs text-foreground/60 font-medium">Nivel B2 - Avanzado</p>
          </div>
        </div>

        <button className="w-full bg-accent text-accent-foreground font-bold py-3 px-4 rounded-md mb-8 hover:brightness-110 transition-all shadow-sm">
          Continuar Lección
        </button>

        <nav className="flex flex-col gap-1">
          <NavItem icon={<BarChart2 size={18} />} label="Mi Progreso" active />
          <NavItem icon={<Flame size={18} />} label="Racha Diaria" />
          <NavItem icon={<Trophy size={18} />} label="XP Total" />
          <NavItem icon={<Award size={18} />} label="Clasificación" />
        </nav>
      </div>

      <div className="flex flex-col gap-1">
        <NavItem icon={<Settings size={18} />} label="Configuración" />
        <NavItem 
          icon={<LogOut size={18} />} 
          label="Cerrar Sesión" 
          onClick={handleLogout}
        />
      </div>
    </aside>
  );
}

function NavItem({ icon, label, active = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void }) {
  if (onClick) {
    return (
      <button 
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-md transition-colors text-foreground hover:bg-card/50`}
      >
        <span className="text-foreground/70">{icon}</span>
        <span className="text-sm font-semibold">{label}</span>
      </button>
    );
  }

  return (
    <a href="#" className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${active ? 'bg-card border-l-4 border-primary text-primary' : 'text-foreground hover:bg-card/50'}`}>
      <span className={active ? 'text-primary' : 'text-foreground/70'}>{icon}</span>
      <span className="text-sm font-semibold">{label}</span>
    </a>
  );
}

function UserIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
  )
}
