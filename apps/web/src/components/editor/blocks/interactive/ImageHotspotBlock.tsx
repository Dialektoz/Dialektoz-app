'use client';

import { useState, useRef } from 'react';
import { MapPin, Trash2, Check, X } from 'lucide-react';
import { defineBlock } from '../types';
import { useGradedActivity } from '@/components/learn/LessonAttempt';
import { UploadDropzone } from '../../UploadDropzone';
import { CText, ctText, ctColor, mkCT, ColorDots } from '../../textColor';

interface Spot {
  x: number; // percentage 0-100
  y: number;
  label: string;
}
export interface ImageHotspotData {
  imageUrl: string;
  prompt: CText;
  spots: Spot[];
  /**
   * Optional: index of the one correct spot. When set, the block is a graded "tap the right spot"
   * question (1 point, labels hidden); when absent it is the original viewer (tap to reveal labels).
   */
  correctSpot?: number;
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
    const delSpot = (i: number) => {
      const cs = data.correctSpot;
      const correctSpot = cs === undefined || cs === i ? undefined : cs > i ? cs - 1 : cs;
      onChange({ ...data, spots: data.spots.filter((_, idx) => idx !== i), correctSpot });
    };
    const toggleCorrect = (i: number) => onChange({ ...data, correctSpot: data.correctSpot === i ? undefined : i });

    return (
      <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5 space-y-3">
        <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wide"><MapPin className="w-4 h-4" /> Hotspots en imagen</div>
        <div className="flex items-center gap-2">
          <input value={ctText(data.prompt)} onChange={(e) => onChange({ ...data, prompt: mkCT(e.target.value, ctColor(data.prompt)) })} placeholder="Instrucción (ej: Haz clic en cada objeto)" className="flex-1 font-semibold bg-background border border-border rounded-xl px-4 py-3 outline-none focus:border-primary" style={{ color: ctColor(data.prompt) }} />
          <ColorDots color={ctColor(data.prompt)} onPick={(c) => onChange({ ...data, prompt: mkCT(ctText(data.prompt), c) })} />
        </div>

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
              <button type="button" onClick={() => onChange({ ...data, imageUrl: '', spots: [], correctSpot: undefined })} className="text-xs text-muted-foreground hover:text-destructive">Cambiar imagen</button>
            </div>
            <div className="space-y-1.5">
              {data.spots.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-6 h-6 shrink-0 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center">{i + 1}</span>
                  <input value={s.label} onChange={(e) => setSpot(i, e.target.value)} placeholder={`Etiqueta del punto ${i + 1}`} className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
                  <button type="button" onClick={() => toggleCorrect(i)} title="Marcar como el punto correcto (convierte el bloque en pregunta calificada)" className={`shrink-0 inline-flex items-center gap-1 rounded-lg border px-2 py-1.5 text-xs font-semibold ${data.correctSpot === i ? 'border-green-500 bg-green-500/10 text-green-600' : 'border-border text-muted-foreground hover:text-foreground'}`}>
                    <Check className="w-3.5 h-3.5" /> Correcto
                  </button>
                  <button type="button" onClick={() => delSpot(i)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
              {data.spots.length === 0 && <p className="text-xs text-muted-foreground italic">Aún no hay puntos.</p>}
              <p className="text-xs text-muted-foreground">
                {data.correctSpot === undefined
                  ? 'Sin punto correcto: el alumno solo explora la imagen (no puntúa).'
                  : `Pregunta calificada: el alumno debe tocar el punto ${data.correctSpot + 1}. Las etiquetas no se le muestran.`}
              </p>
            </div>
          </>
        )}
      </div>
    );
  },
  Renderer: ({ data, blockId }) =>
    data.correctSpot !== undefined && data.correctSpot >= 0 && data.correctSpot < data.spots.length ? (
      <GradedHotspot data={data} blockId={blockId} />
    ) : (
      <HotspotViewer data={data} />
    ),
});

/** The original behavior: tap a point to see its label. Not graded. */
function HotspotViewer({ data }: { data: ImageHotspotData }) {
  const [open, setOpen] = useState<number | null>(null);
  if (!data.imageUrl) return null;
  return (
    <div className="my-6">
      {ctText(data.prompt) && <p className="text-lg font-semibold text-foreground mb-3" style={{ color: ctColor(data.prompt) }}>{ctText(data.prompt)}</p>}
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
}

/** Graded mode: tap the correct spot, then check. Same flow (and feedback) as the other lesson activities. */
function GradedHotspot({ data, blockId }: { data: ImageHotspotData; blockId?: string }) {
  const [picked, setPicked] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const report = useGradedActivity(blockId);
  if (!data.imageUrl) return null;
  const correct = data.correctSpot;

  return (
    <div className="my-6 rounded-2xl border border-primary/30 bg-primary/5 p-6">
      {ctText(data.prompt) && <p className="text-lg font-semibold text-foreground mb-3" style={{ color: ctColor(data.prompt) }}>{ctText(data.prompt)}</p>}
      <div className="relative w-full rounded-xl overflow-hidden border border-border">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={data.imageUrl} alt="" className="w-full block" />
        {data.spots.map((s, i) => {
          const ok = checked && i === correct;
          const bad = checked && picked === i && i !== correct;
          return (
            <button
              key={i}
              type="button"
              disabled={checked}
              aria-label={`Punto ${i + 1}`}
              style={{ left: `${s.x}%`, top: `${s.y}%` }}
              onClick={() => setPicked(i)}
              className={`absolute -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full text-sm font-bold flex items-center justify-center border-2 border-background shadow-lg transition-transform ${
                ok ? 'bg-green-600 text-white' : bad ? 'bg-red-600 text-white' : picked === i ? 'bg-primary text-primary-foreground ring-4 ring-primary/40 scale-110' : 'bg-primary/80 text-primary-foreground hover:scale-110'
              }`}
            >
              {ok ? <Check className="w-4 h-4" /> : bad ? <X className="w-4 h-4" /> : i + 1}
            </button>
          );
        })}
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button
          disabled={picked === null || checked}
          onClick={() => {
            setChecked(true);
            report(picked === correct);
          }}
          className="bg-primary text-primary-foreground font-bold text-sm px-4 py-2 rounded-lg disabled:opacity-50"
        >
          Comprobar
        </button>
        {checked && (
          <button
            onClick={() => {
              setChecked(false);
              setPicked(null);
            }}
            className="text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            Reintentar
          </button>
        )}
      </div>
    </div>
  );
}
