'use client';

import { useState } from 'react';
import { ArrowUpDown, Plus, Trash2, GripVertical, Check, X, ChevronUp, ChevronDown } from 'lucide-react';
import { defineBlock } from '../types';
import { useGradedActivity } from '@/components/learn/LessonAttempt';

export interface OrderingData {
  prompt: string;
  /** Items stored in their CORRECT order. */
  items: string[];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const OrderingBlock = defineBlock<OrderingData>({
  type: 'ordering',
  label: 'Ordenar elementos',
  description: 'El alumno reordena la secuencia',
  icon: ArrowUpDown,
  category: 'interactive',
  keywords: ['ordenar', 'ordering', 'secuencia', 'ordena', 'reordenar'],
  isGradable: true,
  createDefault: () => ({ prompt: '', items: ['', ''] }),
  Editor: ({ data, onChange }) => {
    const setItem = (i: number, v: string) => onChange({ ...data, items: data.items.map((it, idx) => (idx === i ? v : it)) });
    const move = (i: number, dir: -1 | 1) => {
      const t = i + dir;
      if (t < 0 || t >= data.items.length) return;
      const items = [...data.items];
      [items[i], items[t]] = [items[t], items[i]];
      onChange({ ...data, items });
    };
    return (
      <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5">
        <div className="flex items-center gap-2 mb-3 text-primary font-bold text-xs uppercase tracking-wide"><ArrowUpDown className="w-4 h-4" /> Ordenar elementos</div>
        <input value={data.prompt} onChange={(e) => onChange({ ...data, prompt: e.target.value })} placeholder="Instrucción (ej: Ordena los pasos)" className="w-full font-semibold bg-background border border-border rounded-xl px-4 py-3 mb-3 outline-none focus:border-primary" />
        <p className="text-xs text-muted-foreground mb-2">Escribe los elementos en el <b>orden correcto</b> (se mostrarán mezclados al alumno):</p>
        <div className="space-y-2">
          {data.items.map((it, i) => (
            <div key={i} className="flex items-center gap-2 bg-background/50 rounded-lg border border-border/50 p-2">
              <span className="text-xs font-bold text-muted-foreground w-5 text-center">{i + 1}</span>
              <input value={it} onChange={(e) => setItem(i, e.target.value)} placeholder={`Elemento ${i + 1}`} className="flex-1 bg-transparent outline-none text-sm" />
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-30 text-xs">▲</button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === data.items.length - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-30 text-xs">▼</button>
              <button type="button" onClick={() => data.items.length > 2 && onChange({ ...data, items: data.items.filter((_, idx) => idx !== i) })} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
        <button type="button" onClick={() => onChange({ ...data, items: [...data.items, ''] })} className="mt-2 text-xs flex items-center gap-1 text-primary font-semibold"><Plus className="w-3.5 h-3.5" /> Añadir elemento</button>
      </div>
    );
  },
  Renderer: ({ data, blockId }) => {
    const correct = data.items;
    const [order, setOrder] = useState<string[]>(() => {
      const s = shuffle(correct);
      // avoid starting already-solved
      return s.every((v, i) => v === correct[i]) && correct.length > 1 ? shuffle(correct) : s;
    });
    const [checked, setChecked] = useState(false);
    const [dragIdx, setDragIdx] = useState<number | null>(null);
    const report = useGradedActivity(blockId);

    const reorder = (from: number, to: number) => {
      if (from === to) return;
      const next = [...order];
      const [m] = next.splice(from, 1);
      next.splice(to, 0, m);
      setOrder(next);
    };

    return (
      <div className="my-6 rounded-2xl border border-primary/30 bg-primary/5 p-6">
        {data.prompt && <p className="text-lg font-semibold text-foreground mb-1">{data.prompt}</p>}
        {!checked && <p className="text-xs text-muted-foreground mb-4">Usa las flechas para ordenar (o arrastra).</p>}
        <div className="space-y-2">
          {order.map((item, i) => {
            const ok = checked && item === correct[i];
            const bad = checked && item !== correct[i];
            return (
              <div
                key={item + i}
                draggable={!checked}
                onDragStart={() => setDragIdx(i)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => { if (dragIdx !== null) reorder(dragIdx, i); setDragIdx(null); }}
                className={`flex items-center gap-3 p-3 rounded-lg border bg-background/60 transition-colors ${ok ? 'border-green-500 bg-green-500/10' : bad ? 'border-red-500 bg-red-500/10' : 'border-border md:cursor-grab md:active:cursor-grabbing hover:border-primary/50'}`}
              >
                <span className="text-xs font-bold text-muted-foreground w-5 text-center shrink-0">{i + 1}</span>
                <span className="flex-1 text-sm text-foreground">{item}</span>
                {ok && <Check className="w-4 h-4 text-green-600" />}
                {bad && <X className="w-4 h-4 text-red-600" />}
                {!checked && (
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button type="button" onClick={() => reorder(i, i - 1)} disabled={i === 0} className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30" aria-label="Subir">
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={() => reorder(i, i + 1)} disabled={i === order.length - 1} className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30" aria-label="Bajar">
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <GripVertical className="hidden md:block w-4 h-4 text-muted-foreground/60 ml-0.5" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button disabled={checked} onClick={() => { setChecked(true); report(order.every((v, i) => v === correct[i])); }} className="bg-primary text-primary-foreground font-bold text-sm px-4 py-2 rounded-lg disabled:opacity-50">Comprobar</button>
          {checked && <button onClick={() => { setChecked(false); setOrder(shuffle(correct)); }} className="text-xs font-semibold text-muted-foreground hover:text-foreground">Reintentar</button>}
        </div>
      </div>
    );
  },
});
