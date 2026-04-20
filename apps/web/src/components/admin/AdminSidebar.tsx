'use client'

import { useState } from "react";
import { LayoutDashboard, Users, GraduationCap, Settings, LogOut, ChevronLeft, ChevronRight, ExternalLink, BookOpen } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

export default function AdminSidebar({ role }: { role?: string | null }) {
  const supabase = createClient();
  const router = useRouter();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isAdmin = role === 'admin';

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <aside className={`bg-background hidden md:flex flex-col justify-between py-6 shrink-0 border-r border-border transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20 px-2' : 'w-56 lg:w-64 px-3 lg:px-4'}`}>
      <div>
        <div className={`mb-8 flex items-center relative w-full ${isCollapsed ? 'justify-center px-0' : 'justify-between px-3'}`}>
          {!isCollapsed ? (
            <div className="flex flex-col">
              <img src="/logo-vector.svg" alt="Dialektoz Logo" className="w-32 h-auto object-contain -ml-2" />
              <span className="text-xs font-semibold text-primary/80 ml-1 mt-1 tracking-widest uppercase">Admin</span>
            </div>
          ) : (
            <div className="w-12 h-12 flex items-center justify-center mx-auto text-primary relative">
              <Logo size={34} className="text-primary" />
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`text-foreground/70 hover:text-foreground transition-colors hidden lg:flex items-center justify-center absolute top-1/2 -translate-y-1/2 ${isCollapsed ? '-right-2 z-10' : 'right-3'}`}
            title={isCollapsed ? "Expandir" : "Contraer"}
          >
            {isCollapsed ? <ChevronRight size={22} /> : <ChevronLeft size={20} />}
          </button>
        </div>

        {!isCollapsed && (
          <p className="text-xs text-foreground/40 font-medium uppercase tracking-widest px-5 mb-3">Panel de control</p>
        )}

        <nav className="flex flex-col gap-1">
          <NavItem href="/admin" icon={<LayoutDashboard size={18} />} label="Resumen" active={pathname === '/admin'} collapsed={isCollapsed} />
          <NavItem href="/admin/content" icon={<BookOpen size={18} />} label="Contenido" active={pathname.startsWith('/admin/content')} collapsed={isCollapsed} />
          {isAdmin && (
            <>
              <NavItem href="/admin/teachers" icon={<GraduationCap size={18} />} label="Profesores" active={pathname.startsWith('/admin/teachers')} collapsed={isCollapsed} />
              <NavItem href="/admin/users" icon={<Users size={18} />} label="Usuarios" active={pathname.startsWith('/admin/users')} collapsed={isCollapsed} />
            </>
          )}
        </nav>

        {!isCollapsed && (
          <p className="text-xs text-foreground/40 font-medium uppercase tracking-widest px-5 mt-6 mb-3">Sistema</p>
        )}
        {isCollapsed && <div className="my-4 border-t border-border/30" />}

        <nav className="flex flex-col gap-1">
          <NavItem href="/admin/settings" icon={<Settings size={18} />} label="Configuración" active={pathname.startsWith('/admin/settings')} collapsed={isCollapsed} />
        </nav>
      </div>

      <div className="flex flex-col gap-1">
        <NavItem
          href="/dashboard"
          icon={<ExternalLink size={18} />}
          label="Ir a la plataforma"
          collapsed={isCollapsed}
        />
        <NavItem
          icon={<LogOut size={18} />}
          label="Cerrar Sesión"
          onClick={handleLogout}
          collapsed={isCollapsed}
        />
      </div>
    </aside>
  );
}

function NavItem({
  icon, label, active = false, onClick, href, collapsed
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
  href?: string;
  collapsed?: boolean;
}) {
  const baseClasses = `flex items-center gap-3 py-3 rounded-md transition-all whitespace-nowrap overflow-hidden ${collapsed ? 'justify-center px-0 w-12 h-12 mx-auto' : 'px-4 w-full'} ${active ? 'bg-card border-l-4 border-primary text-primary' : 'text-foreground hover:bg-card/50'}`;

  const content = (
    <>
      <span className={`shrink-0 ${active ? 'text-primary' : 'text-foreground/70'}`}>{icon}</span>
      {!collapsed && (
        <span className="text-sm font-semibold opacity-100 transition-opacity duration-300">{label}</span>
      )}
    </>
  );

  if (onClick) {
    return (
      <button onClick={onClick} title={collapsed ? label : undefined} className={baseClasses}>
        {content}
      </button>
    );
  }

  if (href) {
    return (
      <Link href={href} title={collapsed ? label : undefined} className={baseClasses}>
        {content}
      </Link>
    );
  }

  return <div title={collapsed ? label : undefined} className={baseClasses}>{content}</div>;
}
