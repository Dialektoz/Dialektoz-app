'use client'

import { Flame, Settings } from "lucide-react";
import Link from "next/link";

export default function MobileHeader() {
  return (
    <header className="md:hidden sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/60 w-full h-14 flex items-center justify-between px-4">
      {/* Settings / Profile entry point */}
      <Link href="/settings" className="w-8 h-8 rounded-full bg-card flex items-center justify-center border border-border/50 text-foreground/70 active:scale-95 transition-transform">
        <Settings size={18} />
      </Link>
      
      {/* Logo */}
      <Link href="/" className="flex items-center justify-center">
         <img src="/logo-vector.svg" alt="Dialektoz Logo" className="w-28 h-auto object-contain" />
      </Link>

      {/* Streak */}
      <div className="flex items-center gap-1.5 text-orange-500 font-bold bg-orange-500/10 px-2.5 py-1 rounded-full text-xs border border-orange-500/20">
        <Flame size={14} fill="currentColor" />
        <span>12</span>
      </div>
    </header>
  );
}
