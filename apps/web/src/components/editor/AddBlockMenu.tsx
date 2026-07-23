'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { blocksByCategory } from './blocks/registry';
import { CATEGORY_LABELS } from './blocks/types';

interface AddBlockMenuProps {
  onPick: (type: string) => void;
}

export function AddBlockMenu({ onPick }: AddBlockMenuProps) {
  const [query, setQuery] = useState('');
  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return blocksByCategory();
    return blocksByCategory()
      .map((g) => ({
        ...g,
        blocks: g.blocks.filter(
          (b) =>
            b.label.toLowerCase().includes(q) ||
            b.description?.toLowerCase().includes(q) ||
            b.keywords?.some((k) => k.includes(q))
        ),
      }))
      .filter((g) => g.blocks.length > 0);
  }, [query]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className="absolute top-10 left-1/2 -translate-x-1/2 z-30 w-[440px] max-w-[92vw] max-h-[420px] overflow-y-auto bg-card border border-border shadow-2xl rounded-xl p-3"
    >
      <div className="flex items-center gap-2 bg-background border border-border rounded-lg px-3 py-2 mb-3 sticky top-0">
        <Search className="w-4 h-4 text-muted-foreground" />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar bloque…"
          className="flex-1 bg-transparent outline-none text-sm"
        />
      </div>

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
    </motion.div>
  );
}
