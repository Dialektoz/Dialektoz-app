'use client';

import { Square } from 'lucide-react';
import { defineBlock } from '../types';
import type { BlockInstance } from '../types';
import { BlockCanvas } from '../../BlockCanvas';
import { BlockList } from '../BlockList';

type Variant = 'plain' | 'card' | 'muted' | 'outline';

export interface ContainerData {
  title: string;
  variant: Variant;
  children: BlockInstance[];
}

const variantClass: Record<Variant, string> = {
  plain: '',
  card: 'rounded-2xl border border-border bg-card p-5 md:p-6',
  muted: 'rounded-2xl bg-muted/40 p-5 md:p-6',
  outline: 'rounded-2xl border-2 border-primary/20 p-5 md:p-6',
};

export const ContainerBlock = defineBlock<ContainerData>({
  type: 'container',
  label: 'Contenedor / Sección',
  description: 'Agrupa bloques en una sección con estilo',
  icon: Square,
  category: 'layout',
  keywords: ['contenedor', 'container', 'seccion', 'section', 'grupo', 'tarjeta', 'card'],
  createDefault: () => ({ title: '', variant: 'card', children: [] }),
  Editor: ({ data, onChange }) => (
    <div className="rounded-2xl border border-border bg-muted/10 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Square className="w-4 h-4 text-muted-foreground" />
        <input
          value={data.title}
          onChange={(e) => onChange({ ...data, title: e.target.value })}
          placeholder="Título de la sección (opcional)"
          className="flex-1 font-bold bg-transparent outline-none text-foreground border-b border-border/50 focus:border-primary"
        />
        <select
          value={data.variant}
          onChange={(e) => onChange({ ...data, variant: e.target.value as Variant })}
          className="bg-background border border-border rounded-lg px-2 py-1.5 text-xs outline-none focus:border-primary cursor-pointer"
        >
          <option value="card">Tarjeta</option>
          <option value="muted">Suave</option>
          <option value="outline">Contorno</option>
          <option value="plain">Sin estilo</option>
        </select>
      </div>
      <div className="rounded-xl border border-dashed border-border bg-background/40 p-2">
        <BlockCanvas blocks={data.children} onChange={(children) => onChange({ ...data, children })} nested emptyLabel="Añadir bloque a la sección" />
      </div>
    </div>
  ),
  Renderer: ({ data }) => (
    <section className={`my-6 ${variantClass[data.variant]}`}>
      {data.title && <h3 className="text-xl font-bold text-foreground mb-3">{data.title}</h3>}
      <BlockList blocks={data.children} />
    </section>
  ),
});
