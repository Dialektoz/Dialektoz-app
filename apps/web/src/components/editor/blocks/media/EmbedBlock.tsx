'use client';

import { Globe } from 'lucide-react';
import { defineBlock } from '../types';

export interface EmbedData {
  url: string;
  height: number;
}

export const EmbedBlock = defineBlock<EmbedData>({
  type: 'embed',
  label: 'Embed externo',
  description: 'Incrusta cualquier contenido por URL',
  icon: Globe,
  category: 'media',
  keywords: ['embed', 'iframe', 'incrustar', 'genially', 'mapa'],
  createDefault: () => ({ url: '', height: 400 }),
  Editor: ({ data, onChange }) => (
    <div className="rounded-xl border border-border bg-muted/10 p-4 space-y-3">
      <div className="flex gap-2">
        <input
          type="url"
          value={data.url}
          onChange={(e) => onChange({ ...data, url: e.target.value })}
          placeholder="https://… (URL a incrustar)"
          className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <input
          type="number"
          value={data.height}
          onChange={(e) => onChange({ ...data, height: Number(e.target.value) || 400 })}
          className="w-24 bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
          title="Alto en px"
        />
      </div>
      {data.url && (
        <iframe src={data.url} style={{ height: data.height }} className="w-full rounded-lg border border-border bg-background" title="embed preview" />
      )}
    </div>
  ),
  Renderer: ({ data }) =>
    data.url ? (
      <div className="my-6">
        <iframe src={data.url} style={{ height: data.height }} className="w-full rounded-xl border border-border" allowFullScreen title="embed" />
      </div>
    ) : null,
});
