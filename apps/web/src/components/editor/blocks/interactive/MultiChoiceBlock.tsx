'use client';

import { useState } from 'react';
import { ListChecks, Check, X, Plus, Trash2 } from 'lucide-react';
import { defineBlock } from '../types';
import { useGradedActivity } from '@/components/learn/LessonAttempt';

export interface MultiChoiceData {
  question: string;
  options: string[];
  correctIndices: number[];
}

export const MultiChoiceBlock = defineBlock<MultiChoiceData>({
  type: 'multi-choice',
  label: 'Opción múltiple',
  description: 'Varias respuestas correctas',
  icon: ListChecks,
  category: 'interactive',
  keywords: ['opcion multiple', 'checkbox', 'varias respuestas', 'seleccion multiple'],
  isGradable: true,
  createDefault: () => ({ question: '', options: ['', ''], correctIndices: [] }),
  Editor: ({ data, onChange }) => {
    const setOpt = (i: number, v: string) => onChange({ ...data, options: data.options.map((o, idx) => (idx === i ? v : o)) });
    const toggle = (i: number) => onChange({ ...data, correctIndices: data.correctIndices.includes(i) ? data.correctIndices.filter((x) => x !== i) : [...data.correctIndices, i] });
    const add = () => onChange({ ...data, options: [...data.options, ''] });
    const del = (i: number) => data.options.length > 2 && onChange({ ...data, options: data.options.filter((_, idx) => idx !== i), correctIndices: data.correctIndices.filter((x) => x !== i).map((x) => (x > i ? x - 1 : x)) });
    return (
      <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5">
        <div className="flex items-center gap-2 mb-3 text-primary font-bold text-xs uppercase tracking-wide"><ListChecks className="w-4 h-4" /> Opción múltiple</div>
        <input value={data.question} onChange={(e) => onChange({ ...data, question: e.target.value })} placeholder="¿Cuál es la pregunta?" className="w-full text-lg font-bold bg-background border border-border rounded-xl px-4 py-3 mb-3 outline-none focus:border-primary" />
        <div className="space-y-2">
          {data.options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2 bg-background/50 rounded-lg border border-border/50 p-2">
              <button type="button" onClick={() => toggle(i)} className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${data.correctIndices.includes(i) ? 'border-green-500 bg-green-500' : 'border-border'}`} title="Marcar correcta">
                {data.correctIndices.includes(i) && <Check className="w-3 h-3 text-white" />}
              </button>
              <input value={opt} onChange={(e) => setOpt(i, e.target.value)} placeholder={`Opción ${i + 1}`} className="flex-1 bg-transparent outline-none text-sm" />
              <button type="button" onClick={() => del(i)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
        <button type="button" onClick={add} className="mt-2 text-xs flex items-center gap-1 text-primary font-semibold"><Plus className="w-3.5 h-3.5" /> Añadir opción</button>
      </div>
    );
  },
  Renderer: ({ data, blockId }) => {
    const [sel, setSel] = useState<number[]>([]);
    const [checked, setChecked] = useState(false);
    const report = useGradedActivity(blockId);
    const toggle = (i: number) => setSel((s) => (s.includes(i) ? s.filter((x) => x !== i) : [...s, i]));
    const allCorrect = () => {
      const want = [...data.correctIndices].sort().join(',');
      const got = [...sel].sort().join(',');
      return want === got;
    };
    return (
      <div className="my-6 rounded-2xl border border-primary/30 bg-primary/5 p-6">
        <p className="text-lg font-semibold text-foreground mb-1">{data.question}</p>
        <p className="text-xs text-muted-foreground mb-4">Selecciona todas las que apliquen</p>
        <div className="space-y-2">
          {data.options.map((opt, i) => {
            const shouldBe = data.correctIndices.includes(i);
            const isCorrect = checked && shouldBe;
            const isWrong = checked && sel.includes(i) && !shouldBe;
            return (
              <button key={i} disabled={checked} onClick={() => toggle(i)} className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${isCorrect ? 'border-green-500 bg-green-500/10' : isWrong ? 'border-red-500 bg-red-500/10' : sel.includes(i) ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50 bg-background/40'}`}>
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${sel.includes(i) ? 'border-primary bg-primary' : 'border-border'}`}>{sel.includes(i) && <Check className="w-3 h-3 text-primary-foreground" />}</div>
                <span className="flex-1 text-sm">{opt}</span>
                {isCorrect && <Check className="w-4 h-4 text-green-600" />}
                {isWrong && <X className="w-4 h-4 text-red-600" />}
              </button>
            );
          })}
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button disabled={sel.length === 0 || checked} onClick={() => { setChecked(true); report(allCorrect()); }} className="bg-primary text-primary-foreground font-bold text-sm px-4 py-2 rounded-lg disabled:opacity-50">Comprobar</button>
          {checked && <button onClick={() => { setChecked(false); setSel([]); }} className="text-xs font-semibold text-muted-foreground hover:text-foreground">Reintentar</button>}
        </div>
      </div>
    );
  },
});
