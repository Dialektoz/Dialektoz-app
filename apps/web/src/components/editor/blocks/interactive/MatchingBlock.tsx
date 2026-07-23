'use client';

import { useState, useMemo } from 'react';
import { ArrowLeftRight, Plus, Trash2, Check, X } from 'lucide-react';
import { defineBlock } from '../types';
import { useGradedActivity } from '@/components/learn/LessonAttempt';

interface Pair {
  left: string;
  right: string;
}
export interface MatchingData {
  prompt: string;
  pairs: Pair[];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const MatchingBlock = defineBlock<MatchingData>({
  type: 'matching',
  label: 'Emparejamiento',
  description: 'Une elementos de dos columnas',
  icon: ArrowLeftRight,
  category: 'interactive',
  keywords: ['emparejar', 'matching', 'unir', 'relacionar', 'columnas'],
  isGradable: true,
  createDefault: () => ({ prompt: '', pairs: [{ left: '', right: '' }, { left: '', right: '' }] }),
  Editor: ({ data, onChange }) => {
    const setPair = (i: number, patch: Partial<Pair>) => onChange({ ...data, pairs: data.pairs.map((p, idx) => (idx === i ? { ...p, ...patch } : p)) });
    return (
      <div className="rounded-2xl border border-secondary/30 bg-secondary/5 p-5">
        <div className="flex items-center gap-2 mb-3 text-secondary font-bold text-xs uppercase tracking-wide"><ArrowLeftRight className="w-4 h-4" /> Emparejamiento</div>
        <input value={data.prompt} onChange={(e) => onChange({ ...data, prompt: e.target.value })} placeholder="Instrucción (ej: Une cada palabra con su traducción)" className="w-full font-semibold bg-background border border-border rounded-xl px-4 py-3 mb-3 outline-none focus:border-secondary" />
        <div className="space-y-2">
          {data.pairs.map((p, i) => (
            <div key={i} className="flex items-center gap-2">
              <input value={p.left} onChange={(e) => setPair(i, { left: e.target.value })} placeholder="Izquierda" className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-secondary" />
              <ArrowLeftRight className="w-4 h-4 text-muted-foreground shrink-0" />
              <input value={p.right} onChange={(e) => setPair(i, { right: e.target.value })} placeholder="Derecha" className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-secondary" />
              <button type="button" onClick={() => data.pairs.length > 2 && onChange({ ...data, pairs: data.pairs.filter((_, idx) => idx !== i) })} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
        <button type="button" onClick={() => onChange({ ...data, pairs: [...data.pairs, { left: '', right: '' }] })} className="mt-2 text-xs flex items-center gap-1 text-secondary font-semibold"><Plus className="w-3.5 h-3.5" /> Añadir par</button>
      </div>
    );
  },
  Renderer: ({ data, blockId }) => {
    const rights = useMemo(() => shuffle(data.pairs.map((p) => p.right)), [data.pairs]);
    const [picks, setPicks] = useState<Record<number, string>>({});
    const [checked, setChecked] = useState(false);
    const report = useGradedActivity(blockId);

    return (
      <div className="my-6 rounded-2xl border border-secondary/30 bg-secondary/5 p-6">
        {data.prompt && <p className="text-lg font-semibold text-foreground mb-4">{data.prompt}</p>}
        <div className="space-y-2">
          {data.pairs.map((p, i) => {
            const ok = checked && picks[i] === p.right;
            const bad = checked && picks[i] !== p.right;
            return (
              <div key={i} className="flex items-center gap-3">
                <div className="flex-1 p-3 rounded-lg border border-border bg-background/60 text-sm font-medium text-foreground">{p.left}</div>
                <ArrowLeftRight className="w-4 h-4 text-muted-foreground shrink-0" />
                <select
                  value={picks[i] ?? ''}
                  disabled={checked}
                  onChange={(e) => setPicks({ ...picks, [i]: e.target.value })}
                  className={`flex-1 p-3 rounded-lg border bg-background text-sm outline-none ${ok ? 'border-green-500 text-green-600' : bad ? 'border-red-500 text-red-600' : 'border-border focus:border-secondary'}`}
                >
                  <option value="" disabled>Selecciona…</option>
                  {rights.map((r, idx) => <option key={idx} value={r}>{r}</option>)}
                </select>
                {ok && <Check className="w-4 h-4 text-green-600 shrink-0" />}
                {bad && <X className="w-4 h-4 text-red-600 shrink-0" />}
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button disabled={checked || Object.keys(picks).length < data.pairs.length} onClick={() => { setChecked(true); report(data.pairs.every((p, i) => picks[i] === p.right)); }} className="bg-secondary text-secondary-foreground font-bold text-sm px-4 py-2 rounded-lg disabled:opacity-50">Comprobar</button>
          {checked && <button onClick={() => { setChecked(false); setPicks({}); }} className="text-xs font-semibold text-muted-foreground hover:text-foreground">Reintentar</button>}
        </div>
      </div>
    );
  },
});
