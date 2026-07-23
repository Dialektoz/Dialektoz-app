'use client';

import { CalendarClock, Plus, Trash2 } from 'lucide-react';
import { defineBlock } from '../types';

interface TimelineEvent {
  date: string;
  title: string;
  description: string;
}
export interface TimelineData {
  events: TimelineEvent[];
}

export const TimelineBlock = defineBlock<TimelineData>({
  type: 'timeline',
  label: 'Cronología',
  description: 'Línea de tiempo de eventos',
  icon: CalendarClock,
  category: 'layout',
  keywords: ['cronologia', 'timeline', 'linea de tiempo', 'eventos', 'historia'],
  createDefault: () => ({ events: [{ date: '', title: '', description: '' }] }),
  Editor: ({ data, onChange }) => {
    const setEvent = (i: number, patch: Partial<TimelineEvent>) => onChange({ events: data.events.map((e, idx) => (idx === i ? { ...e, ...patch } : e)) });
    return (
      <div className="rounded-2xl border border-border bg-muted/10 p-4 space-y-3">
        <div className="flex items-center gap-2 text-muted-foreground font-bold text-xs uppercase tracking-wide"><CalendarClock className="w-4 h-4" /> Cronología</div>
        {data.events.map((ev, i) => (
          <div key={i} className="rounded-lg border border-border bg-background p-3 space-y-2">
            <div className="flex items-center gap-2">
              <input value={ev.date} onChange={(e) => setEvent(i, { date: e.target.value })} placeholder="Fecha (ej: 1969)" className="w-32 bg-muted/40 border border-border rounded px-2 py-1.5 text-sm font-bold outline-none focus:border-primary" />
              <input value={ev.title} onChange={(e) => setEvent(i, { title: e.target.value })} placeholder="Título del evento" className="flex-1 bg-transparent outline-none font-semibold text-foreground" />
              <button type="button" onClick={() => data.events.length > 1 && onChange({ events: data.events.filter((_, idx) => idx !== i) })} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
            </div>
            <textarea rows={2} value={ev.description} onChange={(e) => setEvent(i, { description: e.target.value })} placeholder="Descripción…" className="w-full text-sm bg-transparent outline-none resize-none text-foreground/80" />
          </div>
        ))}
        <button type="button" onClick={() => onChange({ events: [...data.events, { date: '', title: '', description: '' }] })} className="text-xs flex items-center gap-1 text-primary font-semibold"><Plus className="w-3.5 h-3.5" /> Añadir evento</button>
      </div>
    );
  },
  Renderer: ({ data }) => (
    <div className="my-6 relative pl-6">
      <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-border" />
      <div className="space-y-6">
        {data.events.map((ev, i) => (
          <div key={i} className="relative">
            <div className="absolute -left-[18px] top-1 w-3.5 h-3.5 rounded-full bg-primary border-2 border-background" />
            {ev.date && <span className="text-xs font-bold text-primary uppercase tracking-wider">{ev.date}</span>}
            <h4 className="font-bold text-foreground">{ev.title}</h4>
            {ev.description && <p className="text-sm text-foreground/70 mt-0.5 leading-relaxed">{ev.description}</p>}
          </div>
        ))}
      </div>
    </div>
  ),
});
