'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function TopNavigation() {
  const pathname = usePathname();

  const getLinkClasses = (href: string) => {
    // If the path matches exactly, it's active
    const isActive = pathname === href;

    return `font-semibold transition-colors pb-3 ${isActive
        ? 'text-primary border-b-2 border-primary'
        : 'text-foreground/70 hover:text-foreground border-b-2 border-transparent'
      }`;
  };

  return (
    <header className="hidden md:flex sticky top-0 z-20 bg-background/95 backdrop-blur-md mb-8 pt-6 pb-2 border-b border-border/60 w-full">
      <nav className="flex gap-10 w-full justify-center px-4 max-w-7xl mx-auto -mb-[9px]">
        <Link href="/" className={getLinkClasses('/')}>
          Inicio
        </Link>
        <Link href="/learn" className={getLinkClasses('/learn')}>
          Aprender
        </Link>
        <Link href="/certification" className={getLinkClasses('/certification')}>
          Certificación
        </Link>
        <Link href="/laboratory" className={getLinkClasses('/laboratory')}>
          Laboratorio
        </Link>
      </nav>
    </header>
  );
}
