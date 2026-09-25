'use client';

import { useState } from 'react';
import { Layers, Plus, Trash2, RotateCw, Type, Image as ImageIcon } from 'lucide-react';
import { defineBlock } from '../types';
import { CText, ctText, ctColor, mkCT, ColorDots } from '../../textColor';
import { UploadDropzone } from '../../UploadDropzone';

type CardFront = { kind: 'text'; value: CText } | { kind: 'image'; url: string; alt?: string };
interface Card {
  front: CardFront;
  back: CText;
}
export interface FlashcardsData {
  cards: Card[];
}

/** Cards created before the image-front variant stored `front` as a bare CText. */
function normalizeFront(raw: unknown): CardFront {
  if (raw && typeof raw === 'object' && 'kind' in (raw as Record<string, unknown>)) {
    return raw as CardFront;
  }
  return { kind: 'text', value: raw as CText };
}
function normalizeCard(raw: unknown): Card {
  const r = (raw ?? {}) as { front?: unknown; back?: CText };
  return { front: normalizeFront(r.front), back: r.back ?? '' };
}

export const FlashcardsBlock = defineBlock<FlashcardsData>({
  type: 'flashcards',
  label: 'Flashcards',
  description: 'Tarjetas de memoria (frente/reverso)',
  icon: Layers,
  category: 'interactive',
  keywords: ['flashcards', 'tarjetas', 'memoria', 'vocabulario'],
  createDefault: () => ({ cards: [{ front: { kind: 'text', value: '' }, back: '' }] }),
  Editor: ({ data, onChange }) => {
    const cards = data.cards.map(normalizeCard);
    const setCard = (i: number, patch: Partial<Card>) => onChange({ cards: cards.map((c, idx) => (idx === i ? { ...c, ...patch } : c)) });
    return (
      <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5 space-y-3">
        <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wide"><Layers className="w-4 h-4" /> Flashcards</div>
        {cards.map((c, i) => (
          <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-start">
            <FrontEditor front={c.front} onChange={(front) => setCard(i, { front })} />
            <div className="flex items-center gap-1">
              <input value={ctText(c.back)} onChange={(e) => setCard(i, { back: mkCT(e.target.value, ctColor(c.back)) })} placeholder="Reverso" className="flex-1 min-w-0 bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" style={{ color: ctColor(c.back) }} />
              <ColorDots color={ctColor(c.back)} onPick={(col) => setCard(i, { back: mkCT(ctText(c.back), col) })} />
            </div>
            <button type="button" onClick={() => cards.length > 1 && onChange({ cards: cards.filter((_, idx) => idx !== i) })} className="text-muted-foreground hover:text-destructive mt-2"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
        <button type="button" onClick={() => onChange({ cards: [...cards, { front: { kind: 'text', value: '' }, back: '' }] })} className="text-xs flex items-center gap-1 text-primary font-semibold"><Plus className="w-3.5 h-3.5" /> Añadir tarjeta</button>
      </div>
    );
  },
  Renderer: ({ data }) => (
    <div className="my-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
      {data.cards.map(normalizeCard).map((c, i) => <Flashcard key={i} card={c} />)}
    </div>
  ),
});

function FrontEditor({ front, onChange }: { front: CardFront; onChange: (front: CardFront) => void }) {
  return (
    <div className="space-y-1.5 min-w-0">
      <div className="flex items-center gap-1">
        <div className="flex rounded-lg border border-border overflow-hidden shrink-0">
          <button type="button" title="Texto" onClick={() => onChange({ kind: 'text', value: '' })} className={`p-1.5 ${front.kind === 'text' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:bg-muted'}`}>
            <Type className="w-3.5 h-3.5" />
          </button>
          <button type="button" title="Imagen" onClick={() => onChange({ kind: 'image', url: '', alt: '' })} className={`p-1.5 border-l border-border ${front.kind === 'image' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:bg-muted'}`}>
            <ImageIcon className="w-3.5 h-3.5" />
          </button>
        </div>
        {front.kind === 'text' ? (
          <>
            <input value={ctText(front.value)} onChange={(e) => onChange({ kind: 'text', value: mkCT(e.target.value, ctColor(front.value)) })} placeholder="Frente" className="flex-1 min-w-0 bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" style={{ color: ctColor(front.value) }} />
            <ColorDots color={ctColor(front.value)} onPick={(col) => onChange({ kind: 'text', value: mkCT(ctText(front.value), col) })} />
          </>
        ) : (
          <input value={front.url} onChange={(e) => onChange({ ...front, url: e.target.value })} placeholder="…o pega una URL de imagen" className="flex-1 min-w-0 bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
        )}
      </div>
      {front.kind === 'image' && (
        <div className="pl-9">
          {front.url ? (
            <div className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={front.url} alt={front.alt ?? ''} className="h-16 w-16 rounded-lg border border-border object-cover" />
              <button type="button" onClick={() => onChange({ ...front, url: '' })} className="text-xs text-muted-foreground hover:text-destructive">Quitar</button>
            </div>
          ) : (
            <UploadDropzone accept="image/*" label="Subir imagen" folder="flashcards" onUploaded={(url) => onChange({ ...front, url })} />
          )}
        </div>
      )}
    </div>
  );
}

function Flashcard({ card }: { card: Card }) {
  const [flipped, setFlipped] = useState(false);
  const front = card.front;
  return (
    <button onClick={() => setFlipped((f) => !f)} className="group relative h-32 rounded-xl border border-border bg-card hover:border-primary/50 transition-colors p-4 flex items-center justify-center text-center overflow-hidden">
      <RotateCw className="w-3.5 h-3.5 absolute top-2 right-2 text-muted-foreground/50 group-hover:text-primary z-10" />
      {!flipped && front.kind === 'image' ? (
        front.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={front.url} alt={front.alt ?? ''} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <ImageIcon className="w-8 h-8 text-muted-foreground/40" />
        )
      ) : (
        <span
          className={`font-medium ${flipped ? 'text-primary' : 'text-foreground'}`}
          style={{ color: ctColor(flipped ? card.back : front.kind === 'text' ? front.value : undefined) }}
        >
          {flipped ? ctText(card.back) : front.kind === 'text' ? ctText(front.value) : ''}
        </span>
      )}
    </button>
  );
}
