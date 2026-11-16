/**
 * Exam grading engine (server-only).
 *
 * Lesson content ships correct answers to the browser, which is fine for
 * practice but unacceptable for certification. Here every question is
 * stripped of its answer before it reaches the client, and grading happens
 * on the server against the original block stored in the database.
 *
 * Question types: quiz, multi-choice, true-false, fill-blank, short-answer,
 * matching, ordering, classification, image-labeling and image-hotspot (the
 * last one only when the author marked the correct spot).
 *
 * Every question is worth one point, all or nothing (like fill-blank).
 *
 * Kept free of `@/` imports so it can run under plain Node (see the tests).
 */

import { ctText, type CText } from '../ctext.ts';

export const SUPPORTED_QUESTION_TYPES = [
  'quiz',
  'multi-choice',
  'true-false',
  'fill-blank',
  'short-answer',
  'matching',
  'ordering',
  'classification',
  'image-labeling',
  'image-hotspot',
] as const;

export type QuestionType = (typeof SUPPORTED_QUESTION_TYPES)[number];

export function isSupportedQuestion(type: string): type is QuestionType {
  return (SUPPORTED_QUESTION_TYPES as readonly string[]).includes(type);
}

/**
 * Blocks that only show something (no score). In the exam they travel with the
 * question that follows them, so a shuffle never separates a picture or an
 * audio from its question.
 */
export const CONTEXT_BLOCK_TYPES = ['image', 'audio', 'callout'] as const;

/**
 * Block types offered in the lesson's "Evaluación" tab: the question types,
 * the display blocks that go with them, and headings/text for instructions.
 */
export const QUIZ_EDITOR_TYPES: string[] = ['heading', 'text', ...CONTEXT_BLOCK_TYPES, ...SUPPORTED_QUESTION_TYPES];

/** An image-hotspot is only a question when the author marked the correct spot. */
const hasCorrectSpot = (d: Record<string, unknown>) =>
  Number.isInteger(d.correctSpot) && Array.isArray(d.spots) && (d.correctSpot as number) >= 0 && (d.correctSpot as number) < d.spots.length;

/** True when the block counts as an exam question (and is graded). */
export function isExamQuestion(block: RawBlock): boolean {
  if (!isSupportedQuestion(block.type)) return false;
  return block.type !== 'image-hotspot' || hasCorrectSpot(block.data ?? {});
}

/** True when the block is shown with the question that follows it. */
export function isContextBlock(block: RawBlock): boolean {
  if ((CONTEXT_BLOCK_TYPES as readonly string[]).includes(block.type)) return true;
  return block.type === 'image-hotspot' && !hasCorrectSpot(block.data ?? {});
}

/** A display block sent along with a question. Display blocks carry no answers. */
export interface PublicContext {
  id: string;
  type: string;
  data: Record<string, unknown>;
}

/** A question as sent to the browser — never contains the answer. */
export interface PublicQuestion {
  id: string;
  type: QuestionType;
  prompt: string;
  /** Options for choice questions; for ordering the (shuffled) items; for matching the shuffled right side; for the image/classification types the shuffled labels. */
  options?: string[];
  /** For fill-blank: the sentence with blanks masked, plus how many blanks. */
  segments?: string[];
  blanks?: number;
  /** matching: the left side, in order. */
  lefts?: string[];
  /** classification: category names, in order. */
  categories?: string[];
  /** image-labeling / image-hotspot. */
  imageUrl?: string;
  /** Pin positions in percent (no labels: those are the answers). */
  points?: { x: number; y: number }[];
  /** Display blocks (image, audio, callout) that go with this question. */
  context?: PublicContext[];
}

export type AnswerValue = number | number[] | boolean | string | string[] | string[][] | null;

export interface RawBlock {
  id: string;
  type: string;
  data: Record<string, unknown>;
}

/**
 * Flattens a lesson's stored content into a list of blocks, descending into
 * container blocks (columns / container) so nested activities are eligible
 * as exam questions too.
 */
export function flattenBlocks(raw: unknown): RawBlock[] {
  if (!Array.isArray(raw)) return [];
  const out: RawBlock[] = [];

  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const block = item as { id?: unknown; type?: unknown; data?: unknown };
    if (typeof block.id !== 'string' || typeof block.type !== 'string') continue;

    const data = (block.data ?? {}) as Record<string, unknown>;
    out.push({ id: block.id, type: block.type, data });

    if (block.type === 'columns' && Array.isArray(data.columns)) {
      for (const column of data.columns as unknown[]) out.push(...flattenBlocks(column));
    }
    if (block.type === 'container' && Array.isArray(data.children)) {
      out.push(...flattenBlocks(data.children));
    }
  }
  return out;
}

export interface ExamQuestionSource {
  block: RawBlock;
  /** Display blocks written right before this question (since the previous question). */
  context: RawBlock[];
}

/**
 * The questions of a lesson's evaluation, each with the display blocks (image, audio,
 * callout) that precede it. Display blocks after the last question are dropped, and
 * headings/text are ignored (as before), without breaking the grouping.
 */
export function collectExamQuestions(rawQuiz: unknown): ExamQuestionSource[] {
  const out: ExamQuestionSource[] = [];
  let pending: RawBlock[] = [];
  for (const block of flattenBlocks(rawQuiz)) {
    if (isExamQuestion(block)) {
      out.push({ block, context: pending });
      pending = [];
    } else if (isContextBlock(block)) {
      pending.push(block);
    }
  }
  return out;
}

const BLANK_RE = /(\{\{.*?\}\})/;
const isBlank = (part: string) => part.startsWith('{{') && part.endsWith('}}');
const splitBlanks = (text: string) => (text || '').split(new RegExp(BLANK_RE, 'g'));

const norm = (s: unknown) => String(s ?? '').trim().toLowerCase();

function shuffled<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const isStringArray = (v: unknown): v is string[] => Array.isArray(v) && v.every((x) => typeof x === 'string');

/** Items of a classification, per category, as the student sees them (blank ones are skipped). */
const classificationItems = (d: Record<string, unknown>): string[][] =>
  arr(d.categories).map((c) =>
    arr((c as { items?: unknown })?.items)
      .map((it) => ctText(it as CText))
      .filter((s) => s.trim() !== '')
  );

const point = (p: unknown) => {
  const o = (p ?? {}) as { x?: unknown; y?: unknown };
  return { x: Number(o.x) || 0, y: Number(o.y) || 0 };
};

function toPublicContext(block: RawBlock): PublicContext {
  // Display blocks hold no answers, except an image-hotspot WITHOUT a correct spot, which is just a viewer.
  return { id: block.id, type: block.type, data: block.data ?? {} };
}

/** Removes every answer-bearing field so the question is safe to send. */
export function toPublicQuestion(block: RawBlock, context: RawBlock[] = []): PublicQuestion | null {
  if (!isExamQuestion(block)) return null;
  const q = toPublicBase(block);
  if (!q) return null;
  return context.length > 0 ? { ...q, context: context.map(toPublicContext) } : q;
}

function toPublicBase(block: RawBlock): PublicQuestion | null {
  const d = block.data ?? {};

  switch (block.type) {
    case 'quiz':
      return {
        id: block.id,
        type: 'quiz',
        prompt: ctText(d.question as CText),
        options: Array.isArray(d.options) ? (d.options as CText[]).map(ctText) : [],
      };
    case 'multi-choice':
      return {
        id: block.id,
        type: 'multi-choice',
        prompt: ctText(d.question as CText),
        options: Array.isArray(d.options) ? (d.options as CText[]).map(ctText) : [],
      };
    case 'true-false':
      return { id: block.id, type: 'true-false', prompt: ctText(d.statement as CText) };
    case 'fill-blank': {
      const parts = splitBlanks(ctText(d.text as CText));
      return {
        id: block.id,
        type: 'fill-blank',
        prompt: 'Completa los espacios',
        // Blanks are replaced by an empty marker so the answer never ships.
        segments: parts.map((p) => (isBlank(p) ? '' : p)),
        blanks: parts.filter(isBlank).length,
      };
    }
    case 'short-answer':
      return { id: block.id, type: 'short-answer', prompt: ctText(d.question as CText) };

    case 'matching': {
      const pairs = arr(d.pairs) as { left?: CText; right?: unknown }[];
      return {
        id: block.id,
        type: 'matching',
        prompt: ctText(d.prompt as CText),
        lefts: pairs.map((p) => ctText(p?.left)),
        // Only the shuffled right side: the order of `lefts` no longer says which goes with which.
        options: shuffled(pairs.map((p) => String(p?.right ?? ''))),
      };
    }
    case 'ordering': {
      const items = arr(d.items).map((it) => ctText(it as CText));
      let options = shuffled(items);
      if (items.length > 1 && options.every((v, i) => v === items[i])) options = shuffled(items);
      return { id: block.id, type: 'ordering', prompt: ctText(d.prompt as CText), options };
    }
    case 'classification': {
      const cats = arr(d.categories) as { name?: CText }[];
      return {
        id: block.id,
        type: 'classification',
        prompt: ctText(d.prompt as CText),
        categories: cats.map((c) => ctText(c?.name)),
        options: shuffled(classificationItems(d).flat()),
      };
    }
    case 'image-labeling': {
      const points = arr(d.points) as { label?: unknown }[];
      return {
        id: block.id,
        type: 'image-labeling',
        prompt: ctText(d.prompt as CText),
        imageUrl: String(d.imageUrl ?? ''),
        points: points.map(point),
        options: shuffled(points.map((p) => String(p?.label ?? ''))),
      };
    }
    case 'image-hotspot':
      return {
        id: block.id,
        type: 'image-hotspot',
        prompt: ctText(d.prompt as CText),
        imageUrl: String(d.imageUrl ?? ''),
        points: arr(d.spots).map(point), // positions only: no labels, no correct index
      };
    default:
      return null;
  }
}

/** Grades one answer against the original (answer-bearing) block. */
export function gradeBlock(block: RawBlock, answer: AnswerValue): boolean {
  const d = block.data ?? {};

  switch (block.type) {
    case 'quiz':
      return typeof answer === 'number' && answer === Number(d.correctIndex);

    case 'multi-choice': {
      if (!Array.isArray(answer)) return false;
      const expected = Array.isArray(d.correctIndices) ? (d.correctIndices as number[]) : [];
      const got = (answer as number[]).map(Number);
      return (
        expected.length === got.length &&
        [...expected].sort((a, b) => a - b).join(',') === [...got].sort((a, b) => a - b).join(',')
      );
    }

    case 'true-false':
      return typeof answer === 'boolean' && answer === Boolean(d.answer);

    case 'fill-blank': {
      if (!Array.isArray(answer)) return false;
      const expected = splitBlanks(ctText(d.text as CText))
        .filter(isBlank)
        .map((p) => p.slice(2, -2));
      if (expected.length === 0) return false;
      return expected.every((exp, i) => norm((answer as string[])[i]) === norm(exp));
    }

    case 'short-answer': {
      if (typeof answer !== 'string') return false;
      const accepted = Array.isArray(d.answers) ? (d.answers as string[]) : [];
      const caseSensitive = Boolean(d.caseSensitive);
      const cmp = (s: string) => (caseSensitive ? String(s).trim() : norm(s));
      return accepted.some((a) => cmp(a) === cmp(answer));
    }

    // Answer = the right-hand value picked for each left item, in order.
    case 'matching': {
      const pairs = arr(d.pairs) as { right?: unknown }[];
      if (pairs.length === 0 || !isStringArray(answer) || answer.length !== pairs.length) return false;
      return pairs.every((p, i) => answer[i] === String(p?.right ?? ''));
    }

    // Answer = the item texts in the order the student put them.
    case 'ordering': {
      const items = arr(d.items).map((it) => ctText(it as CText));
      if (items.length === 0 || !isStringArray(answer) || answer.length !== items.length) return false;
      return items.every((it, i) => answer[i] === it);
    }

    // Answer = for each category (in order), the item texts the student put in it.
    case 'classification': {
      const expected = classificationItems(d);
      if (expected.flat().length === 0 || !Array.isArray(answer) || answer.length !== expected.length) return false;
      const got = answer as unknown[];
      if (!got.every(isStringArray)) return false;
      const key = (list: string[]) => JSON.stringify([...list].sort());
      return expected.every((items, ci) => key(items) === key(got[ci] as string[]));
    }

    // Answer = the label picked for each point, in order.
    case 'image-labeling': {
      const points = arr(d.points) as { label?: unknown }[];
      if (points.length === 0 || !isStringArray(answer) || answer.length !== points.length) return false;
      return points.every((p, i) => answer[i] === String(p?.label ?? ''));
    }

    // Answer = the index of the spot the student tapped.
    case 'image-hotspot':
      return hasCorrectSpot(d) && typeof answer === 'number' && answer === d.correctSpot;

    default:
      return false;
  }
}

export interface GradeResult {
  correct: number;
  total: number;
  score: number;
  perQuestion: { id: string; correct: boolean }[];
}

export function gradeExam(blocks: RawBlock[], answers: Record<string, AnswerValue>): GradeResult {
  const perQuestion = blocks.map((b) => ({ id: b.id, correct: gradeBlock(b, answers[b.id] ?? null) }));
  const correct = perQuestion.filter((q) => q.correct).length;
  const total = perQuestion.length;
  return { correct, total, score: total ? Math.round((correct / total) * 100) : 0, perQuestion };
}

/** Deterministic-free shuffle used when picking questions for an attempt. */
export function pickRandom<T>(items: T[], count: number): T[] {
  const pool = [...items];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.min(count, pool.length));
}
