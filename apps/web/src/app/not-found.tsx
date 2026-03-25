import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';
import { Compass, Pickaxe } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center p-4 text-center relative overflow-hidden flex-1">
      
      {/* Glow decorations for premium aesthetic */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-primary/5 rounded-full blur-2xl -z-10 pointer-events-none" />
      
      <div className="relative z-10 flex flex-col items-center animate-in fade-in duration-1000 slide-in-from-bottom-5">
        
        {/* Playful Floating Logo */}
        <div className="mb-6 relative group cursor-pointer hover:scale-110 transition-transform duration-500">
          <Logo size={120} className="text-primary opacity-90 drop-shadow-md" />
          <div className="absolute -top-4 -right-4 animate-bounce text-primary/60">
            <Pickaxe size={24} />
          </div>
        </div>
        
        <h1 className="text-8xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-b from-primary to-primary/30 mb-4 drop-shadow-sm select-none">
          404
        </h1>
        
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
          Oops te saliste del mapa
        </h2>
        
        <p className="text-foreground/60 text-lg max-w-md mx-auto mb-10 leading-relaxed font-medium">
          Sección en construcción, Ferney no ha chambeado 🚧
        </p>

        <Link 
          href="/" 
          className="group flex flex-row items-center gap-3 bg-primary text-primary-foreground px-8 py-4 rounded-xl font-bold hover:bg-primary/90 transition-all hover:scale-105 active:scale-95 shadow-xl hover:shadow-primary/25"
        >
          <Compass size={22} strokeWidth={2.5} className="group-hover:-rotate-45 transition-transform duration-500" />
          Volver a inicio
        </Link>
      </div>
    </div>
  );
}
