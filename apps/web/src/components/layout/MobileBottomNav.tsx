'use client'

import { Home, BarChart2, Flame, Award, BookOpen } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t border-border z-50 flex justify-around items-center h-16 px-2 pb-safe">
      <NavItem href="/dashboard" icon={<Home size={22} />} label="Inicio" active={pathname === '/dashboard'} />
      <NavItem href="/learn" icon={<BookOpen size={22} />} label="Aprender" active={pathname === '/learn'} />
      <NavItem href="/progress" icon={<BarChart2 size={22} />} label="Progreso" active={pathname === '/progress'} />
      <NavItem href="/streak" icon={<Flame size={22} />} label="Racha" active={pathname === '/streak'} />
      <NavItem href="/leaderboard" icon={<Award size={22} />} label="Ranking" active={pathname === '/leaderboard'} />
    </nav>
  );
}

function NavItem({ icon, label, href, active }: { icon: React.ReactNode, label: string, href: string, active: boolean }) {
  return (
    <Link href={href} className="flex flex-col items-center justify-center w-full h-full gap-1">
      <div className={`transition-colors ${active ? 'text-primary' : 'text-foreground/50'}`}>
        {icon}
      </div>
      <span className={`text-[10px] font-semibold transition-colors ${active ? 'text-primary' : 'text-foreground/50'}`}>
        {label}
      </span>
    </Link>
  );
}
