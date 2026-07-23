/**
 * Exam grading engine (server-only).
 *
 * Lesson content ships correct answers to the browser, which is fine for
 * practice but unacceptable for certification. Here every question is
 * stripped of its answer before it reaches the client, and grading happens
 * on the server against the original block stored in the database.
 *
 * Supported question types (v1): quiz, multi-choice, true-false,
 * fill-blank and short-answer.
 */

export const SUPPORTED_QUESTION_TYPES = [
  'quiz',
  'multi-choice',
  'true-false',
  'fill-blank',
  'short-answer',
] as const;

export type QuestionType = (typeof SUPPORTED_QUESTION_TYPES)[number];

export function isSupportedQuestion(type: string): type is QuestionType {
  return (SUPPORTED_QUESTION_TYPES as readonly string[]).includes(type);
}

/**
 * Block types offered in the lesson's "Evaluación" tab: the certifiable
 * question types plus headings/text for instructions. Restricting the picker
 * guarantees everything a teacher puts there actually counts toward the
 * level's certification exam.
 */
export const QUIZ_EDITOR_TYPES: string[] = ['heading', 'text', ...SUPPORTED_QUESTION_TYPES];

/** A question as sent to the browser — never contains the answer. */
export interface PublicQuestion {
  id: string;
  type: QuestionType;
  prompt: string;
  /** Options for choice questions. */
  options?: string[];
  /** For fill-blank: the sentence with blanks masked, plus how many blanks. */
  segments?: string[];
  blanks?: number;
}

export type AnswerValue = number | number[] | boolean | string | string[] | null;

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

const BLANK_RE = /(\{\{.*?\}\})/;
const isBlank = (part: string) => part.startsWith('{{') && part.endsWith('}}');
const splitBlanks = (text: string) => (text || '').split(new RegExp(BLANK_RE, 'g'));

const norm = (s: unknown) => String(s ?? '').trim().toLowerCase();

/** Removes every answer-bearing field so the question is safe to send. */
export function toPublicQuestion(block: RawBlock): PublicQuestion | null {
  if (!isSupportedQuestion(block.type)) return null;
  const d = block.data ?? {};

  switch (block.type) {
    case 'quiz':
      return {
        id: block.id,
        type: 'quiz',
        prompt: String(d.question ?? ''),
        options: Array.isArray(d.options) ? (d.options as string[]) : [],
      };
    case 'multi-choice':
      return {
        id: block.id,
        type: 'multi-choice',
        prompt: String(d.question ?? ''),
        options: Array.isArray(d.options) ? (d.options as string[]) : [],
      };
    case 'true-false':
      return { id: block.id, type: 'true-false', prompt: String(d.statement ?? '') };
    case 'fill-blank': {
      const parts = splitBlanks(String(d.text ?? ''));
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
      return { id: block.id, type: 'short-answer', prompt: String(d.question ?? '') };
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
      const expected = splitBlanks(String(d.text ?? ''))
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
