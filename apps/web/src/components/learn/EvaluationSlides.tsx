'use client';

import { useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { getBlock, normalizeBlocks } from '@/components/editor/blocks/registry';

/**
 * Renders the evaluation one card at a time (a slide per block) with
 * Next/Prev navigation.
 *
 * Every slide stays MOUNTED (inactive ones are hidden with CSS, not
 * unmounted), so each question keeps its answered state and still registers
 * with the lesson attempt context — the "answer everything to complete"
 * rule and the score keep working.
 */
export default function EvaluationSlides({ blocks }: { blocks: unknown }) {
  const instances = normalizeBlocks(blocks);
  const [index, setIndex] = useState(0);

  if (instances.length === 0) return null;
  const total = instances.length;
  const clamped = Math.min(index, total - 1);

  return (
    <div>
      <div className="rounded-2xl border border-border bg-card p-5 md:p-6">
        {instances.map((block, i) => {
          const def = getBlock(block.type);
          if (!def) return null;
          const Renderer = def.Renderer;
          return (
            <div key={block.id} className={i === clamped ? 'block' : 'hidden'}>
              <Renderer data={block.data} blockId={block.id} />
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-3 mt-4">
        <button
          type="button"
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={clamped === 0}
          className="inline-flex items-center gap-2 border border-border font-semibold px-4 py-2 rounded-lg text-sm disabled:opacity-40 hover:bg-muted transition-colors"
        >
          <ArrowLeft className="size-4" /> Anterior
        </button>

        <div className="flex items-center gap-1.5">
          {instances.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Ir a la tarjeta ${i + 1}`}
              className={`size-2 rounded-full transition-all ${i === clamped ? 'bg-primary w-5' : 'bg-muted hover:bg-foreground/30'}`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => setIndex((i) => Math.min(total - 1, i + 1))}
          disabled={clamped === total - 1}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-4 py-2 rounded-lg text-sm disabled:opacity-40 transition-colors"
        >
          Siguiente <ArrowRight className="size-4" />
        </button>
      </div>
    </div>
  );
}
