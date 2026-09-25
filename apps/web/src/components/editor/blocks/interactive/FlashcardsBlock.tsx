'use client';

import { useState } from 'react';
import type { JSONContent } from '@tiptap/react';
import { Layers, Plus, Trash2, RotateCw, Type, Image as ImageIcon } from 'lucide-react';
import { defineBlock } from '../types';
import { CText, ctText, ctColor } from '../../textColor';
import { UploadDropzone } from '../../UploadDropzone';
import { RichTextEditor } from '../../RichTextEditor';
import { RichText } from '../RichText';

type CardFront = { kind: 'text'; doc: JSONContent } | { kind: 'image'; url: string; alt?: string };
interface Card {
  front: CardFront;
  back: JSONContent;
}
export interface FlashcardsData {
  cards: Card[];
}

const emptyDoc = (): JSONContent => ({ type: 'doc', content: [{ type: 'paragraph' }] });

function isDoc(v: unknown): v is JSONContent {
  return !!v && typeof v === 'object' && (v as { type?: unknown }).type === 'doc';
}

/** A CText (bare string or `{t,c}`) from before rich text, turned into an equivalent doc. */
function ctextToDoc(v: CText | undefined): JSONContent {
  const text = ctText(v);
  const color = ctColor(v);
  return {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: text ? [{ type: 'text', text, ...(color ? { marks: [{ type: 'textStyle', attrs: { color } }] } : {}) }] : [],
      },
    ],
  };
}

/** Cards from before this change stored `front` as a bare CText, or `{kind:'text', value: CText}`. */
function normalizeFront(raw: unknown): CardFront {
  if (raw && typeof raw === 'object' && 'kind' in (raw as Record<string, unknown>)) {
    const r = raw as { kind: string; value?: unknown; doc?: unknown; url?: string; alt?: string };
    if (r.kind === 'image') return { kind: 'image', url: r.url ?? '', alt: r.alt };
    return { kind: 'text', doc: isDoc(r.doc) ? r.doc : ctextToDoc(r.value as CText) };
  }
  return { kind: 'text', doc: ctextToDoc(raw as CText) };
}
function normalizeBack(raw: unknown): JSONContent {
  return isDoc(raw) ? raw : ctextToDoc(raw as CText);
}
function normalizeCard(raw: unknown): Card {
  const r = (raw ?? {}) as { front?: unknown; back?: unknown };
  return { front: normalizeFront(r.front), back: normalizeBack(r.back) };
}

export const FlashcardsBlock = defineBlock<FlashcardsData>({
  type: 'flashcards',
  label: 'Flashcards',
  description: 'Tarjetas de memoria (frente/reverso)',
  icon: Layers,
  category: 'interactive',
  keywords: ['flashcards', 'tarjetas', 'memoria', 'vocabulario'],
  createDefault: () => ({ cards: [{ front: { kind: 'text', doc: emptyDoc() }, back: emptyDoc() }] }),
  Editor: ({ data, onChange }) => {
    const cards = data.cards.map(normalizeCard);
    const setCard = (i: number, patch: Partial<Card>) => onChange({ cards: cards.map((c, idx) => (idx === i ? { ...c, ...patch } : c)) });
    return (
      <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5 space-y-4">
        <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wide"><Layers className="w-4 h-4" /> Flashcards</div>
        {cards.map((c, i) => (
          <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-start">
            <FrontEditor front={c.front} onChange={(front) => setCard(i, { front })} />
            <div className="rounded-lg border border-border bg-background overflow-hidden">
              <RichTextEditor compact content={c.back} onChange={(doc) => setCard(i, { back: doc })} />
            </div>
            <button type="button" onClick={() => cards.length > 1 && onChange({ cards: cards.filter((_, idx) => idx !== i) })} className="text-muted-foreground hover:text-destructive mt-2"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
        <button type="button" onClick={() => onChange({ cards: [...cards, { front: { kind: 'text', doc: emptyDoc() }, back: emptyDoc() }] })} className="text-xs flex items-center gap-1 text-primary font-semibold"><Plus className="w-3.5 h-3.5" /> Añadir tarjeta</button>
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
          <button type="button" title="Texto" onClick={() => onChange({ kind: 'text', doc: emptyDoc() })} className={`p-1.5 ${front.kind === 'text' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:bg-muted'}`}>
            <Type className="w-3.5 h-3.5" />
          </button>
          <button type="button" title="Imagen" onClick={() => onChange({ kind: 'image', url: '', alt: '' })} className={`p-1.5 border-l border-border ${front.kind === 'image' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:bg-muted'}`}>
            <ImageIcon className="w-3.5 h-3.5" />
          </button>
        </div>
        {front.kind === 'image' && (
          <input value={front.url} onChange={(e) => onChange({ ...front, url: e.target.value })} placeholder="…o pega una URL de imagen" className="flex-1 min-w-0 bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
        )}
      </div>
      {front.kind === 'text' ? (
        <div className="rounded-lg border border-border bg-background overflow-hidden">
          <RichTextEditor compact content={front.doc} onChange={(doc) => onChange({ kind: 'text', doc })} />
        </div>
      ) : (
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
    <button onClick={() => setFlipped((f) => !f)} className="group relative h-32 rounded-xl border border-border bg-card hover:border-primary/50 transition-colors p-3 flex items-center justify-center text-center overflow-hidden">
      <RotateCw className="w-3.5 h-3.5 absolute top-2 right-2 text-muted-foreground/50 group-hover:text-primary z-10" />
      {!flipped && front.kind === 'image' ? (
        front.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={front.url} alt={front.alt ?? ''} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <ImageIcon className="w-8 h-8 text-muted-foreground/40" />
        )
      ) : (
        <div className="font-medium text-sm leading-snug">
          <RichText content={flipped ? card.back : front.kind === 'text' ? front.doc : null} />
        </div>
      )}
    </button>
  );
}
