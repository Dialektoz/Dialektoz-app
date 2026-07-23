'use client';

import { useState } from 'react';
import { ToggleLeft, Check, X } from 'lucide-react';
import { defineBlock } from '../types';
import { useGradedActivity } from '@/components/learn/LessonAttempt';

export interface TrueFalseData {
  statement: string;
  answer: boolean;
}

export const TrueFalseBlock = defineBlock<TrueFalseData>({
  type: 'true-false',
  label: 'Verdadero / Falso',
  description: 'Afirmación a evaluar',
  icon: ToggleLeft,
  category: 'interactive',
  keywords: ['verdadero', 'falso', 'true false', 'v/f'],
  isGradable: true,
  createDefault: () => ({ statement: '', answer: true }),
  Editor: ({ data, onChange }) => (
    <div className="rounded-2xl border border-secondary/30 bg-secondary/5 p-5">
      <div className="flex items-center gap-2 mb-3 text-secondary font-bold text-xs uppercase tracking-wide"><ToggleLeft className="w-4 h-4" /> Verdadero / Falso</div>
      <textarea rows={2} value={data.statement} onChange={(e) => onChange({ ...data, statement: e.target.value })} placeholder="Escribe la afirmación…" className="w-full bg-background border border-border rounded-xl px-4 py-3 mb-3 outline-none focus:border-secondary resize-none" />
      <div className="flex gap-2">
        <button type="button" onClick={() => onChange({ ...data, answer: true })} className={`flex-1 py-2 rounded-lg font-semibold text-sm border-2 transition-colors ${data.answer ? 'border-green-500 bg-green-500/10 text-green-600' : 'border-border text-muted-foreground'}`}>Verdadero</button>
        <button type="button" onClick={() => onChange({ ...data, answer: false })} className={`flex-1 py-2 rounded-lg font-semibold text-sm border-2 transition-colors ${!data.answer ? 'border-red-500 bg-red-500/10 text-red-600' : 'border-border text-muted-foreground'}`}>Falso</button>
      </div>
      <p className="text-xs text-muted-foreground mt-2">Respuesta correcta: <b>{data.answer ? 'Verdadero' : 'Falso'}</b></p>
    </div>
  ),
  Renderer: ({ data, blockId }) => {
    const [pick, setPick] = useState<boolean | null>(null);
    const [checked, setChecked] = useState(false);
    const report = useGradedActivity(blockId);
    const correct = checked && pick === data.answer;
    return (
      <div className="my-6 rounded-2xl border border-secondary/30 bg-secondary/5 p-6">
        <p className="text-lg font-semibold text-foreground mb-4">{data.statement}</p>
        <div className="flex gap-3">
          {[true, false].map((v) => {
            const isRight = checked && v === data.answer;
            const isWrong = checked && pick === v && v !== data.answer;
            return (
              <button key={String(v)} disabled={checked} onClick={() => setPick(v)} className={`flex-1 py-3 rounded-lg font-semibold border-2 flex items-center justify-center gap-2 transition-colors ${isRight ? 'border-green-500 bg-green-500/10 text-green-600' : isWrong ? 'border-red-500 bg-red-500/10 text-red-600' : pick === v ? 'border-secondary bg-secondary/10' : 'border-border hover:border-secondary/50'}`}>
                {v ? 'Verdadero' : 'Falso'}
                {isRight && <Check className="w-4 h-4" />}
                {isWrong && <X className="w-4 h-4" />}
              </button>
            );
          })}
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button disabled={pick === null || checked} onClick={() => { setChecked(true); report(pick === data.answer); }} className="bg-secondary text-secondary-foreground font-bold text-sm px-4 py-2 rounded-lg disabled:opacity-50">Comprobar</button>
          {checked && <button onClick={() => { setChecked(false); setPick(null); }} className="text-xs font-semibold text-muted-foreground hover:text-foreground">Reintentar</button>}
          {checked && <span className={`text-sm font-semibold ${correct ? 'text-green-600' : 'text-red-600'}`}>{correct ? '¡Correcto!' : 'Incorrecto'}</span>}
        </div>
      </div>
    );
  },
});
