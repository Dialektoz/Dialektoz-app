'use client';

import { useState } from 'react';
import { PenTool } from 'lucide-react';
import { defineBlock } from '../types';

export interface EssayData {
  prompt: string;
  minWords: number;
  placeholder: string;
}

const countWords = (s: string) => (s.trim() ? s.trim().split(/\s+/).length : 0);

export const EssayBlock = defineBlock<EssayData>({
  type: 'essay',
  label: 'Respuesta larga / Ensayo',
  description: 'Escritura abierta con contador de palabras',
  icon: PenTool,
  category: 'interactive',
  keywords: ['ensayo', 'essay', 'respuesta larga', 'escritura', 'writing', 'redaccion', 'pregunta abierta'],
  createDefault: () => ({ prompt: '', minWords: 0, placeholder: 'Escribe tu respuesta…' }),
  Editor: ({ data, onChange }) => (
    <div className="rounded-2xl border border-secondary/30 bg-secondary/5 p-5">
      <div className="flex items-center gap-2 mb-3 text-secondary font-bold text-xs uppercase tracking-wide"><PenTool className="w-4 h-4" /> Respuesta larga / Ensayo</div>
      <textarea rows={2} value={data.prompt} onChange={(e) => onChange({ ...data, prompt: e.target.value })} placeholder="Consigna (ej: Describe tu rutina diaria en pasado)" className="w-full font-semibold bg-background border border-border rounded-xl px-4 py-3 mb-3 outline-none focus:border-secondary resize-none" />
      <div className="flex flex-wrap gap-3 items-center">
        <label className="text-xs text-muted-foreground flex items-center gap-2">
          Mínimo de palabras
          <input type="number" min={0} value={data.minWords} onChange={(e) => onChange({ ...data, minWords: Number(e.target.value) || 0 })} className="w-20 bg-background border border-border rounded-lg px-2 py-1.5 text-sm outline-none focus:border-secondary" />
        </label>
        <input value={data.placeholder} onChange={(e) => onChange({ ...data, placeholder: e.target.value })} placeholder="Texto de ayuda (placeholder)" className="flex-1 min-w-[180px] bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-secondary" />
      </div>
    </div>
  ),
  Renderer: ({ data }) => {
    const [text, setText] = useState('');
    const words = countWords(text);
    const meets = data.minWords === 0 || words >= data.minWords;
    return (
      <div className="my-6 rounded-2xl border border-secondary/30 bg-secondary/5 p-6">
        {data.prompt && <p className="text-lg font-semibold text-foreground mb-4">{data.prompt}</p>}
        <textarea
          rows={6}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={data.placeholder}
          className="w-full bg-background border-2 border-border rounded-xl px-4 py-3 outline-none focus:border-secondary resize-y leading-relaxed"
        />
        <div className="mt-2 flex items-center justify-between text-xs">
          <span className={`font-semibold ${meets ? 'text-green-600' : 'text-muted-foreground'}`}>
            {words} {words === 1 ? 'palabra' : 'palabras'}
            {data.minWords > 0 && ` / mínimo ${data.minWords}`}
          </span>
          {data.minWords > 0 && meets && <span className="text-green-600 font-semibold">✓ Cumple el mínimo</span>}
        </div>
      </div>
    );
  },
});
