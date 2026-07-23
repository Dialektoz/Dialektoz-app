'use client';

import { useState, useMemo } from 'react';
import { Boxes, Plus, Trash2, Check, X } from 'lucide-react';
import { defineBlock } from '../types';
import { useGradedActivity } from '@/components/learn/LessonAttempt';

interface Category {
  name: string;
  items: string[];
}
export interface ClassificationData {
  prompt: string;
  categories: Category[];
}

interface Token {
  id: string;
  label: string;
  correct: number; // category index it belongs to
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const ClassificationBlock = defineBlock<ClassificationData>({
  type: 'classification',
  label: 'Clasificación (arrastrar)',
  description: 'Arrastra elementos a categorías',
  icon: Boxes,
  category: 'interactive',
  keywords: ['clasificacion', 'clasificar', 'arrastrar', 'drag drop', 'categorias', 'agrupar'],
  isGradable: true,
  createDefault: () => ({ prompt: '', categories: [{ name: 'Categoría A', items: [''] }, { name: 'Categoría B', items: [''] }] }),
  Editor: ({ data, onChange }) => {
    const setCat = (i: number, patch: Partial<Category>) => onChange({ ...data, categories: data.categories.map((c, idx) => (idx === i ? { ...c, ...patch } : c)) });
    const setItem = (ci: number, ii: number, v: string) => setCat(ci, { items: data.categories[ci].items.map((it, idx) => (idx === ii ? v : it)) });
    return (
      <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5">
        <div className="flex items-center gap-2 mb-3 text-primary font-bold text-xs uppercase tracking-wide"><Boxes className="w-4 h-4" /> Clasificación</div>
        <input value={data.prompt} onChange={(e) => onChange({ ...data, prompt: e.target.value })} placeholder="Instrucción (ej: Clasifica cada palabra)" className="w-full font-semibold bg-background border border-border rounded-xl px-4 py-3 mb-3 outline-none focus:border-primary" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {data.categories.map((cat, ci) => (
            <div key={ci} className="rounded-lg border border-border bg-background p-3">
              <div className="flex items-center gap-2 mb-2">
                <input value={cat.name} onChange={(e) => setCat(ci, { name: e.target.value })} placeholder="Nombre de la categoría" className="flex-1 font-bold bg-transparent outline-none border-b border-border/50 focus:border-primary" />
                <button type="button" onClick={() => data.categories.length > 2 && onChange({ ...data, categories: data.categories.filter((_, idx) => idx !== ci) })} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
              </div>
              <div className="space-y-1.5">
                {cat.items.map((it, ii) => (
                  <div key={ii} className="flex items-center gap-1.5">
                    <input value={it} onChange={(e) => setItem(ci, ii, e.target.value)} placeholder={`Elemento ${ii + 1}`} className="flex-1 bg-muted/40 border border-border rounded px-2 py-1 text-sm outline-none focus:border-primary" />
                    <button type="button" onClick={() => cat.items.length > 1 && setCat(ci, { items: cat.items.filter((_, idx) => idx !== ii) })} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
                <button type="button" onClick={() => setCat(ci, { items: [...cat.items, ''] })} className="text-[11px] flex items-center gap-1 text-primary font-semibold"><Plus className="w-3 h-3" /> Elemento</button>
              </div>
            </div>
          ))}
        </div>
        <button type="button" onClick={() => onChange({ ...data, categories: [...data.categories, { name: `Categoría ${data.categories.length + 1}`, items: [''] }] })} className="mt-3 text-xs flex items-center gap-1 text-primary font-semibold"><Plus className="w-3.5 h-3.5" /> Añadir categoría</button>
      </div>
    );
  },
  Renderer: ({ data, blockId }) => {
    const report = useGradedActivity(blockId);
    const tokens: Token[] = useMemo(() => {
      const list: Token[] = [];
      data.categories.forEach((c, ci) => c.items.forEach((label, ii) => label.trim() && list.push({ id: `${ci}-${ii}`, label, correct: ci })));
      return shuffle(list);
    }, [data.categories]);

    // placement: token id -> category index, or -1 for the pool
    const [placement, setPlacement] = useState<Record<string, number>>(() => Object.fromEntries(tokens.map((t) => [t.id, -1])));
    const [checked, setChecked] = useState(false);
    const [dragId, setDragId] = useState<string | null>(null);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const place = (id: string, cat: number) => setPlacement((p) => ({ ...p, [id]: cat }));

    // Tap-to-place: tap a token to pick it up, then tap a category.
    const clickToken = (id: string) => {
      if (checked) return;
      setSelectedId((s) => (s === id ? null : id));
    };
    const clickZone = (cat: number) => {
      if (checked || !selectedId) return;
      place(selectedId, cat);
      setSelectedId(null);
    };
    // Drag-and-drop (desktop) still works.
    const dropZone = (cat: number) => {
      if (dragId) place(dragId, cat);
      setDragId(null);
      setSelectedId(null);
    };

    const TokenChip = ({ t }: { t: Token }) => {
      const ok = checked && placement[t.id] === t.correct;
      const bad = checked && placement[t.id] !== -1 && placement[t.id] !== t.correct;
      const selected = selectedId === t.id;
      return (
        <button
          type="button"
          draggable={!checked}
          onDragStart={() => setDragId(t.id)}
          onDragEnd={() => setDragId(null)}
          onClick={(e) => { e.stopPropagation(); clickToken(t.id); }}
          className={`px-3 py-1.5 rounded-lg border text-sm font-medium select-none transition-colors ${checked ? '' : 'cursor-pointer active:cursor-grabbing'} ${
            ok ? 'border-green-500 bg-green-500/10 text-green-700'
              : bad ? 'border-red-500 bg-red-500/10 text-red-700'
              : selected ? 'border-primary bg-primary/15 text-primary ring-2 ring-primary/40'
              : 'border-border bg-background hover:border-primary/50'
          }`}
        >
          {t.label}
          {ok && <Check className="w-3.5 h-3.5 inline ml-1" />}
          {bad && <X className="w-3.5 h-3.5 inline ml-1" />}
        </button>
      );
    };

    const pool = tokens.filter((t) => placement[t.id] === -1);
    const picking = !!selectedId && !checked;

    return (
      <div className="my-6 rounded-2xl border border-primary/30 bg-primary/5 p-6">
        {data.prompt && <p className="text-lg font-semibold text-foreground mb-1">{data.prompt}</p>}
        {!checked && (
          <p className="text-xs text-muted-foreground mb-4">
            {picking ? 'Ahora toca la categoría donde va este elemento.' : 'Toca un elemento y luego su categoría (o arrástralo).'}
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          {data.categories.map((cat, ci) => (
            <div
              key={ci}
              onClick={() => clickZone(ci)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => dropZone(ci)}
              className={`rounded-xl border-2 border-dashed p-3 min-h-[90px] transition-colors ${picking ? 'border-primary/60 bg-primary/5 cursor-pointer' : 'border-border bg-background/40'}`}
            >
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">{cat.name}</p>
              <div className="flex flex-wrap gap-2">
                {tokens.filter((t) => placement[t.id] === ci).map((t) => <TokenChip key={t.id} t={t} />)}
              </div>
            </div>
          ))}
        </div>

        <div
          onClick={() => clickZone(-1)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => dropZone(-1)}
          className={`rounded-xl border p-3 min-h-[56px] transition-colors ${picking ? 'border-primary/40 cursor-pointer' : 'border-border bg-muted/20'}`}
        >
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Elementos por clasificar</p>
          <div className="flex flex-wrap gap-2">
            {pool.map((t) => <TokenChip key={t.id} t={t} />)}
            {pool.length === 0 && <span className="text-xs text-muted-foreground italic">Todo clasificado</span>}
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button disabled={checked || pool.length > 0} onClick={() => { setChecked(true); report(tokens.every((t) => placement[t.id] === t.correct)); }} className="bg-primary text-primary-foreground font-bold text-sm px-4 py-2 rounded-lg disabled:opacity-50">Comprobar</button>
          {checked && <button onClick={() => { setChecked(false); setSelectedId(null); setPlacement(Object.fromEntries(tokens.map((t) => [t.id, -1]))); }} className="text-xs font-semibold text-muted-foreground hover:text-foreground">Reintentar</button>}
        </div>
      </div>
    );
  },
});
