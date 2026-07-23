'use client';

import { MousePointerClick } from 'lucide-react';
import { defineBlock } from '../types';

type Align = 'left' | 'center' | 'right';
type Variant = 'primary' | 'secondary' | 'outline';

export interface ButtonData {
  label: string;
  url: string;
  align: Align;
  variant: Variant;
}

const variantClass: Record<Variant, string> = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/90',
  outline: 'border border-border text-foreground hover:bg-muted',
};
const alignClass: Record<Align, string> = { left: 'justify-start', center: 'justify-center', right: 'justify-end' };

export const ButtonBlock = defineBlock<ButtonData>({
  type: 'button',
  label: 'Botón',
  description: 'Botón enlace / llamada a la acción',
  icon: MousePointerClick,
  category: 'media',
  keywords: ['boton', 'button', 'cta', 'enlace', 'link', 'accion'],
  createDefault: () => ({ label: 'Ver más', url: '', align: 'left', variant: 'primary' }),
  Editor: ({ data, onChange }) => (
    <div className="rounded-xl border border-border bg-muted/10 p-4 space-y-3">
      <div className="flex items-center gap-2 text-muted-foreground font-bold text-xs uppercase tracking-wide"><MousePointerClick className="w-4 h-4" /> Botón</div>
      <div className="grid grid-cols-2 gap-2">
        <input value={data.label} onChange={(e) => onChange({ ...data, label: e.target.value })} placeholder="Texto del botón" className="bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
        <input value={data.url} onChange={(e) => onChange({ ...data, url: e.target.value })} placeholder="https://…" className="bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
      </div>
      <div className="flex flex-wrap gap-3">
        <select value={data.variant} onChange={(e) => onChange({ ...data, variant: e.target.value as Variant })} className="bg-background border border-border rounded-lg px-2 py-1.5 text-xs outline-none focus:border-primary cursor-pointer">
          <option value="primary">Primario</option>
          <option value="secondary">Secundario</option>
          <option value="outline">Contorno</option>
        </select>
        <select value={data.align} onChange={(e) => onChange({ ...data, align: e.target.value as Align })} className="bg-background border border-border rounded-lg px-2 py-1.5 text-xs outline-none focus:border-primary cursor-pointer">
          <option value="left">Izquierda</option>
          <option value="center">Centro</option>
          <option value="right">Derecha</option>
        </select>
      </div>
      <div className={`flex ${alignClass[data.align]}`}>
        <span className={`inline-flex items-center px-5 py-2.5 rounded-lg font-semibold text-sm ${variantClass[data.variant]}`}>{data.label || 'Botón'}</span>
      </div>
    </div>
  ),
  Renderer: ({ data }) =>
    data.url ? (
      <div className={`my-6 flex ${alignClass[data.align]}`}>
        <a href={data.url} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center px-6 py-3 rounded-lg font-semibold transition-colors ${variantClass[data.variant]}`}>
          {data.label || 'Ver más'}
        </a>
      </div>
    ) : null,
});
