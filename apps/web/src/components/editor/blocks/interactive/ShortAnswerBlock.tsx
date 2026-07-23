'use client';

import { useState } from 'react';
import { MessageSquare, Plus, Trash2, Check } from 'lucide-react';
import { defineBlock } from '../types';
import { useGradedActivity } from '@/components/learn/LessonAttempt';

export interface ShortAnswerData {
  question: string;
  answers: string[];
  caseSensitive: boolean;
}

export const ShortAnswerBlock = defineBlock<ShortAnswerData>({
  type: 'short-answer',
  label: 'Respuesta corta',
  description: 'El alumno escribe la respuesta',
  icon: MessageSquare,
  category: 'interactive',
  keywords: ['respuesta corta', 'short answer', 'texto', 'escribir'],
  isGradable: true,
  createDefault: () => ({ question: '', answers: [''], caseSensitive: false }),
  Editor: ({ data, onChange }) => {
    const setAns = (i: number, v: string) => onChange({ ...data, answers: data.answers.map((a, idx) => (idx === i ? v : a)) });
    return (
      <div className="rounded-2xl border border-secondary/30 bg-secondary/5 p-5">
        <div className="flex items-center gap-2 mb-3 text-secondary font-bold text-xs uppercase tracking-wide"><MessageSquare className="w-4 h-4" /> Respuesta corta</div>
        <input value={data.question} onChange={(e) => onChange({ ...data, question: e.target.value })} placeholder="¿Cuál es la pregunta?" className="w-full text-lg font-bold bg-background border border-border rounded-xl px-4 py-3 mb-3 outline-none focus:border-secondary" />
        <p className="text-xs text-muted-foreground mb-2">Respuestas aceptadas (cualquiera cuenta como correcta):</p>
        <div className="space-y-2">
          {data.answers.map((a, i) => (
            <div key={i} className="flex items-center gap-2">
              <input value={a} onChange={(e) => setAns(i, e.target.value)} placeholder={`Respuesta ${i + 1}`} className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-secondary" />
              <button type="button" onClick={() => data.answers.length > 1 && onChange({ ...data, answers: data.answers.filter((_, idx) => idx !== i) })} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between mt-2">
          <button type="button" onClick={() => onChange({ ...data, answers: [...data.answers, ''] })} className="text-xs flex items-center gap-1 text-secondary font-semibold"><Plus className="w-3.5 h-3.5" /> Añadir alternativa</button>
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground"><input type="checkbox" checked={data.caseSensitive} onChange={(e) => onChange({ ...data, caseSensitive: e.target.checked })} className="accent-secondary" /> Distinguir mayúsculas</label>
        </div>
      </div>
    );
  },
  Renderer: ({ data, blockId }) => {
    const [value, setValue] = useState('');
    const [checked, setChecked] = useState(false);
    const report = useGradedActivity(blockId);
    const norm = (s: string) => (data.caseSensitive ? s.trim() : s.trim().toLowerCase());
    const ok = checked && data.answers.some((a) => norm(a) === norm(value));
    return (
      <div className="my-6 rounded-2xl border border-secondary/30 bg-secondary/5 p-6">
        <p className="text-lg font-semibold text-foreground mb-4">{data.question}</p>
        <input value={value} onChange={(e) => setValue(e.target.value)} disabled={checked && ok} placeholder="Tu respuesta…" className={`w-full bg-background border-2 rounded-xl px-4 py-3 outline-none transition-colors ${checked ? (ok ? 'border-green-500 text-green-600' : 'border-red-500 text-red-600') : 'border-border focus:border-secondary'}`} />
        <div className="mt-4 flex items-center gap-3">
          <button disabled={!value || (checked && ok)} onClick={() => { setChecked(true); report(data.answers.some((a) => norm(a) === norm(value))); }} className="bg-secondary text-secondary-foreground font-bold text-sm px-4 py-2 rounded-lg disabled:opacity-50">Comprobar</button>
          {checked && !ok && <button onClick={() => setChecked(false)} className="text-xs font-semibold text-muted-foreground hover:text-foreground">Reintentar</button>}
          {ok && <span className="text-sm font-semibold text-green-600 flex items-center gap-1"><Check className="w-4 h-4" /> ¡Correcto!</span>}
          {checked && !ok && <span className="text-sm font-semibold text-red-600">Intenta de nuevo</span>}
        </div>
      </div>
    );
  },
});
