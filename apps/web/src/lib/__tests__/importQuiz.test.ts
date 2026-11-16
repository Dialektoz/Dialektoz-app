// Importer: what "quiz" (Evaluación) accepts. Run with `npm test`.
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildBlocks, QUIZ_TYPES } from '../lessonImport.ts';
import { QUIZ_EDITOR_TYPES } from '../exam/grading.ts';

function build(blocks: unknown[]) {
  const errors: string[] = [];
  const out = buildBlocks(
    blocks,
    {
      errors,
      files: new Map(),
      resolveFile: (file: string) => `https://cdn.test/${file}`,
      newId: (path: string) => path,
    },
    'quiz'
  );
  return { out, errors };
}

const ok = (block: unknown) => {
  const { out, errors } = build([block]);
  assert.deepEqual(errors, []);
  assert.equal(out.length, 1);
  return out[0];
};
const bad = (block: unknown, expected?: RegExp) => {
  const { errors } = build([block]);
  assert.ok(errors.length > 0, 'se esperaba al menos un error');
  if (expected) assert.match(errors.join('\n'), expected);
};

test('la lista del importador y la del editor son la misma', () => {
  assert.deepEqual([...QUIZ_TYPES].sort(), [...QUIZ_EDITOR_TYPES].sort());
});

test('tipos que siguen fuera de quiz', () => {
  for (const type of ['gallery', 'table', 'swipe', 'essay', 'accordion', 'tabs', 'quote', 'divider', 'timeline', 'code', 'button', 'columns', 'container', 'video', 'file', 'embed', 'flashcards']) {
    bad({ type }, /no se puede usar en "quiz"|no soportado|debe/);
  }
});

test('un error en cualquier bloque rechaza todo (no se importa nada parcial)', () => {
  const { errors } = build([
    { type: 'true-false', statement: 'Sky is blue', answer: true },
    { type: 'matching', prompt: 'x', pairs: [{ left: 'a', right: 'b' }] }, // falta un par
  ]);
  assert.ok(errors.length > 0);
});

// ── solo muestran ───────────────────────────────────────────────────────────
test('image: válido e inválido', () => {
  ok({ type: 'image', img: 'casa.png', alt: 'Una casa', caption: 'La casa' });
  bad({ type: 'image', img: 'casa.png', alto: 'x' }, /alto/); // clave desconocida
  bad({ type: 'image' }); // falta la imagen
  bad({ type: 'image', img: 'casa.exe' }); // extensión no permitida
});

test('audio: válido e inválido', () => {
  ok({ type: 'audio', file: 'dialogo.mp3', title: 'Dialogue' });
  bad({ type: 'audio', file: 'dialogo.mp3', volumen: 3 }, /volumen/);
  bad({ type: 'audio', file: 'dialogo.pdf' });
});

test('callout: válido e inválido', () => {
  ok({ type: 'callout', text: 'Listen carefully', variant: 'tip' });
  bad({ type: 'callout', text: 'x', variant: 'rainbow' });
  bad({ type: 'callout', text: 'x', color: 'red' }, /color/);
});

// ── se califican ────────────────────────────────────────────────────────────
test('matching', () => {
  ok({ type: 'matching', prompt: 'Une', pairs: [{ left: 'dog', right: 'perro' }, { left: 'cat', right: 'gato' }] });
  bad({ type: 'matching', prompt: 'Une', pairs: [{ left: 'dog', right: 'perro' }] }, /al menos|pares/);
  bad({ type: 'matching', prompt: 'Une', pairs: [{ left: 'dog', right: 'perro' }, { left: 'cat', right: 'perro' }] }, /repetidos/);
  bad({ type: 'matching', prompt: 'Une', pairs: [{ left: 'a', right: 'b' }, { left: 'c', right: 'd' }], extra: 1 }, /extra/);
});

test('ordering', () => {
  ok({ type: 'ordering', prompt: 'Ordena', items: ['I', 'am', 'happy'] });
  bad({ type: 'ordering', prompt: 'Ordena', items: ['solo'] }, /al menos|elementos/);
  bad({ type: 'ordering', prompt: 'Ordena', items: ['a', 'a'] }, /repetidos/);
  bad({ type: 'ordering', prompt: 'Ordena', items: ['a', 'b'], orden: 1 }, /orden/);
});

test('classification', () => {
  ok({ type: 'classification', prompt: 'Clasifica', categories: [{ name: 'Fruit', items: ['apple'] }, { name: 'Animal', items: ['dog'] }] });
  bad({ type: 'classification', prompt: 'Clasifica', categories: [{ name: 'Fruit', items: ['apple'] }] }, /al menos|categorías/);
  bad({ type: 'classification', prompt: 'Clasifica', categories: [{ name: 'A', items: [] }, { name: 'B', items: [] }] }, /al menos un elemento/);
  bad({ type: 'classification', prompt: 'x', categories: [{ name: 'A', items: ['x'] }, { name: 'A', items: ['y'] }] }, /repetidos/);
});

test('image-labeling', () => {
  ok({ type: 'image-labeling', img: 'casa.png', prompt: 'Etiqueta', points: [{ x: 10, y: 20, label: 'door' }, { x: 50, y: 60, label: 'window' }] });
  bad({ type: 'image-labeling', img: 'casa.png', prompt: 'x', points: [] }, /al menos|punto/);
  bad({ type: 'image-labeling', img: 'casa.png', prompt: 'x', points: [{ x: 10, y: 20, label: 'a' }, { x: 1, y: 2, label: 'a' }] }, /únicas/);
  bad({ type: 'image-labeling', img: 'casa.png', prompt: 'x', points: [{ x: 150, y: 20, label: 'a' }] }, /entre 0 y 100|0/);
});

test('image-hotspot: con y sin correctSpot', () => {
  const spots = [{ x: 10, y: 20, label: 'door' }, { x: 50, y: 60, label: 'window' }];
  const viewer = ok({ type: 'image-hotspot', img: 'casa.png', prompt: 'Explora', spots }).data as Record<string, unknown>;
  assert.equal('correctSpot' in viewer, false, 'sin correctSpot sigue siendo solo visual');
  const graded = ok({ type: 'image-hotspot', img: 'casa.png', prompt: 'Toca la puerta', spots, correctSpot: 0 }).data as Record<string, unknown>;
  assert.equal(graded.correctSpot, 0);
  bad({ type: 'image-hotspot', img: 'casa.png', prompt: 'x', spots, correctSpot: 2 }, /correctSpot/);
  bad({ type: 'image-hotspot', img: 'casa.png', prompt: 'x', spots, correctSpot: '0' }, /correctSpot/);
  bad({ type: 'image-hotspot', img: 'casa.png', prompt: 'x', spots, correcta: 0 }, /correcta/);
});

test('los 7 tipos de siempre siguen válidos', () => {
  ok({ type: 'quiz', question: 'Capital?', options: ['A', 'B'], correctIndex: 0 });
  ok({ type: 'true-false', statement: 'x', answer: true });
  ok({ type: 'fill-blank', text: 'She {{is}} a teacher.' });
  ok({ type: 'short-answer', question: 'Cat?', answers: ['gato'] });
  ok({ type: 'heading', text: 'Part 1' });
  ok({ type: 'text', paragraphs: ['Read.'] });
});

test('el lesson.json de ejemplo (all-blocks) es válido, con los tipos nuevos en quiz', async () => {
  const { readFileSync } = await import('node:fs');
  const { SKILLS } = await import('../skills.ts');
  const { validateLesson } = await import('../lessonImport.ts');
  const raw = JSON.parse(readFileSync(new URL('../../../scripts/import-lesson/examples/all-blocks/lesson.json', import.meta.url), 'utf8'));
  const v = validateLesson(raw, { skills: SKILLS, mode: 'cli' });
  const errors = [...v.errors];
  const ctx = { errors, files: new Map(), resolveFile: (f: string) => `https://cdn.test/${f}`, newId: (p: string) => p };
  const quiz = buildBlocks(v.quiz ?? [], ctx, 'quiz');
  buildBlocks(v.content ?? [], ctx, 'content');
  assert.deepEqual(errors, []);
  const types = quiz.map((b) => b.type);
  for (const t of ['matching', 'ordering', 'classification', 'callout', 'image', 'image-labeling', 'image-hotspot']) assert.ok(types.includes(t), t);
});

// ── importar desde la pestaña Evaluación ────────────────────────────────────
test('lista simple: por defecto es content; desde Evaluación es quiz', async () => {
  const { validateLesson } = await import('../lessonImport.ts');
  const { SKILLS } = await import('../skills.ts');
  const list = [{ type: 'true-false', statement: 'x', answer: true }];

  const asContent = validateLesson(list, { skills: SKILLS, mode: 'editor' });
  assert.equal(asContent.content?.length, 1);
  assert.equal(asContent.quiz, undefined);

  const asQuiz = validateLesson(list, { skills: SKILLS, mode: 'editor', bareArrayTarget: 'quiz' });
  assert.deepEqual(asQuiz.errors, []);
  assert.deepEqual(asQuiz.content, []);
  assert.equal(asQuiz.quiz?.length, 1);

  // y lo que va en quiz se valida con los tipos de Evaluación
  const errors: string[] = [];
  const ctx = { errors, files: new Map(), resolveFile: (f: string) => f, newId: (p: string) => p };
  buildBlocks([{ type: 'gallery', images: [] }], ctx, 'quiz');
  assert.ok(errors.length > 0);
});

test('un lesson.json de objeto no depende de bareArrayTarget', async () => {
  const { validateLesson } = await import('../lessonImport.ts');
  const { SKILLS } = await import('../skills.ts');
  const raw = { quiz: [{ type: 'true-false', statement: 'x', answer: true }] };
  const a = validateLesson(raw, { skills: SKILLS, mode: 'editor' });
  const b = validateLesson(raw, { skills: SKILLS, mode: 'editor', bareArrayTarget: 'quiz' });
  assert.deepEqual(a, b);
  assert.equal(a.quiz?.length, 1);
});

test('el ejemplo evaluation-only (solo quiz) es válido', async () => {
  const { readFileSync } = await import('node:fs');
  const { SKILLS } = await import('../skills.ts');
  const { validateLesson } = await import('../lessonImport.ts');
  const raw = JSON.parse(readFileSync(new URL('../../../scripts/import-lesson/examples/evaluation-only/lesson.json', import.meta.url), 'utf8'));
  for (const mode of ['cli', 'editor'] as const) {
    const v = validateLesson(raw, { skills: SKILLS, mode });
    const errors = [...v.errors];
    const ctx = { errors, files: new Map(), resolveFile: (f: string) => `https://cdn.test/${f}`, newId: (p: string) => p };
    const quiz = buildBlocks(v.quiz ?? [], ctx, 'quiz');
    assert.deepEqual(errors, [], mode);
    assert.equal(v.content?.length, 0);
    assert.ok(quiz.length >= 10);
  }
});
