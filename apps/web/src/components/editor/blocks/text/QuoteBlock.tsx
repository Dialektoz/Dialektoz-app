'use client';

import { Quote as QuoteIcon } from 'lucide-react';
import { defineBlock } from '../types';
import { CText, ctText, ctColor, mkCT, ColorDots } from '../../textColor';

export interface QuoteData {
  text: CText;
  author: string;
}

export const QuoteBlock = defineBlock<QuoteData>({
  type: 'quote',
  label: 'Cita',
  description: 'Texto citado con autor',
  icon: QuoteIcon,
  category: 'text',
  keywords: ['cita', 'quote', 'frase', 'autor'],
  createDefault: () => ({ text: '', author: '' }),
  Editor: ({ data, onChange }) => (
    <div className="border-l-4 border-primary/40 pl-4 py-1">
      <div className="flex items-start gap-2">
        <textarea
          rows={2}
          value={ctText(data.text)}
          onChange={(e) => onChange({ ...data, text: mkCT(e.target.value, ctColor(data.text)) })}
          placeholder="Escribe la cita…"
          className="flex-1 bg-transparent outline-none resize-none text-lg italic text-foreground placeholder:text-muted-foreground/40"
          style={{ color: ctColor(data.text) }}
        />
        <ColorDots color={ctColor(data.text)} onPick={(c) => onChange({ ...data, text: mkCT(ctText(data.text), c) })} />
      </div>
      <input
        type="text"
        value={data.author}
        onChange={(e) => onChange({ ...data, author: e.target.value })}
        placeholder="— Autor (opcional)"
        className="w-full bg-transparent outline-none text-sm text-muted-foreground mt-1"
      />
    </div>
  ),
  Renderer: ({ data }) => (
    <figure className="my-6 border-l-4 border-primary/40 pl-5 py-1">
      <blockquote className="text-xl italic text-foreground/90 leading-relaxed" style={{ color: ctColor(data.text) }}>“{ctText(data.text)}”</blockquote>
      {data.author && <figcaption className="mt-2 text-sm font-medium text-muted-foreground">— {data.author}</figcaption>}
    </figure>
  ),
});
