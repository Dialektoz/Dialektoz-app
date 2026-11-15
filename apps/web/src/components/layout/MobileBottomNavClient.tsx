'use client'

import Link from "next/link";
import { usePathname } from "next/navigation";
import { mobileTabsFor, isActive } from "./navItems";

/**
 * Bottom bar for phones. Inside /admin it shows the admin tabs for the role
 * (plus a way back to the platform); everywhere else the student tabs, with an
 * extra "Admin" tab for staff.
 */
export default function MobileBottomNavClient({ role }: { role: string }) {
  const pathname = usePathname();
  const tabs = mobileTabsFor(role, pathname.startsWith('/admin'));

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t border-border z-50 flex justify-around items-center h-16 px-2 pb-safe">
      {tabs.map((item) => {
        const Icon = item.icon;
        const active = isActive(pathname, item);
        return (
          <Link key={item.href} href={item.href} className="flex flex-col items-center justify-center w-full h-full gap-1">
            <div className={`transition-colors ${active ? 'text-primary' : 'text-foreground/50'}`}>
              <Icon size={22} />
            </div>
            <span className={`text-[10px] font-semibold transition-colors ${active ? 'text-primary' : 'text-foreground/50'}`}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
