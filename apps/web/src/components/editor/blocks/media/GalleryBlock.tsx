'use client';

import { useState } from 'react';
import { Images, Trash2, X } from 'lucide-react';
import { defineBlock } from '../types';
import { UploadDropzone } from '../../UploadDropzone';

interface GalleryImage {
  url: string;
  caption: string;
}
export interface GalleryData {
  images: GalleryImage[];
}

export const GalleryBlock = defineBlock<GalleryData>({
  type: 'gallery',
  label: 'Galería',
  description: 'Cuadrícula de imágenes',
  icon: Images,
  category: 'media',
  keywords: ['galeria', 'gallery', 'imagenes', 'fotos', 'grid'],
  createDefault: () => ({ images: [] }),
  Editor: ({ data, onChange }) => (
    <div className="rounded-xl border border-border bg-muted/10 p-4 space-y-3">
      <div className="flex items-center gap-2 text-muted-foreground font-bold text-xs uppercase tracking-wide"><Images className="w-4 h-4" /> Galería</div>
      {data.images.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {data.images.map((img, i) => (
            <div key={i} className="relative group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt={img.caption} className="w-full h-24 object-cover rounded-lg border border-border" />
              <button type="button" onClick={() => onChange({ images: data.images.filter((_, idx) => idx !== i) })} className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3.5 h-3.5" /></button>
              <input value={img.caption} onChange={(e) => onChange({ images: data.images.map((im, idx) => (idx === i ? { ...im, caption: e.target.value } : im)) })} placeholder="Pie" className="w-full mt-1 text-[11px] bg-background border border-border rounded px-1.5 py-1 outline-none focus:border-primary" />
            </div>
          ))}
        </div>
      )}
      <UploadDropzone accept="image/*" label="Añadir imagen a la galería" onUploaded={(url) => onChange({ images: [...data.images, { url, caption: '' }] })} />
    </div>
  ),
  Renderer: ({ data }) => <Gallery images={data.images} />,
});

function Gallery({ images }: { images: GalleryImage[] }) {
  const [open, setOpen] = useState<number | null>(null);
  if (images.length === 0) return null;
  return (
    <>
      <div className="my-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
        {images.map((img, i) => (
          <button key={i} onClick={() => setOpen(i)} className="group relative overflow-hidden rounded-xl border border-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.url} alt={img.caption} className="w-full h-40 object-cover group-hover:scale-105 transition-transform" />
          </button>
        ))}
      </div>
      {open !== null && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setOpen(null)}>
          <button className="absolute top-4 right-4 text-white/80 hover:text-white"><X className="w-7 h-7" /></button>
          <figure className="max-w-4xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={images[open].url} alt={images[open].caption} className="max-h-[80vh] w-auto mx-auto rounded-lg" />
            {images[open].caption && <figcaption className="text-center text-white/70 mt-3">{images[open].caption}</figcaption>}
          </figure>
        </div>
      )}
    </>
  );
}
