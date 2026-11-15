'use client'

import { useSyncExternalStore } from "react";
import {
  subscribeSidebar,
  getSidebarCollapsed,
  getSidebarCollapsedServer,
  setSidebarCollapsed,
} from "@/lib/sidebarStore";
import { Settings, LogOut, ChevronLeft, ChevronRight } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { navGroupsFor, isActive } from "./navItems";

export default function SidebarClient({ name, role }: { name: string; role: string }) {
  const supabase = createClient();
  const router = useRouter();
  const pathname = usePathname();

  // Collapsed by default; the user's choice persists across sections.
  const isCollapsed = useSyncExternalStore(
    subscribeSidebar,
    getSidebarCollapsed,
    getSidebarCollapsedServer
  );
  const toggleCollapsed = () => setSidebarCollapsed(!isCollapsed);

  const roleLabel =
    role === 'superadmin' ? 'Super Admin'
    : role === 'admin' ? 'Administrador'
    : role === 'teacher' ? 'Profesor'
    : role === 'premium' || role === 'student_premium' ? 'Estudiante Premium'
    : 'Estudiante';
  // Administración (by role) first, then Aprender. Only labeled when there is more than one group.
  const groups = navGroupsFor(role);
  const showGroupLabels = groups.length > 1;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <aside className={`bg-background hidden md:flex flex-col justify-between py-6 shrink-0 border-r border-border transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20 px-2' : 'w-56 lg:w-64 px-3 lg:px-4'}`}>
      {/* Only the nav list scrolls on short screens, so Configuración / Cerrar sesión stay reachable. */}
      <div className="flex flex-col flex-1 min-h-0">
        <div className={`mb-12 flex items-center relative w-full ${isCollapsed ? 'justify-center px-0' : 'justify-between px-3'}`}>
          {!isCollapsed ? (
             <img src="/logo-vector.svg" alt="Dialektoz Logo" className="w-36 h-auto object-contain -ml-2" />
          ) : (
            <div className="w-12 h-12 flex items-center justify-center mx-auto text-primary relative">
              <Logo size={34} className="text-primary" />
            </div>
          )}
          <button
            onClick={toggleCollapsed}
            className={`text-foreground/70 hover:text-foreground transition-colors hidden lg:flex items-center justify-center absolute top-1/2 -translate-y-1/2 ${
              isCollapsed ? '-right-2 z-10' : 'right-3'
            }`}
            title={isCollapsed ? "Expandir" : "Contraer"}
          >
            {isCollapsed ? <ChevronRight size={22} /> : <ChevronLeft size={20} />}
          </button>
        </div>

        {/* Toggle option: Visible on mobile always */}
        <button
          onClick={toggleCollapsed}
          className="lg:hidden text-foreground/70 hover:text-foreground mx-auto flex justify-center w-full mb-8"
          title={isCollapsed ? "Expandir" : "Contraer"}
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>

        {/* User profile brief */}
        <div className={`flex items-center gap-3 mb-8 border-b border-border/50 pb-6 transition-all ${isCollapsed ? 'justify-center px-0' : 'px-2'}`}>
          <div className="w-10 h-10 bg-card rounded-md flex items-center justify-center text-primary shrink-0 border border-primary/20">
            <UserIcon />
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden whitespace-nowrap opacity-100 transition-opacity duration-300 min-w-0">
              <p className="font-bold text-foreground text-sm truncate">{name}</p>
              <p className="text-xs text-foreground/60 font-medium">{roleLabel}</p>
            </div>
          )}
        </div>

        <nav className="flex flex-col flex-1 min-h-0 overflow-y-auto custom-scrollbar">
          {groups.map((group, gi) => (
            <div key={group.id}>
              {showGroupLabels &&
                (isCollapsed ? (
                  gi > 0 && <div className="my-3 mx-2 border-t border-border/50" />
                ) : (
                  <p className={`text-[10px] font-bold uppercase tracking-widest text-foreground/40 px-4 mb-1.5 ${gi > 0 ? 'mt-5' : ''}`}>
                    {group.label}
                  </p>
                ))}
              <div className="flex flex-col gap-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavItem
                      key={item.href}
                      href={item.href}
                      icon={<Icon size={18} />}
                      label={item.label}
                      active={isActive(pathname, item)}
                      collapsed={isCollapsed}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      <div className="flex flex-col gap-1 shrink-0 pt-2">
        <NavItem href="/settings" icon={<Settings size={18} />} label="Configuración" active={pathname === '/settings'} collapsed={isCollapsed} />
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

function NavItem({ icon, label, active = false, onClick, href, collapsed }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void, href?: string, collapsed?: boolean }) {
  const baseClasses = `flex items-center gap-3 py-3 rounded-md transition-all whitespace-nowrap overflow-hidden ${collapsed ? 'justify-center px-0 w-12 h-12 mx-auto' : 'px-4 w-full'} ${active ? 'bg-card border-l-4 border-primary text-primary' : 'text-foreground hover:bg-card/50'}`;

  const content = (
    <>
      <span className={`shrink-0 ${active && collapsed ? 'ml-0' : active && !collapsed ? 'ml-0 text-primary' : 'text-foreground/70'}`}>
        {icon}
      </span>
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

  return (
    <div title={collapsed ? label : undefined} className={baseClasses}>
      {content}
    </div>
  );
}

function UserIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
  )
}
