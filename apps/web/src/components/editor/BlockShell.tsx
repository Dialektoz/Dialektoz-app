'use client';

import { useState } from 'react';
import { GripVertical, Copy, Trash2, ChevronUp, ChevronDown, MoreVertical } from 'lucide-react';

interface BlockShellProps {
  label: string;
  index: number;
  total: number;
  onDuplicate: () => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  /** Called with `true` while the drag handle is held, to enable row dragging. */
  onHandleHold: (holding: boolean) => void;
  children: React.ReactNode;
}

export function BlockShell({
  label,
  index,
  total,
  onDuplicate,
  onRemove,
  onMoveUp,
  onMoveDown,
  onHandleHold,
  children,
}: BlockShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="relative group rounded-xl transition-colors hover:bg-muted/20">
      <div className="flex items-start gap-2">
        {/* Left rail: drag handle + reorder */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center gap-0.5 pt-2 shrink-0 w-7">
          <button
            type="button"
            title="Arrastrar para reordenar"
            onMouseDown={() => onHandleHold(true)}
            onMouseUp={() => onHandleHold(false)}
            onMouseLeave={() => onHandleHold(false)}
            className="p-1 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="w-4 h-4" />
          </button>
          <button type="button" onClick={onMoveUp} disabled={index === 0} className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30">
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <button type="button" onClick={onMoveDown} disabled={index === total - 1} className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30">
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Block content */}
        <div className="flex-1 min-w-0 py-1">{children}</div>

        {/* Right rail: actions */}
        <div className="relative opacity-0 group-hover:opacity-100 transition-opacity pt-2 shrink-0">
          <button type="button" onClick={() => setMenuOpen((o) => !o)} className="p-1 text-muted-foreground hover:text-foreground rounded" aria-label="Acciones del bloque">
            <MoreVertical className="w-4 h-4" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-8 z-20 w-40 bg-card border border-border rounded-lg shadow-xl py-1 text-sm">
                <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border/50">{label}</div>
                <button type="button" onClick={() => { onDuplicate(); setMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted text-left">
                  <Copy className="w-4 h-4" /> Duplicar
                </button>
                <button type="button" onClick={() => { onRemove(); setMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 hover:bg-destructive/10 text-destructive text-left">
                  <Trash2 className="w-4 h-4" /> Eliminar
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
