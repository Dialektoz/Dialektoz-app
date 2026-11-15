import {
  Award,
  BarChart2,
  BookOpen,
  Flame,
  GraduationCap,
  Home,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/**
 * Single source of truth for the app's navigation (desktop sidebar and mobile bar).
 * This only decides what to SHOW: access is enforced by the middleware and RLS.
 *
 * Role matrix (mirrors utils/supabase/middleware.ts):
 *   superadmin — everything
 *   admin      — users/memberships only (Resumen, Profesores, Usuarios), no content
 *   teacher    — content only
 *   anyone else — no Administración group
 */

export interface NavLinkItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** 'exact' highlights only that path; 'prefix' also its sub-pages. */
  match: 'exact' | 'prefix';
}

export interface NavGroup {
  id: 'admin' | 'learn';
  label: string;
  items: NavLinkItem[];
}

export const canManageUsers = (role: string) => role === 'admin' || role === 'superadmin';
export const canManageContent = (role: string) => role === 'teacher' || role === 'superadmin';
export const isStaff = (role: string) => canManageUsers(role) || canManageContent(role);

/** First admin page each staff role should land on. */
export const adminHome = (role: string) => (role === 'teacher' ? '/admin/content' : '/admin');

export const isActive = (pathname: string, item: NavLinkItem) =>
  item.match === 'exact' ? pathname === item.href : pathname.startsWith(item.href);

const LEARN_ITEMS: NavLinkItem[] = [
  { href: '/dashboard', label: 'Inicio', icon: Home, match: 'exact' },
  { href: '/progress', label: 'Mi Progreso', icon: BarChart2, match: 'exact' },
  { href: '/streak', label: 'Racha Diaria', icon: Flame, match: 'exact' },
  { href: '/leaderboard', label: 'Clasificación', icon: Award, match: 'exact' },
];

/** Groups to show in the desktop sidebar, in order: Administración first for staff. */
export function navGroupsFor(role: string): NavGroup[] {
  const admin: NavLinkItem[] = [];
  if (canManageUsers(role)) admin.push({ href: '/admin', label: 'Resumen', icon: LayoutDashboard, match: 'exact' });
  if (canManageContent(role)) admin.push({ href: '/admin/content', label: 'Contenido', icon: BookOpen, match: 'prefix' });
  if (canManageUsers(role)) {
    admin.push(
      { href: '/admin/teachers', label: 'Profesores', icon: GraduationCap, match: 'prefix' },
      { href: '/admin/users', label: 'Usuarios', icon: Users, match: 'prefix' },
      // Page not built yet (404 on purpose); kept so the entry is already in place.
      { href: '/admin/settings', label: 'Configuración del sistema', icon: Settings, match: 'prefix' }
    );
  }

  const groups: NavGroup[] = [];
  if (admin.length > 0) groups.push({ id: 'admin', label: 'Administración', items: admin });
  groups.push({ id: 'learn', label: 'Aprender', items: LEARN_ITEMS });
  return groups;
}

/** Items for the mobile bottom bar (short labels). Inside /admin it shows the admin tabs. */
export function mobileTabsFor(role: string, inAdmin: boolean): NavLinkItem[] {
  if (inAdmin) {
    const tabs: NavLinkItem[] = [];
    if (canManageUsers(role)) tabs.push({ href: '/admin', label: 'Resumen', icon: LayoutDashboard, match: 'exact' });
    if (canManageContent(role)) tabs.push({ href: '/admin/content', label: 'Contenido', icon: BookOpen, match: 'prefix' });
    if (canManageUsers(role)) {
      tabs.push(
        { href: '/admin/teachers', label: 'Profesores', icon: GraduationCap, match: 'prefix' },
        { href: '/admin/users', label: 'Usuarios', icon: Users, match: 'prefix' }
      );
    }
    tabs.push({ href: '/dashboard', label: 'Plataforma', icon: Home, match: 'exact' });
    return tabs;
  }

  const tabs: NavLinkItem[] = [
    { href: '/dashboard', label: 'Inicio', icon: Home, match: 'exact' },
    { href: '/learn', label: 'Aprender', icon: BookOpen, match: 'exact' },
    { href: '/progress', label: 'Progreso', icon: BarChart2, match: 'exact' },
    { href: '/streak', label: 'Racha', icon: Flame, match: 'exact' },
    { href: '/leaderboard', label: 'Ranking', icon: Award, match: 'exact' },
  ];
  if (isStaff(role)) tabs.push({ href: adminHome(role), label: 'Admin', icon: ShieldCheck, match: 'prefix' });
  return tabs;
}
