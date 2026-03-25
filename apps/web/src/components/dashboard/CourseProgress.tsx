import { Play, ArrowRight, BookOpen, Clock, Users } from "lucide-react";

export default function CourseProgress() {
  return (
    <div className="flex flex-col gap-6 lg:gap-10 max-w-[900px] mx-auto py-2 px-1">
      {/* Top Header removed and replaced by TopNavigation */}

      {/* Current Course Card */}
      <section className="bg-card rounded-2xl p-8 border border-border relative overflow-hidden flex flex-col justify-between min-h-[240px] shadow-sm">
        <div className="relative z-10 w-[65%] flex flex-col h-full justify-between">
          <div>
            <p className="text-primary text-[10px] font-bold tracking-widest uppercase mb-2">CURSO ACTUAL</p>
            <h2 className="text-4xl font-extrabold mb-8 tracking-tight">Inglés para Negocios</h2>
          </div>
          
          <div className="mb-8">
            <div className="flex justify-between text-xs mb-2 font-semibold">
              <span className="text-foreground/80">Progreso del curso</span>
              <span className="text-primary">64%</span>
            </div>
            <div className="w-full h-2 bg-background rounded-full overflow-hidden border border-border/50">
              <div className="h-full bg-primary rounded-full relative" style={{ width: '64%' }}>
                 <div className="absolute inset-0 bg-white/20 w-1/2 rounded-full"></div>
              </div>
            </div>
          </div>
          
          <button className="bg-primary text-primary-foreground font-bold text-sm py-3 px-6 rounded-md flex items-center gap-2 hover:bg-accent hover:text-accent-foreground transition-all w-fit shadow-md">
            Continuar <ArrowRight size={16} />
          </button>
        </div>
        
        {/* Decorative background icon mapping to the briefcase in the image */}
        <div className="absolute right-[2%] top-[10%] opacity-5 pointer-events-none text-foreground flex items-center justify-center h-full">
           <svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 24 24" fill="currentColor"><path d="M20 7h-3V5c0-1.1-.9-2-2-2h-6c-1.1 0-2 .9-2 2v2H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2zM9 5h6v2H9V5zm11 15H4V9h16v11z"/></svg>
        </div>
      </section>

      {/* Review Section */}
      <section>
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2 tracking-tight">
          <Clock size={20} className="text-primary" /> Repasar
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <ReviewCard title="Vocabulario de Viajes" subtitle="15 palabras nuevas" icon="🗺️" />
          <ReviewCard title="Tiempos Verbales" subtitle="Repaso de Pasado Simple" icon="⏳" />
        </div>
      </section>

      {/* Enrolled Path */}
      <section>
        <h3 className="text-xl font-bold mb-4 tracking-tight">Trayecto Inscrito</h3>
        <div className="bg-card rounded-2xl border border-border flex overflow-hidden min-h-[200px]">
          {/* Decorative image left side */}
          <div className="w-[30%] bg-gradient-to-t from-primary/10 to-transparent flex items-center justify-center p-6 relative">
             <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?q=80&w=400&auto=format&fit=crop')] bg-cover bg-center opacity-40 mix-blend-luminosity"></div>
             <div className="absolute inset-0 bg-gradient-to-r from-transparent to-card"></div>
          </div>
          
          <div className="w-[70%] p-8 pl-4 flex flex-col justify-center z-10">
            <div className="flex justify-between items-start mb-1">
              <h4 className="text-2xl font-bold tracking-tight">Gramática Avanzada</h4>
              <span className="bg-[#A68A39]/20 border border-[#A68A39]/30 text-accent text-[10px] font-bold px-3 py-1 rounded-md uppercase tracking-widest mt-1">EN CURSO</span>
            </div>
            <p className="text-foreground/70 text-sm mb-4 font-medium">Próxima unidad: Estructuras Condicionales</p>
            <p className="text-[13px] mb-6 leading-relaxed text-foreground/80">
              Perfecciona tu fluidez con estructuras gramaticales complejas utilizadas por hablantes nativos en contextos académicos y profesionales.
            </p>
            <div className="flex items-center gap-3 text-xs font-bold text-foreground/50">
               <div className="flex -space-x-2">
                 <div className="w-6 h-6 rounded-full bg-blue-900/50 border border-card flex items-center justify-center text-[10px]">👩‍</div>
                 <div className="w-6 h-6 rounded-full bg-emerald-900/50 border border-card flex items-center justify-center text-[10px]">👨‍</div>
               </div>
               <span className="flex items-center gap-1.5"><Users size={12} /> +4k estudiantes inscritos</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function ReviewCard({ title, subtitle, icon }: { title: string, subtitle: string, icon: string }) {
  return (
    <div className="bg-card rounded-xl p-5 border border-border flex items-center gap-4 hover:border-primary/40 transition-colors cursor-pointer group shadow-sm">
      <div className="w-12 h-12 bg-background rounded-lg flex items-center justify-center text-xl border border-border/50">
        {icon}
      </div>
      <div className="flex-1">
        <h4 className="font-bold text-[14px] group-hover:text-primary transition-colors">{title}</h4>
        <p className="text-[11px] text-foreground/60 mt-0.5">{subtitle}</p>
      </div>
      <div className="w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-colors">
        <Play size={14} className="ml-0.5" />
      </div>
    </div>
  );
}
