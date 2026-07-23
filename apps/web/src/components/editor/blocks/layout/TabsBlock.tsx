'use client';

import { useState } from 'react';
import { PanelsTopLeft, Plus, Trash2 } from 'lucide-react';
import { defineBlock } from '../types';

interface Tab {
  label: string;
  body: string;
}
export interface TabsData {
  tabs: Tab[];
}

export const TabsBlock = defineBlock<TabsData>({
  type: 'tabs',
  label: 'Pestañas',
  description: 'Contenido organizado en tabs',
  icon: PanelsTopLeft,
  category: 'layout',
  keywords: ['pestañas', 'tabs', 'solapas'],
  createDefault: () => ({ tabs: [{ label: 'Tab 1', body: '' }, { label: 'Tab 2', body: '' }] }),
  Editor: ({ data, onChange }) => {
    const setTab = (i: number, patch: Partial<Tab>) => onChange({ tabs: data.tabs.map((t, idx) => (idx === i ? { ...t, ...patch } : t)) });
    const add = () => onChange({ tabs: [...data.tabs, { label: `Tab ${data.tabs.length + 1}`, body: '' }] });
    const del = (i: number) => data.tabs.length > 1 && onChange({ tabs: data.tabs.filter((_, idx) => idx !== i) });
    return (
      <div className="rounded-xl border border-border bg-muted/10 p-3 space-y-3">
        {data.tabs.map((t, i) => (
          <div key={i} className="rounded-lg border border-border bg-background p-3 space-y-2">
            <div className="flex items-center gap-2">
              <input value={t.label} onChange={(e) => setTab(i, { label: e.target.value })} placeholder="Etiqueta" className="font-semibold bg-transparent outline-none text-foreground border-b border-border/50 focus:border-primary" />
              <button type="button" onClick={() => del(i)} className="ml-auto text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
            </div>
            <textarea rows={2} value={t.body} onChange={(e) => setTab(i, { body: e.target.value })} placeholder="Contenido de la pestaña…" className="w-full text-sm bg-transparent outline-none resize-none text-foreground/80" />
          </div>
        ))}
        <button type="button" onClick={add} className="text-xs flex items-center gap-1 text-primary font-semibold"><Plus className="w-3.5 h-3.5" /> Añadir pestaña</button>
      </div>
    );
  },
  Renderer: ({ data }) => <TabsView tabs={data.tabs} />,
});

function TabsView({ tabs }: { tabs: Tab[] }) {
  const [active, setActive] = useState(0);
  if (tabs.length === 0) return null;
  return (
    <div className="my-6 rounded-xl border border-border overflow-hidden">
      <div className="flex border-b border-border bg-muted/30 overflow-x-auto">
        {tabs.map((t, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={`px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors ${active === i ? 'text-primary border-b-2 border-primary bg-background' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="p-4 text-foreground/80 leading-relaxed whitespace-pre-wrap">{tabs[active]?.body}</div>
    </div>
  );
}
