'use client';

import { useState } from 'react';
import { PenLine } from 'lucide-react';
import { defineBlock } from '../types';
import { useGradedActivity } from '@/components/learn/LessonAttempt';

export interface FillBlankData {
  text: string;
}

const split = (text: string) => (text || '').split(/(\{\{.*?\}\})/);
const isBlank = (p: string) => p.startsWith('{{') && p.endsWith('}}');

export const FillBlankBlock = defineBlock<FillBlankData>({
  type: 'fill-blank',
  label: 'Completar espacios',
  description: 'Huecos con {{respuesta}}',
  icon: PenLine,
  category: 'interactive',
  keywords: ['completar', 'fill blank', 'huecos', 'espacios', 'rellenar'],
  isGradable: true,
  createDefault: () => ({ text: '' }),
  Editor: ({ data, onChange }) => (
    <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5">
      <div className="flex items-center gap-2 mb-2 text-primary font-bold text-xs uppercase tracking-wide"><PenLine className="w-4 h-4" /> Completar espacios</div>
      <p className="text-xs text-muted-foreground mb-3">Usa <code className="bg-primary/20 text-primary px-1.5 py-0.5 rounded font-bold">{'{{respuesta}}'}</code> para crear un hueco.</p>
      <textarea rows={2} value={data.text} onChange={(e) => onChange({ text: e.target.value })} placeholder="Ej: The cat is {{on}} the table." className="w-full text-lg bg-background border border-border rounded-xl px-4 py-3 outline-none focus:border-primary resize-none font-medium" />
      <div className="mt-3 flex flex-wrap items-center gap-2 p-3 bg-background/50 rounded-lg border border-border/40">
        <span className="text-[10px] font-bold text-muted-foreground uppercase">Vista previa:</span>
        {split(data.text).map((p, i) => isBlank(p) ? <span key={i} className="inline-block px-3 py-1 bg-primary/10 border-b-2 border-primary text-primary rounded-sm min-w-[50px] text-center">…</span> : <span key={i}>{p}</span>)}
      </div>
    </div>
  ),
  Renderer: ({ data, blockId }) => {
    const parts = split(data.text);
    const answers = parts.filter(isBlank).map((p) => p.slice(2, -2));
    const [values, setValues] = useState<string[]>(answers.map(() => ''));
    const [checked, setChecked] = useState(false);
    const report = useGradedActivity(blockId);
    let bi = -1;
    return (
      <div className="my-6 rounded-2xl border border-primary/30 bg-primary/5 p-6">
        <div className="flex flex-wrap items-center gap-2 text-lg font-medium text-foreground">
          {parts.map((part, i) => {
            if (!isBlank(part)) return <span key={i}>{part}</span>;
            bi++;
            const idx = bi;
            const ok = checked && values[idx].trim().toLowerCase() === answers[idx].trim().toLowerCase();
            const bad = checked && !ok;
            return (
              <input key={i} value={values[idx]} onChange={(e) => { const n = [...values]; n[idx] = e.target.value; setValues(n); }} disabled={checked && ok} className={`inline-block min-w-[100px] px-3 py-1 border-b-2 bg-background/50 rounded-sm text-center outline-none transition-colors ${ok ? 'border-green-500 text-green-600' : bad ? 'border-red-500 text-red-600' : 'border-primary text-primary'}`} />
            );
          })}
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button onClick={() => { setChecked(true); report(answers.every((a, i) => values[i].trim().toLowerCase() === a.trim().toLowerCase())); }} className="bg-primary text-primary-foreground font-bold text-sm px-4 py-2 rounded-lg">Comprobar</button>
          {checked && <button onClick={() => { setChecked(false); setValues(answers.map(() => '')); }} className="text-xs font-semibold text-muted-foreground hover:text-foreground">Reintentar</button>}
        </div>
      </div>
    );
  },
});
