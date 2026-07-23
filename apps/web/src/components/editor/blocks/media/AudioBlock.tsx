'use client';

import { Music } from 'lucide-react';
import { defineBlock } from '../types';
import { UploadDropzone } from '../../UploadDropzone';

export interface AudioData {
  url: string;
  title: string;
}

export const AudioBlock = defineBlock<AudioData>({
  type: 'audio',
  label: 'Audio',
  description: 'Pista de audio reproducible',
  icon: Music,
  category: 'media',
  keywords: ['audio', 'sonido', 'mp3', 'listening', 'podcast'],
  createDefault: () => ({ url: '', title: '' }),
  Editor: ({ data, onChange }) => (
    <div className="rounded-xl border border-border bg-muted/10 p-4 space-y-3">
      <input
        type="text"
        value={data.title}
        onChange={(e) => onChange({ ...data, title: e.target.value })}
        placeholder="Título del audio (opcional)"
        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
      />
      {!data.url && <UploadDropzone accept="audio/*" label="Arrastra un audio o haz clic para subir" onUploaded={(url) => onChange({ ...data, url })} />}
      <div className="flex items-center gap-2">
        <input
          type="url"
          value={data.url}
          onChange={(e) => onChange({ ...data, url: e.target.value })}
          placeholder="…o pega una URL (.mp3)"
          className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
        />
        {data.url && <button type="button" onClick={() => onChange({ ...data, url: '' })} className="text-xs text-muted-foreground hover:text-destructive shrink-0">Quitar</button>}
      </div>
      {data.url && <audio controls src={data.url} className="w-full" />}
    </div>
  ),
  Renderer: ({ data }) =>
    data.url ? (
      <div className="my-6 rounded-xl border border-border bg-card p-4">
        {data.title && <p className="font-semibold text-foreground mb-2 flex items-center gap-2"><Music className="w-4 h-4 text-primary" />{data.title}</p>}
        <audio controls src={data.url} className="w-full" />
      </div>
    ) : null,
});
