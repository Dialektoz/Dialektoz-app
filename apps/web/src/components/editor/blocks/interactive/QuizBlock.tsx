'use client';

import { useState } from 'react';
import { HelpCircle, Check, X, Plus, Trash2 } from 'lucide-react';
import { defineBlock } from '../types';
import { useGradedActivity } from '@/components/learn/LessonAttempt';

export interface QuizData {
  question: string;
  options: string[];
  correctIndex: number;
  feedback?: string;
}

export const QuizBlock = defineBlock<QuizData>({
  type: 'quiz',
  label: 'Opción única',
  description: 'Pregunta de selección simple',
  icon: HelpCircle,
  category: 'interactive',
  keywords: ['quiz', 'pregunta', 'opcion multiple', 'test', 'seleccion'],
  isGradable: true,
  createDefault: () => ({ question: '', options: ['', ''], correctIndex: 0 }),
  Editor: ({ data, onChange }) => {
    const setOpt = (i: number, v: string) => onChange({ ...data, options: data.options.map((o, idx) => (idx === i ? v : o)) });
    const add = () => onChange({ ...data, options: [...data.options, ''] });
    const del = (i: number) =>
      data.options.length > 2 &&
      onChange({ ...data, options: data.options.filter((_, idx) => idx !== i), correctIndex: Math.max(0, data.correctIndex >= i ? data.correctIndex - 1 : data.correctIndex) });
    return (
      <div className="rounded-2xl border border-secondary/30 bg-secondary/5 p-5">
        <div className="flex items-center gap-2 mb-3 text-secondary font-bold text-xs uppercase tracking-wide"><HelpCircle className="w-4 h-4" /> Opción única</div>
        <input value={data.question} onChange={(e) => onChange({ ...data, question: e.target.value })} placeholder="¿Cuál es la pregunta?" className="w-full text-lg font-bold bg-background border border-border rounded-xl px-4 py-3 mb-3 outline-none focus:border-secondary" />
        <div className="space-y-2">
          {data.options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2 bg-background/50 rounded-lg border border-border/50 p-2">
              <button type="button" onClick={() => onChange({ ...data, correctIndex: i })} className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${data.correctIndex === i ? 'border-green-500 bg-green-500' : 'border-border'}`} title="Marcar correcta">
                {data.correctIndex === i && <Check className="w-3 h-3 text-white" />}
              </button>
              <input value={opt} onChange={(e) => setOpt(i, e.target.value)} placeholder={`Opción ${i + 1}`} className="flex-1 bg-transparent outline-none text-sm" />
              <button type="button" onClick={() => del(i)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
        <button type="button" onClick={add} className="mt-2 text-xs flex items-center gap-1 text-secondary font-semibold"><Plus className="w-3.5 h-3.5" /> Añadir opción</button>
        <input value={data.feedback ?? ''} onChange={(e) => onChange({ ...data, feedback: e.target.value })} placeholder="Retroalimentación al responder (opcional)" className="w-full mt-3 text-sm bg-background border border-border rounded-lg px-3 py-2 outline-none focus:border-secondary" />
      </div>
    );
  },
  Renderer: ({ data, blockId }) => {
    const [selected, setSelected] = useState<number | null>(null);
    const [checked, setChecked] = useState(false);
    const report = useGradedActivity(blockId);
    return (
      <div className="my-6 rounded-2xl border border-secondary/30 bg-secondary/5 p-6">
        <p className="text-lg font-semibold text-foreground mb-4">{data.question}</p>
        <div className="space-y-2">
          {data.options.map((opt, i) => {
            const isCorrect = checked && i === data.correctIndex;
            const isWrong = checked && selected === i && i !== data.correctIndex;
            return (
              <button key={i} disabled={checked} onClick={() => setSelected(i)} className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${isCorrect ? 'border-green-500 bg-green-500/10' : isWrong ? 'border-red-500 bg-red-500/10' : selected === i ? 'border-secondary bg-secondary/10' : 'border-border hover:border-secondary/50 bg-background/40'}`}>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selected === i ? 'border-secondary' : 'border-border'}`}>{selected === i && <div className="w-2 h-2 bg-secondary rounded-full" />}</div>
                <span className="flex-1 text-sm">{opt}</span>
                {isCorrect && <Check className="w-4 h-4 text-green-600" />}
                {isWrong && <X className="w-4 h-4 text-red-600" />}
              </button>
            );
          })}
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button disabled={selected === null || checked} onClick={() => { setChecked(true); report(selected === data.correctIndex); }} className="bg-secondary text-secondary-foreground font-bold text-sm px-4 py-2 rounded-lg disabled:opacity-50">Comprobar</button>
          {checked && <button onClick={() => { setChecked(false); setSelected(null); }} className="text-xs font-semibold text-muted-foreground hover:text-foreground">Reintentar</button>}
        </div>
        {checked && data.feedback && <p className="mt-3 text-sm text-foreground/70 italic">{data.feedback}</p>}
      </div>
    );
  },
});
