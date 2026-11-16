'use client';

import { useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { getBlock, normalizeBlocks } from '@/components/editor/blocks/registry';
import { isContextBlock } from '@/lib/exam/grading';
import type { RawBlock } from '@/lib/exam/grading';

/**
 * Renders the evaluation one card at a time (a slide per block) with
 * Next/Prev navigation.
 *
 * Every slide stays MOUNTED (inactive ones are hidden with CSS, not
 * unmounted), so each question keeps its answered state and still registers
 * with the lesson attempt context — the "answer everything to complete"
 * rule and the score keep working.
 *
 * Image / audio / callout blocks (display only) share the slide of the question that follows
 * them, so a picture or a recording is never separated from its question.
 */
export default function EvaluationSlides({ blocks }: { blocks: unknown }) {
  const instances = normalizeBlocks(blocks);
  const slides = groupSlides(instances);
  const [index, setIndex] = useState(0);

  if (slides.length === 0) return null;
  const total = slides.length;
  const clamped = Math.min(index, total - 1);

  return (
    <div>
      <div className="rounded-2xl border border-border bg-card p-5 md:p-6">
        {slides.map((slide, i) => (
          <div key={slide[0].id} className={i === clamped ? 'block' : 'hidden'}>
            {slide.map((block) => {
              const def = getBlock(block.type);
              if (!def) return null;
              const Renderer = def.Renderer;
              return <Renderer key={block.id} data={block.data} blockId={block.id} />;
            })}
          </div>
        ))}
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
          {slides.map((_, i) => (
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

type Instance = ReturnType<typeof normalizeBlocks>[number];

/**
 * One slide per block, except that display-only blocks (image, audio, callout, a viewer-only
 * hotspot) join the question that follows. Headings/text keep their own slide and don't break
 * the grouping (same rule as the certification exam).
 */
function groupSlides(instances: Instance[]): Instance[][] {
  const slides: Instance[][] = [];
  let pending: Instance[] = [];
  for (const block of instances) {
    if (isContextBlock(block as unknown as RawBlock)) pending.push(block);
    else if (block.type === 'heading' || block.type === 'text') slides.push([block]);
    else {
      slides.push([...pending, block]);
      pending = [];
    }
  }
  if (pending.length > 0) slides.push(pending); // trailing display blocks with no question after them
  return slides;
}
