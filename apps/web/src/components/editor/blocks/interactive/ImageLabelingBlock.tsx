'use client';

import { useState, useRef, useMemo } from 'react';
import { Tags, Trash2, Check, X } from 'lucide-react';
import { defineBlock } from '../types';
import { useGradedActivity } from '@/components/learn/LessonAttempt';
import { UploadDropzone } from '../../UploadDropzone';

interface Point {
  x: number;
  y: number;
  label: string; // correct label
}
export interface ImageLabelingData {
  imageUrl: string;
  prompt: string;
  points: Point[];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const ImageLabelingBlock = defineBlock<ImageLabelingData>({
  type: 'image-labeling',
  label: 'Etiquetar imagen',
  description: 'El alumno asigna etiquetas a los puntos',
  icon: Tags,
  category: 'interactive',
  keywords: ['etiquetar', 'labeling', 'imagen', 'vocabulario', 'diagrama', 'partes'],
  isGradable: true,
  createDefault: () => ({ imageUrl: '', prompt: '', points: [] }),
  Editor: ({ data, onChange }) => {
    const ref = useRef<HTMLDivElement>(null);
    const addPoint = (e: React.MouseEvent) => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
      const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
      onChange({ ...data, points: [...data.points, { x, y, label: '' }] });
    };
    const setPoint = (i: number, label: string) => onChange({ ...data, points: data.points.map((p, idx) => (idx === i ? { ...p, label } : p)) });
    const delPoint = (i: number) => onChange({ ...data, points: data.points.filter((_, idx) => idx !== i) });

    return (
      <div className="rounded-2xl border border-secondary/30 bg-secondary/5 p-5 space-y-3">
        <div className="flex items-center gap-2 text-secondary font-bold text-xs uppercase tracking-wide"><Tags className="w-4 h-4" /> Etiquetar imagen</div>
        <input value={data.prompt} onChange={(e) => onChange({ ...data, prompt: e.target.value })} placeholder="Instrucción (ej: Etiqueta las partes de la casa)" className="w-full font-semibold bg-background border border-border rounded-xl px-4 py-3 outline-none focus:border-secondary" />

        {!data.imageUrl ? (
          <UploadDropzone accept="image/*" label="Sube la imagen base" onUploaded={(url) => onChange({ ...data, imageUrl: url })} />
        ) : (
          <>
            <p className="text-xs text-muted-foreground">Haz clic sobre la imagen para colocar un punto, y escribe su etiqueta correcta.</p>
            <div ref={ref} onClick={addPoint} className="relative w-full rounded-lg overflow-hidden border border-border cursor-crosshair select-none">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={data.imageUrl} alt="" className="w-full block pointer-events-none" />
              {data.points.map((p, i) => (
                <span key={i} style={{ left: `${p.x}%`, top: `${p.y}%` }} className="absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-secondary text-secondary-foreground text-xs font-bold flex items-center justify-center border-2 border-background shadow">
                  {i + 1}
                </span>
              ))}
            </div>
            <button type="button" onClick={() => onChange({ ...data, imageUrl: '', points: [] })} className="text-xs text-muted-foreground hover:text-destructive">Cambiar imagen</button>
            <div className="space-y-1.5">
              {data.points.map((p, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-6 h-6 shrink-0 rounded-full bg-secondary/15 text-secondary text-xs font-bold flex items-center justify-center">{i + 1}</span>
                  <input value={p.label} onChange={(e) => setPoint(i, e.target.value)} placeholder={`Etiqueta correcta del punto ${i + 1}`} className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-secondary" />
                  <button type="button" onClick={() => delPoint(i)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
              {data.points.length === 0 && <p className="text-xs text-muted-foreground italic">Aún no hay puntos.</p>}
            </div>
          </>
        )}
      </div>
    );
  },
  Renderer: ({ data, blockId }) => {
    const options = useMemo(() => shuffle(data.points.map((p) => p.label)), [data.points]);
    const [picks, setPicks] = useState<Record<number, string>>({});
    const [checked, setChecked] = useState(false);
    const report = useGradedActivity(blockId);
    if (!data.imageUrl) return null;

    return (
      <div className="my-6 rounded-2xl border border-secondary/30 bg-secondary/5 p-6">
        {data.prompt && <p className="text-lg font-semibold text-foreground mb-4">{data.prompt}</p>}
        <div className="relative w-full rounded-xl overflow-hidden border border-border mb-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={data.imageUrl} alt="" className="w-full block" />
          {data.points.map((p, i) => (
            <span key={i} style={{ left: `${p.x}%`, top: `${p.y}%` }} className="absolute -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-secondary text-secondary-foreground text-sm font-bold flex items-center justify-center border-2 border-background shadow-lg">
              {i + 1}
            </span>
          ))}
        </div>
        <div className="space-y-2">
          {data.points.map((p, i) => {
            const ok = checked && picks[i] === p.label;
            const bad = checked && picks[i] !== p.label;
            return (
              <div key={i} className="flex items-center gap-3">
                <span className="w-7 h-7 shrink-0 rounded-full bg-secondary/15 text-secondary text-sm font-bold flex items-center justify-center">{i + 1}</span>
                <select value={picks[i] ?? ''} disabled={checked} onChange={(e) => setPicks({ ...picks, [i]: e.target.value })} className={`flex-1 p-2.5 rounded-lg border bg-background text-sm outline-none ${ok ? 'border-green-500 text-green-600' : bad ? 'border-red-500 text-red-600' : 'border-border focus:border-secondary'}`}>
                  <option value="" disabled>Selecciona la etiqueta…</option>
                  {options.map((o, idx) => <option key={idx} value={o}>{o}</option>)}
                </select>
                {ok && <Check className="w-4 h-4 text-green-600 shrink-0" />}
                {bad && <X className="w-4 h-4 text-red-600 shrink-0" />}
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button disabled={checked || Object.keys(picks).length < data.points.length} onClick={() => { setChecked(true); report(data.points.every((p, i) => picks[i] === p.label)); }} className="bg-secondary text-secondary-foreground font-bold text-sm px-4 py-2 rounded-lg disabled:opacity-50">Comprobar</button>
          {checked && <button onClick={() => { setChecked(false); setPicks({}); }} className="text-xs font-semibold text-muted-foreground hover:text-foreground">Reintentar</button>}
        </div>
      </div>
    );
  },
});
