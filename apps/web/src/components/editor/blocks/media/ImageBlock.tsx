'use client';

import { Image as ImageIcon } from 'lucide-react';
import { defineBlock } from '../types';
import { UploadDropzone } from '../../UploadDropzone';

export interface ImageData {
  url: string;
  alt: string;
  caption: string;
}

export const ImageBlock = defineBlock<ImageData>({
  type: 'image',
  label: 'Imagen',
  description: 'Imagen con pie de foto',
  icon: ImageIcon,
  category: 'media',
  keywords: ['imagen', 'foto', 'picture', 'media'],
  createDefault: () => ({ url: '', alt: '', caption: '' }),
  Editor: ({ data, onChange }) => (
    <div className="rounded-xl border border-border bg-muted/10 p-4 space-y-3">
      {data.url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={data.url} alt={data.alt} className="w-full rounded-lg border border-border max-h-80 object-contain bg-background" />
      ) : (
        <UploadDropzone accept="image/*" label="Arrastra una imagen o haz clic para subir" onUploaded={(url) => onChange({ ...data, url })} />
      )}
      <div className="flex items-center gap-2">
        <input
          type="url"
          value={data.url}
          onChange={(e) => onChange({ ...data, url: e.target.value })}
          placeholder="…o pega una URL"
          className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
        />
        {data.url && (
          <button type="button" onClick={() => onChange({ ...data, url: '' })} className="text-xs text-muted-foreground hover:text-destructive shrink-0">
            Quitar
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input
          type="text"
          value={data.alt}
          onChange={(e) => onChange({ ...data, alt: e.target.value })}
          placeholder="Texto alternativo (accesibilidad)"
          className="bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <input
          type="text"
          value={data.caption}
          onChange={(e) => onChange({ ...data, caption: e.target.value })}
          placeholder="Pie de foto (opcional)"
          className="bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
        />
      </div>
    </div>
  ),
  Renderer: ({ data }) =>
    data.url ? (
      <figure className="my-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={data.url} alt={data.alt} className="w-full rounded-xl border border-border" />
        {data.caption && <figcaption className="mt-2 text-center text-sm text-muted-foreground">{data.caption}</figcaption>}
      </figure>
    ) : null,
});
