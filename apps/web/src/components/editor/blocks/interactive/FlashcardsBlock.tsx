'use client';

import { useState } from 'react';
import { Layers, Plus, Trash2, RotateCw } from 'lucide-react';
import { defineBlock } from '../types';

interface Card {
  front: string;
  back: string;
}
export interface FlashcardsData {
  cards: Card[];
}

export const FlashcardsBlock = defineBlock<FlashcardsData>({
  type: 'flashcards',
  label: 'Flashcards',
  description: 'Tarjetas de memoria (frente/reverso)',
  icon: Layers,
  category: 'interactive',
  keywords: ['flashcards', 'tarjetas', 'memoria', 'vocabulario'],
  createDefault: () => ({ cards: [{ front: '', back: '' }] }),
  Editor: ({ data, onChange }) => {
    const setCard = (i: number, patch: Partial<Card>) => onChange({ cards: data.cards.map((c, idx) => (idx === i ? { ...c, ...patch } : c)) });
    return (
      <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5 space-y-3">
        <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wide"><Layers className="w-4 h-4" /> Flashcards</div>
        {data.cards.map((c, i) => (
          <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
            <input value={c.front} onChange={(e) => setCard(i, { front: e.target.value })} placeholder="Frente" className="bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
            <input value={c.back} onChange={(e) => setCard(i, { back: e.target.value })} placeholder="Reverso" className="bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
            <button type="button" onClick={() => data.cards.length > 1 && onChange({ cards: data.cards.filter((_, idx) => idx !== i) })} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
        <button type="button" onClick={() => onChange({ cards: [...data.cards, { front: '', back: '' }] })} className="text-xs flex items-center gap-1 text-primary font-semibold"><Plus className="w-3.5 h-3.5" /> Añadir tarjeta</button>
      </div>
    );
  },
  Renderer: ({ data }) => (
    <div className="my-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
      {data.cards.map((c, i) => <Flashcard key={i} card={c} />)}
    </div>
  ),
});

function Flashcard({ card }: { card: Card }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <button onClick={() => setFlipped((f) => !f)} className="group relative h-32 rounded-xl border border-border bg-card hover:border-primary/50 transition-colors p-4 flex items-center justify-center text-center">
      <RotateCw className="w-3.5 h-3.5 absolute top-2 right-2 text-muted-foreground/50 group-hover:text-primary" />
      <span className={`font-medium ${flipped ? 'text-primary' : 'text-foreground'}`}>{flipped ? card.back : card.front}</span>
    </button>
  );
}
