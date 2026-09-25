'use client';

import { useState } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { MoveHorizontal, ArrowLeft, ArrowRight, Plus, Trash2, Check, X } from 'lucide-react';
import { defineBlock } from '../types';
import { useGradedActivity } from '@/components/learn/LessonAttempt';
import { CText, ctText, ctColor, mkCT, ColorDots } from '../../textColor';

interface SwipeItem {
  label: CText;
  /** Which category this word truly belongs to: 0 = left, 1 = right. */
  category: 0 | 1;
}
export interface SwipeData {
  prompt: CText;
  categoryLeft: CText;
  categoryRight: CText;
  items: SwipeItem[];
}

export const SwipeBlock = defineBlock<SwipeData>({
  type: 'swipe',
  label: 'Swipe (categorizar)',
  description: 'Desliza cada palabra a una de dos categorías',
  icon: MoveHorizontal,
  category: 'interactive',
  keywords: ['swipe', 'deslizar', 'categorizar', 'tinder', 'clasificar', 'vocabulario'],
  isGradable: true,
  createDefault: () => ({ prompt: '', categoryLeft: 'Categoría A', categoryRight: 'Categoría B', items: [{ label: '', category: 0 }] }),
  Editor: ({ data, onChange }) => {
    const setItem = (i: number, patch: Partial<SwipeItem>) =>
      onChange({ ...data, items: data.items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)) });
    return (
      <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5">
        <div className="flex items-center gap-2 mb-3 text-primary font-bold text-xs uppercase tracking-wide">
          <MoveHorizontal className="w-4 h-4" /> Swipe / Categorización
        </div>
        <div className="flex items-center gap-2 mb-3">
          <input
            value={ctText(data.prompt)}
            onChange={(e) => onChange({ ...data, prompt: mkCT(e.target.value, ctColor(data.prompt)) })}
            placeholder="Instrucción (ej: ¿Es una palabra de baño?)"
            className="flex-1 font-semibold bg-background border border-border rounded-xl px-4 py-3 outline-none focus:border-primary"
            style={{ color: ctColor(data.prompt) }}
          />
          <ColorDots color={ctColor(data.prompt)} onPick={(c) => onChange({ ...data, prompt: mkCT(ctText(data.prompt), c) })} />
        </div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-center gap-1.5">
            <ArrowLeft className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              value={ctText(data.categoryLeft)}
              onChange={(e) => onChange({ ...data, categoryLeft: mkCT(e.target.value, ctColor(data.categoryLeft)) })}
              placeholder="Categoría izquierda"
              className="flex-1 min-w-0 font-bold bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
              style={{ color: ctColor(data.categoryLeft) }}
            />
          </div>
          <div className="flex items-center gap-1.5">
            <input
              value={ctText(data.categoryRight)}
              onChange={(e) => onChange({ ...data, categoryRight: mkCT(e.target.value, ctColor(data.categoryRight)) })}
              placeholder="Categoría derecha"
              className="flex-1 min-w-0 font-bold bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary text-right"
              style={{ color: ctColor(data.categoryRight) }}
            />
            <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
          </div>
        </div>
        <div className="space-y-1.5">
          {data.items.map((it, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <input
                value={ctText(it.label)}
                onChange={(e) => setItem(i, { label: mkCT(e.target.value, ctColor(it.label)) })}
                placeholder={`Palabra ${i + 1}`}
                className="flex-1 min-w-0 bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
                style={{ color: ctColor(it.label) }}
              />
              <ColorDots color={ctColor(it.label)} onPick={(c) => setItem(i, { label: mkCT(ctText(it.label), c) })} />
              <div className="flex rounded-lg border border-border overflow-hidden shrink-0">
                <button
                  type="button"
                  onClick={() => setItem(i, { category: 0 })}
                  title={ctText(data.categoryLeft) || 'Izquierda'}
                  className={`px-2 py-1.5 text-[11px] font-bold max-w-[80px] truncate ${it.category === 0 ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:bg-muted'}`}
                >
                  {ctText(data.categoryLeft) || 'Izq.'}
                </button>
                <button
                  type="button"
                  onClick={() => setItem(i, { category: 1 })}
                  title={ctText(data.categoryRight) || 'Derecha'}
                  className={`px-2 py-1.5 text-[11px] font-bold max-w-[80px] truncate border-l border-border ${it.category === 1 ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:bg-muted'}`}
                >
                  {ctText(data.categoryRight) || 'Der.'}
                </button>
              </div>
              <button
                type="button"
                onClick={() => data.items.length > 1 && onChange({ ...data, items: data.items.filter((_, idx) => idx !== i) })}
                className="text-muted-foreground hover:text-destructive shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => onChange({ ...data, items: [...data.items, { label: '', category: 0 }] })}
          className="mt-3 text-xs flex items-center gap-1 text-primary font-semibold"
        >
          <Plus className="w-3.5 h-3.5" /> Añadir palabra
        </button>
      </div>
    );
  },
  Renderer: ({ data, blockId }) => {
    const report = useGradedActivity(blockId);
    const items = data.items;
    const [index, setIndex] = useState(0);
    const [answers, setAnswers] = useState<boolean[]>([]);
    const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
    const current = items[index];

    const choose = (side: 0 | 1) => {
      if (!current || feedback) return;
      const isCorrect = side === current.category;
      setFeedback(isCorrect ? 'correct' : 'wrong');
      setTimeout(() => {
        setAnswers((a) => {
          const next = [...a, isCorrect];
          if (next.length === items.length) report(next.every(Boolean));
          return next;
        });
        setFeedback(null);
        setIndex((i) => i + 1);
      }, 550);
    };

    if (items.length === 0) return null;

    if (index >= items.length) {
      const correctCount = answers.filter(Boolean).length;
      return (
        <div className="my-6 rounded-2xl border border-primary/30 bg-primary/5 p-6 text-center">
          {ctText(data.prompt) && (
            <p className="text-lg font-semibold mb-3" style={{ color: ctColor(data.prompt) }}>
              {ctText(data.prompt)}
            </p>
          )}
          <p className="text-2xl font-bold text-primary mb-1">
            {correctCount} / {items.length}
          </p>
          <p className="text-sm text-muted-foreground mb-4">respuestas correctas</p>
          <button
            type="button"
            onClick={() => {
              setIndex(0);
              setAnswers([]);
            }}
            className="text-xs font-semibold text-primary hover:underline"
          >
            Reintentar
          </button>
        </div>
      );
    }

    return (
      <div className="my-6 rounded-2xl border border-primary/30 bg-primary/5 p-6">
        {ctText(data.prompt) && (
          <p className="text-lg font-semibold text-foreground mb-1 text-center" style={{ color: ctColor(data.prompt) }}>
            {ctText(data.prompt)}
          </p>
        )}
        <p className="text-xs text-muted-foreground text-center mb-4">
          {index + 1} / {items.length}
        </p>

        <div className="flex items-center justify-between gap-3 mb-2 px-1">
          <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground truncate" style={{ color: ctColor(data.categoryLeft) }}>
            ← {ctText(data.categoryLeft)}
          </span>
          <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground truncate text-right" style={{ color: ctColor(data.categoryRight) }}>
            {ctText(data.categoryRight)} →
          </span>
        </div>

        <SwipeCard key={index} label={ctText(current.label)} color={ctColor(current.label)} feedback={feedback} onChoose={choose} />

        <div className="flex items-center justify-center gap-4 mt-5">
          <button
            type="button"
            onClick={() => choose(0)}
            disabled={!!feedback}
            className="px-4 py-2 rounded-lg border border-border bg-background text-sm font-semibold hover:border-primary/50 disabled:opacity-50 flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" /> {ctText(data.categoryLeft)}
          </button>
          <button
            type="button"
            onClick={() => choose(1)}
            disabled={!!feedback}
            className="px-4 py-2 rounded-lg border border-border bg-background text-sm font-semibold hover:border-primary/50 disabled:opacity-50 flex items-center gap-1.5"
          >
            {ctText(data.categoryRight)} <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  },
});

function SwipeCard({
  label,
  color,
  feedback,
  onChoose,
}: {
  label: string;
  color?: string;
  feedback: 'correct' | 'wrong' | null;
  onChoose: (side: 0 | 1) => void;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-150, 150], [-12, 12]);

  return (
    <div className="relative h-40 flex items-center justify-center">
      <motion.div
        drag={feedback ? false : 'x'}
        style={{ x, rotate }}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.7}
        onDragEnd={(_, info) => {
          if (info.offset.x > 100) onChoose(1);
          else if (info.offset.x < -100) onChoose(0);
        }}
        animate={feedback === 'wrong' ? { x: [0, -10, 10, -10, 0] } : { x: 0 }}
        transition={{ duration: 0.35 }}
        className={`absolute w-full max-w-xs h-32 rounded-2xl border-2 bg-card flex items-center justify-center text-center px-4 cursor-grab active:cursor-grabbing select-none font-semibold text-lg touch-none ${
          feedback === 'correct' ? 'border-green-500 bg-green-500/10' : feedback === 'wrong' ? 'border-red-500 bg-red-500/10' : 'border-border'
        }`}
      >
        <span style={{ color: !feedback ? color : undefined }}>{label}</span>
        {feedback === 'correct' && <Check className="w-6 h-6 text-green-500 absolute top-2 right-2" />}
        {feedback === 'wrong' && <X className="w-6 h-6 text-red-500 absolute top-2 right-2" />}
      </motion.div>
    </div>
  );
}
