'use client';

import { useEffect, useRef, useState } from 'react';
import { Ban } from 'lucide-react';

/**
 * Shared text-color palette + a tiny, dependency-free color control used across
 * every block (text, interactive exercises and exams). We color at the *field*
 * level: each colorable text carries an optional color that renders via inline
 * `style`. Grading never reads the color — it keeps using the plain text/index,
 * so answer-checking is untouched.
 *
 * The `CText` type and its `ctText`/`ctColor`/`mkCT` helpers live in the pure,
 * React-free `@/lib/ctext` module (so the server exam grader can import them
 * too) and are re-exported here for block components' convenience.
 */
export { ctText, ctColor, mkCT } from '@/lib/ctext';
export type { CText } from '@/lib/ctext';

// Curated palette — readable on the dark theme, no free color picker.
export const TEXT_COLORS = [
  { name: 'Dorado', value: '#D4AF37' },
  { name: 'Rojo', value: '#F87171' },
  { name: 'Verde', value: '#4ADE80' },
  { name: 'Azul', value: '#60A5FA' },
  { name: 'Morado', value: '#C084FC' },
] as const;

/**
 * Compact swatch popover. Shows the 5 palette colors plus a "clear" action.
 * Controlled: `color` is the current value, `onPick` receives the new color
 * (or `undefined` to clear).
 */
export function ColorDots({
  color,
  onPick,
  title = 'Color del texto',
}: {
  color?: string;
  onPick: (color?: string) => void;
  title?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        type="button"
        title={title}
        onClick={() => setOpen((o) => !o)}
        className="w-7 h-7 rounded-md border border-border flex items-center justify-center text-xs font-bold hover:bg-muted transition-colors"
        style={{ color: color ?? 'var(--foreground)' }}
      >
        A
      </button>
      {open && (
        <div className="absolute right-0 top-9 z-40 flex items-center gap-1.5 p-2 rounded-lg border border-border bg-card shadow-xl">
          {TEXT_COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              title={c.name}
              onClick={() => {
                onPick(c.value);
                setOpen(false);
              }}
              className={`w-5 h-5 rounded-full transition-transform hover:scale-110 ${
                color === c.value ? 'ring-2 ring-offset-1 ring-offset-card ring-foreground/50' : 'border border-border'
              }`}
              style={{ backgroundColor: c.value }}
            />
          ))}
          <div className="w-px h-5 bg-border mx-0.5" />
          <button
            type="button"
            title="Quitar color"
            onClick={() => {
              onPick(undefined);
              setOpen(false);
            }}
            className="w-5 h-5 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground"
          >
            <Ban className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
