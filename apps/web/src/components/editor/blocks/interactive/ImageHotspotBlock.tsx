'use client';

import { useState, useRef } from 'react';
import { MapPin, Trash2 } from 'lucide-react';
import { defineBlock } from '../types';
import { UploadDropzone } from '../../UploadDropzone';

interface Spot {
  x: number; // percentage 0-100
  y: number;
  label: string;
}
export interface ImageHotspotData {
  imageUrl: string;
  prompt: string;
  spots: Spot[];
}

export const ImageHotspotBlock = defineBlock<ImageHotspotData>({
  type: 'image-hotspot',
  label: 'Hotspots en imagen',
  description: 'Puntos que revelan etiquetas al hacer clic',
  icon: MapPin,
  category: 'interactive',
  keywords: ['hotspot', 'imagen', 'puntos', 'vocabulario', 'etiquetas', 'interactiva'],
  createDefault: () => ({ imageUrl: '', prompt: '', spots: [] }),
  Editor: ({ data, onChange }) => {
    const ref = useRef<HTMLDivElement>(null);
    const addSpot = (e: React.MouseEvent) => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      onChange({ ...data, spots: [...data.spots, { x: Math.round(x), y: Math.round(y), label: '' }] });
    };
    const setSpot = (i: number, label: string) => onChange({ ...data, spots: data.spots.map((s, idx) => (idx === i ? { ...s, label } : s)) });
    const delSpot = (i: number) => onChange({ ...data, spots: data.spots.filter((_, idx) => idx !== i) });

    return (
      <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5 space-y-3">
        <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wide"><MapPin className="w-4 h-4" /> Hotspots en imagen</div>
        <input value={data.prompt} onChange={(e) => onChange({ ...data, prompt: e.target.value })} placeholder="Instrucción (ej: Haz clic en cada objeto)" className="w-full font-semibold bg-background border border-border rounded-xl px-4 py-3 outline-none focus:border-primary" />

        {!data.imageUrl ? (
          <UploadDropzone accept="image/*" label="Sube la imagen base" onUploaded={(url) => onChange({ ...data, imageUrl: url })} />
        ) : (
          <>
            <p className="text-xs text-muted-foreground">Haz clic sobre la imagen para colocar un punto.</p>
            <div ref={ref} onClick={addSpot} className="relative w-full rounded-lg overflow-hidden border border-border cursor-crosshair select-none">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={data.imageUrl} alt="" className="w-full block pointer-events-none" />
              {data.spots.map((s, i) => (
                <span key={i} style={{ left: `${s.x}%`, top: `${s.y}%` }} className="absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center border-2 border-background shadow">
                  {i + 1}
                </span>
              ))}
            </div>
            <div className="flex items-center justify-between">
              <button type="button" onClick={() => onChange({ ...data, imageUrl: '', spots: [] })} className="text-xs text-muted-foreground hover:text-destructive">Cambiar imagen</button>
            </div>
            <div className="space-y-1.5">
              {data.spots.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-6 h-6 shrink-0 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center">{i + 1}</span>
                  <input value={s.label} onChange={(e) => setSpot(i, e.target.value)} placeholder={`Etiqueta del punto ${i + 1}`} className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
                  <button type="button" onClick={() => delSpot(i)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
              {data.spots.length === 0 && <p className="text-xs text-muted-foreground italic">Aún no hay puntos.</p>}
            </div>
          </>
        )}
      </div>
    );
  },
  Renderer: ({ data }) => {
    const [open, setOpen] = useState<number | null>(null);
    if (!data.imageUrl) return null;
    return (
      <div className="my-6">
        {data.prompt && <p className="text-lg font-semibold text-foreground mb-3">{data.prompt}</p>}
        <div className="relative w-full rounded-xl overflow-hidden border border-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={data.imageUrl} alt="" className="w-full block" />
          {data.spots.map((s, i) => (
            <button
              key={i}
              style={{ left: `${s.x}%`, top: `${s.y}%` }}
              onClick={() => setOpen(open === i ? null : i)}
              className="absolute -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center border-2 border-background shadow-lg hover:scale-110 transition-transform animate-pulse"
            >
              {i + 1}
            </button>
          ))}
          {open !== null && data.spots[open] && (
            <div style={{ left: `${data.spots[open].x}%`, top: `${data.spots[open].y}%` }} className="absolute -translate-x-1/2 translate-y-3 z-10 px-3 py-1.5 rounded-lg bg-foreground text-background text-sm font-semibold shadow-xl whitespace-nowrap">
              {data.spots[open].label || '—'}
            </div>
          )}
        </div>
      </div>
    );
  },
});
