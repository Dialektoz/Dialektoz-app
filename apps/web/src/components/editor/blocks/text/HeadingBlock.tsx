'use client';

import { Heading as HeadingIcon } from 'lucide-react';
import { defineBlock } from '../types';

export interface HeadingData {
  text: string;
  level: 1 | 2 | 3;
}

const sizeByLevel: Record<number, string> = {
  1: 'text-4xl',
  2: 'text-3xl',
  3: 'text-2xl',
};

export const HeadingBlock = defineBlock<HeadingData>({
  type: 'heading',
  label: 'Título',
  description: 'Encabezado de sección',
  icon: HeadingIcon,
  category: 'text',
  keywords: ['titulo', 'heading', 'subtitulo', 'encabezado'],
  createDefault: () => ({ text: '', level: 2 }),
  Editor: ({ data, onChange }) => (
    <div className="flex items-start gap-3">
      <select
        value={data.level}
        onChange={(e) => onChange({ ...data, level: Number(e.target.value) as HeadingData['level'] })}
        className="mt-2 shrink-0 bg-muted border border-border rounded-md px-2 py-1 text-xs font-bold text-muted-foreground outline-none focus:border-primary cursor-pointer"
      >
        <option value={1}>H1</option>
        <option value={2}>H2</option>
        <option value={3}>H3</option>
      </select>
      <input
        type="text"
        className={`w-full ${sizeByLevel[data.level]} font-bold bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground/40 focus:ring-0`}
        placeholder="Escribe el título…"
        value={data.text}
        onChange={(e) => onChange({ ...data, text: e.target.value })}
      />
    </div>
  ),
  Renderer: ({ data }) => {
    const cls = `${sizeByLevel[data.level]} font-bold text-foreground tracking-tight mt-8 mb-4`;
    if (data.level === 1) return <h1 className={cls}>{data.text}</h1>;
    if (data.level === 3) return <h3 className={cls}>{data.text}</h3>;
    return <h2 className={cls}>{data.text}</h2>;
  },
});
