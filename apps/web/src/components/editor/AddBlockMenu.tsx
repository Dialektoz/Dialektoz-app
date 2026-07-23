'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { blocksByCategory } from './blocks/registry';
import { CATEGORY_LABELS } from './blocks/types';

interface AddBlockMenuProps {
  onPick: (type: string) => void;
  /** Close the menu (click outside / Escape). */
  onClose: () => void;
  /** Restrict the picker to these block types (used by the quiz tab). */
  allowedTypes?: string[];
}

export function AddBlockMenu({ onPick, onClose, allowedTypes }: AddBlockMenuProps) {
  const [query, setQuery] = useState('');
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // On open: focus the search without letting the browser jump, then scroll
  // the panel just enough to be fully visible (it may open near the viewport
  // edge and get clipped). `block: 'nearest'` moves the minimum necessary.
  useEffect(() => {
    inputRef.current?.focus({ preventScroll: true });
    const frame = requestAnimationFrame(() => {
      panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  // Close on outside click / Escape. Done with a document listener instead of
  // a full-screen backdrop so the page stays scrollable while the menu is open.
  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (panelRef.current?.contains(target)) return;
      // Let the "+" button handle its own toggle instead of double-firing.
      if (target.closest('[data-add-block-toggle]')) return;
      onClose();
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);
  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    return blocksByCategory()
      .map((g) => ({
        ...g,
        blocks: g.blocks.filter((b) => {
          if (allowedTypes && !allowedTypes.includes(b.type)) return false;
          if (!q) return true;
          return (
            b.label.toLowerCase().includes(q) ||
            b.description?.toLowerCase().includes(q) ||
            b.keywords?.some((k) => k.includes(q))
          );
        }),
      }))
      .filter((g) => g.blocks.length > 0);
  }, [query, allowedTypes]);

  return (
    <motion.div
      ref={panelRef}
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className="absolute top-10 left-1/2 -translate-x-1/2 z-30 w-[440px] max-w-[92vw] max-h-[420px] flex flex-col overflow-hidden bg-card border border-border shadow-2xl rounded-xl"
    >
      {/* Fixed header — never scrolls, so nothing can slide behind it */}
      <div className="shrink-0 p-3 pb-2.5 border-b border-border/60 bg-card">
        <div className="flex items-center gap-2 bg-background border border-border rounded-lg px-3 py-2">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar bloque…"
            className="flex-1 min-w-0 bg-transparent outline-none text-sm"
          />
        </div>
      </div>

      {/* Scrollable list with its own area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 pt-2.5">
      {groups.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">Sin resultados</p>}

      {groups.map((group) => (
        <div key={group.category} className="mb-3 last:mb-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-1 mb-1.5">
            {CATEGORY_LABELS[group.category]}
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {group.blocks.map((b) => {
              const Icon = b.icon;
              return (
                <button
                  key={b.type}
                  type="button"
                  onClick={() => onPick(b.type)}
                  className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-muted text-left border border-transparent hover:border-border transition-colors"
                >
                  <div className="bg-primary/10 text-primary p-1.5 rounded-md shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-medium text-sm truncate">{b.label}</h4>
                    {b.description && <p className="text-[11px] text-muted-foreground truncate">{b.description}</p>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
      </div>
    </motion.div>
  );
}
