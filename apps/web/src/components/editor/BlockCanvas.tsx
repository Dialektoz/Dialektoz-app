'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { AddBlockMenu } from './AddBlockMenu';
import { BlockShell } from './BlockShell';
import { getBlock, createBlock } from './blocks/registry';
import type { BlockInstance } from './blocks/types';

interface BlockCanvasProps {
  blocks: BlockInstance[];
  onChange: (blocks: BlockInstance[]) => void;
  /** Tighter layout for use inside container blocks. */
  nested?: boolean;
  /** Text for the empty-state button. */
  emptyLabel?: string;
}

/**
 * Controlled editing surface for a list of blocks. Used both at the top
 * level (via LessonBuilder) and recursively inside container blocks
 * (columns, sections), which is what enables nested layouts.
 */
export function BlockCanvas({ blocks, onChange, nested = false, emptyLabel = 'Añadir bloque' }: BlockCanvasProps) {
  const [addMenuIndex, setAddMenuIndex] = useState<number | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [dragHandleId, setDragHandleId] = useState<string | null>(null);

  const addBlock = (index: number, type: string) => {
    const next = [...blocks];
    next.splice(index + 1, 0, createBlock(type));
    onChange(next);
    setAddMenuIndex(null);
  };
  const updateData = (id: string, data: unknown) => onChange(blocks.map((b) => (b.id === id ? { ...b, data } : b)));
  const duplicate = (index: number) => {
    const next = [...blocks];
    next.splice(index + 1, 0, { ...blocks[index], id: crypto.randomUUID() });
    onChange(next);
  };
  const remove = (id: string) => onChange(blocks.filter((b) => b.id !== id));
  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= blocks.length) return;
    const next = [...blocks];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };
  const reorder = (from: number, to: number) => {
    if (from === to || from < 0) return;
    const next = [...blocks];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  };

  return (
    <div className={nested ? 'w-full' : 'w-full max-w-4xl mx-auto py-4'}>
      {blocks.map((block, index) => {
        const def = getBlock(block.type);
        const isDragging = dragId === block.id;
        return (
          <div key={block.id}>
            <div
              draggable={dragHandleId === block.id}
              onDragStart={(e) => { e.stopPropagation(); setDragId(block.id); }}
              onDragEnd={(e) => { e.stopPropagation(); setDragId(null); setOverIndex(null); setDragHandleId(null); }}
              onDragOver={(e) => {
                if (!dragId) return;
                e.preventDefault();
                e.stopPropagation();
                if (dragId !== block.id) setOverIndex(index);
              }}
              onDrop={(e) => {
                if (!dragId) return;
                e.preventDefault();
                e.stopPropagation();
                reorder(blocks.findIndex((b) => b.id === dragId), index);
                setOverIndex(null);
              }}
              className={`transition-opacity ${isDragging ? 'opacity-40' : ''} ${overIndex === index && dragId ? 'border-t-2 border-primary' : 'border-t-2 border-transparent'}`}
            >
              <BlockShell
                label={def?.label ?? block.type}
                index={index}
                total={blocks.length}
                onDuplicate={() => duplicate(index)}
                onRemove={() => remove(block.id)}
                onMoveUp={() => move(index, -1)}
                onMoveDown={() => move(index, 1)}
                onHandleHold={(holding) => setDragHandleId(holding ? block.id : null)}
              >
                {def ? (
                  <def.Editor data={block.data} onChange={(data) => updateData(block.id, data)} />
                ) : (
                  <div className="p-4 rounded-lg border border-dashed border-destructive/50 text-sm text-muted-foreground">
                    Bloque desconocido: <code>{block.type}</code>
                  </div>
                )}
              </BlockShell>
            </div>

            <div className="relative h-8 flex items-center justify-center group/gap">
              <div className="absolute inset-x-8 border-t border-dashed border-primary/20 opacity-0 group-hover/gap:opacity-100 transition-opacity" />
              <button
                type="button"
                onClick={() => setAddMenuIndex(addMenuIndex === index ? null : index)}
                className="relative z-10 w-7 h-7 rounded-full bg-background border border-primary/60 text-primary flex items-center justify-center opacity-0 group-hover/gap:opacity-100 hover:scale-110 hover:bg-primary hover:text-primary-foreground transition-all shadow-sm"
                aria-label="Añadir bloque"
              >
                <Plus className="w-4 h-4" />
              </button>
              <AnimatePresence>
                {addMenuIndex === index && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setAddMenuIndex(null)} />
                    <AddBlockMenu onPick={(type) => addBlock(index, type)} />
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        );
      })}

      {blocks.length === 0 && (
        <div className="relative">
          <button
            type="button"
            onClick={() => setAddMenuIndex(addMenuIndex === -1 ? null : -1)}
            className={`w-full ${nested ? 'py-5' : 'py-8'} rounded-xl border-2 border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2`}
          >
            <Plus className="w-5 h-5" /> {emptyLabel}
          </button>
          <AnimatePresence>
            {addMenuIndex === -1 && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setAddMenuIndex(null)} />
                <AddBlockMenu onPick={(type) => addBlock(-1, type)} />
              </>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
