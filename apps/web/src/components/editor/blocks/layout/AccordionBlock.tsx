'use client';

import { useState } from 'react';
import { ChevronsUpDown, Plus, Trash2, ChevronDown } from 'lucide-react';
import { defineBlock } from '../types';

interface AccordionItem {
  title: string;
  body: string;
}
export interface AccordionData {
  items: AccordionItem[];
}

export const AccordionBlock = defineBlock<AccordionData>({
  type: 'accordion',
  label: 'Acordeón',
  description: 'Secciones plegables',
  icon: ChevronsUpDown,
  category: 'layout',
  keywords: ['acordeon', 'accordion', 'plegable', 'faq', 'desplegable'],
  createDefault: () => ({ items: [{ title: 'Sección 1', body: '' }] }),
  Editor: ({ data, onChange }) => {
    const setItem = (i: number, patch: Partial<AccordionItem>) =>
      onChange({ items: data.items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)) });
    const add = () => onChange({ items: [...data.items, { title: `Sección ${data.items.length + 1}`, body: '' }] });
    const del = (i: number) => onChange({ items: data.items.filter((_, idx) => idx !== i) });
    return (
      <div className="rounded-xl border border-border bg-muted/10 p-3 space-y-2">
        {data.items.map((it, i) => (
          <div key={i} className="rounded-lg border border-border bg-background p-3 space-y-2">
            <div className="flex items-center gap-2">
              <input
                value={it.title}
                onChange={(e) => setItem(i, { title: e.target.value })}
                placeholder="Título de la sección"
                className="flex-1 font-semibold bg-transparent outline-none text-foreground"
              />
              <button type="button" onClick={() => del(i)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
            </div>
            <textarea
              rows={2}
              value={it.body}
              onChange={(e) => setItem(i, { body: e.target.value })}
              placeholder="Contenido…"
              className="w-full text-sm bg-transparent outline-none resize-none text-foreground/80"
            />
          </div>
        ))}
        <button type="button" onClick={add} className="text-xs flex items-center gap-1 text-primary font-semibold"><Plus className="w-3.5 h-3.5" /> Añadir sección</button>
      </div>
    );
  },
  Renderer: ({ data }) => (
    <div className="my-6 space-y-2">
      {data.items.map((it, i) => (
        <AccordionRow key={i} title={it.title} body={it.body} />
      ))}
    </div>
  ),
});

function AccordionRow({ title, body }: AccordionItem) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center justify-between px-4 py-3 text-left font-semibold text-foreground hover:bg-muted/40 transition-colors">
        {title}
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="px-4 pb-4 text-foreground/80 leading-relaxed whitespace-pre-wrap">{body}</div>}
    </div>
  );
}
