'use client'

import Link from "next/link";

export default function LandingHeader() {
  return (
    <header className="w-full h-24 flex items-center justify-between px-6 lg:px-12 bg-background/50 backdrop-blur-xl border-b border-border/40 sticky top-0 z-50 overflow-visible relative">
      
      {/* 1. Logo (Left) */}
      <div className="z-20 min-w-[120px]">
        <Link href="/" className="flex items-center">
           <img src="/logo-vector.svg" alt="Dialektoz Logo" className="w-32 lg:w-40 h-auto object-contain" />
        </Link>
      </div>
      
      {/* 2. Middle Nav (Mathematically Centered) */}
      <nav className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-10 font-bold text-[12px] lg:text-[13px] tracking-wide uppercase z-10">
        <Link href="/" className="text-foreground/70 hover:text-primary transition-colors whitespace-nowrap">
          Inicio
        </Link>
        <Link href="#el-curso" className="text-foreground/70 hover:text-primary transition-colors whitespace-nowrap">
          El Curso
        </Link>
        <Link href="#como-funciona" className="text-foreground/70 hover:text-primary transition-colors whitespace-nowrap">
          Cómo Funciona
        </Link>
      </nav>

      {/* 3. CTA Button (Right) */}
      <div className="flex items-center gap-4 overflow-visible z-20 min-w-[120px] justify-end">
        <div className="hidden md:flex items-center gap-6">
          <Link 
            href="/login" 
            className="text-foreground/80 hover:text-primary font-bold text-sm tracking-wide transition-colors whitespace-nowrap"
          >
            Iniciar Sesión
          </Link>
          <Link 
            href="/signup" 
            className="bg-primary text-black font-extrabold py-2.5 px-8 rounded-full transition-all shadow-[0_0_20px_rgba(212,175,55,0.2)] hover:shadow-[0_0_25px_rgba(212,175,55,0.3)] active:scale-95 text-sm whitespace-nowrap"
          >
            Empieza ahora
          </Link>
        </div>

        {/* Mobile nav toggle */}
        <div className="md:hidden flex items-center gap-4">
           <Link 
             href="/login" 
             className="text-foreground/80 hover:text-primary font-bold text-xs tracking-wide transition-colors"
           >
             Entrar
           </Link>
           <Link 
            href="/signup" 
            className="text-xs font-black bg-primary text-black py-2 px-5 rounded-full uppercase tracking-tighter"
           >
             Empieza ya
           </Link>
        </div>
      </div>

    </header>
  );
}
