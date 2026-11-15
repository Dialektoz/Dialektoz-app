'use client'

import { Flame, LogOut, Settings } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function MobileHeaderClient({ streak }: { streak: number }) {
  const supabase = createClient();
  const router = useRouter();

  // The desktop sidebars (hidden on phones) were the only place to sign out.
  const handleLogout = async () => {
    if (!window.confirm("¿Cerrar sesión?")) return;
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="md:hidden sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/60 w-full h-14 grid grid-cols-[1fr_auto_1fr] items-center px-4">
      {/* Settings / Profile entry point */}
      <Link href="/settings" aria-label="Configuración" className="w-8 h-8 rounded-full bg-card flex items-center justify-center border border-border/50 text-foreground/70 active:scale-95 transition-transform justify-self-start">
        <Settings size={18} />
      </Link>

      {/* Logo */}
      <Link href="/" className="flex items-center justify-center">
         <img src="/logo-vector.svg" alt="Dialektoz Logo" className="w-28 h-auto object-contain" />
      </Link>

      {/* Streak + sign out */}
      <div className="flex items-center gap-2 justify-self-end">
        <div className="flex items-center gap-1.5 text-orange-500 font-bold bg-orange-500/10 px-2.5 py-1 rounded-full text-xs border border-orange-500/20">
          <Flame size={14} fill="currentColor" />
          <span>{streak}</span>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          aria-label="Cerrar sesión"
          className="w-8 h-8 rounded-full bg-card flex items-center justify-center border border-border/50 text-foreground/70 active:scale-95 transition-transform cursor-pointer"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}
