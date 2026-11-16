// Exam engine: scoring of the graded blocks, answer-free public questions, and grouping of
// image/audio/callout with their question. Run with `npm test`.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  collectExamQuestions,
  gradeBlock,
  gradeExam,
  isExamQuestion,
  toPublicQuestion,
  type RawBlock,
} from '../exam/grading.ts';

const blk = (id: string, type: string, data: Record<string, unknown>): RawBlock => ({ id, type, data });

const matching = blk('m', 'matching', {
  prompt: 'Une',
  pairs: [
    { left: 'dog', right: 'perro' },
    { left: { t: 'cat', c: '#f00' }, right: 'gato' },
    { left: 'bird', right: 'pájaro' },
  ],
});
const ordering = blk('o', 'ordering', { prompt: 'Ordena', items: ['I', { t: 'am', c: '#00f' }, 'happy', 'today'] });
const classification = blk('c', 'classification', {
  prompt: 'Clasifica',
  categories: [
    { name: 'Fruit', items: ['apple', 'banana', ''] },
    { name: { t: 'Animal', c: '#0a0' }, items: ['dog'] },
  ],
});
const labeling = blk('l', 'image-labeling', {
  imageUrl: 'https://cdn.test/h.png',
  prompt: 'Etiqueta',
  points: [
    { x: 10, y: 20, label: 'door' },
    { x: 50, y: 60, label: 'window' },
    { x: 80, y: 30, label: 'roof' },
  ],
});
const hotspot = blk('h', 'image-hotspot', {
  imageUrl: 'https://cdn.test/h.png',
  prompt: 'Toca la puerta',
  spots: [
    { x: 10, y: 20, label: 'door' },
    { x: 50, y: 60, label: 'window' },
  ],
  correctSpot: 1,
});

// ── puntaje: matching ───────────────────────────────────────────────────────
test('matching: todo o nada', () => {
  assert.equal(gradeBlock(matching, ['perro', 'gato', 'pájaro']), true);
  assert.equal(gradeBlock(matching, ['perro', 'pájaro', 'gato']), false); // un par mal
  assert.equal(gradeBlock(matching, ['perro', 'gato']), false); // incompleto
  assert.equal(gradeBlock(matching, ['perro', 'gato', 'pájaro', 'extra']), false);
  assert.equal(gradeBlock(matching, null), false);
  assert.equal(gradeBlock(matching, 'perro'), false);
  assert.equal(gradeBlock(matching, [1, 2, 3] as unknown as string[]), false);
});

// ── puntaje: ordering ───────────────────────────────────────────────────────
test('ordering: todo o nada', () => {
  assert.equal(gradeBlock(ordering, ['I', 'am', 'happy', 'today']), true);
  assert.equal(gradeBlock(ordering, ['am', 'I', 'happy', 'today']), false);
  assert.equal(gradeBlock(ordering, ['I', 'am', 'happy']), false);
  assert.equal(gradeBlock(ordering, null), false);
  assert.equal(gradeBlock(ordering, 3), false);
});

// ── puntaje: classification ─────────────────────────────────────────────────
test('classification: todo o nada, sin importar el orden dentro de la categoría', () => {
  assert.equal(gradeBlock(classification, [['apple', 'banana'], ['dog']]), true);
  assert.equal(gradeBlock(classification, [['banana', 'apple'], ['dog']]), true);
  assert.equal(gradeBlock(classification, [['apple'], ['dog', 'banana']]), false); // uno en la categoría equivocada
  assert.equal(gradeBlock(classification, [['apple', 'banana'], []]), false); // falta uno
  assert.equal(gradeBlock(classification, [['apple', 'banana']]), false); // faltan categorías
  assert.equal(gradeBlock(classification, [['apple', 'banana'], 'dog'] as unknown as string[][]), false);
  assert.equal(gradeBlock(classification, null), false);
});

// ── puntaje: image-labeling ─────────────────────────────────────────────────
test('image-labeling: todo o nada', () => {
  assert.equal(gradeBlock(labeling, ['door', 'window', 'roof']), true);
  assert.equal(gradeBlock(labeling, ['window', 'door', 'roof']), false);
  assert.equal(gradeBlock(labeling, ['door', 'window']), false);
  assert.equal(gradeBlock(labeling, null), false);
});

// ── puntaje: image-hotspot ──────────────────────────────────────────────────
test('image-hotspot: solo cuenta con correctSpot', () => {
  assert.equal(gradeBlock(hotspot, 1), true);
  assert.equal(gradeBlock(hotspot, 0), false);
  assert.equal(gradeBlock(hotspot, '1' as unknown as number), false);
  assert.equal(gradeBlock(hotspot, null), false);
  const viewer = blk('v', 'image-hotspot', { imageUrl: 'x', prompt: '', spots: [{ x: 1, y: 1, label: 'a' }] });
  assert.equal(isExamQuestion(viewer), false);
  assert.equal(gradeBlock(viewer, 0), false);
  assert.equal(toPublicQuestion(viewer), null);
  // índice fuera de rango: tampoco es pregunta
  assert.equal(isExamQuestion(blk('v2', 'image-hotspot', { spots: [{ x: 1, y: 1, label: 'a' }], correctSpot: 5 })), false);
});

test('los tipos de siempre siguen puntuando igual', () => {
  assert.equal(gradeBlock(blk('q', 'quiz', { question: 'x', options: ['a', 'b'], correctIndex: 1 }), 1), true);
  assert.equal(gradeBlock(blk('f', 'fill-blank', { text: 'She {{is}} here' }), ['IS']), true);
  assert.equal(gradeBlock(blk('t', 'true-false', { statement: 'x', answer: true }), false), false);
  assert.equal(gradeBlock(blk('s', 'short-answer', { question: 'x', answers: ['gato'] }), ' Gato '), true);
});

test('gradeExam: 1 punto por bloque', () => {
  const r = gradeExam([matching, ordering, classification, labeling, hotspot], {
    m: ['perro', 'gato', 'pájaro'], // ✓
    o: ['am', 'I', 'happy', 'today'], // ✗
    c: [['apple', 'banana'], ['dog']], // ✓
    l: ['door', 'window', 'roof'], // ✓
    // h sin responder ✗
  });
  assert.equal(r.correct, 3);
  assert.equal(r.total, 5);
  assert.equal(r.score, 60);
});

// ── las preguntas públicas no llevan la respuesta ───────────────────────────
/** Every string found anywhere inside a value. */
const strings = (v: unknown): string[] =>
  typeof v === 'string' ? [v] : Array.isArray(v) ? v.flatMap(strings) : v && typeof v === 'object' ? Object.values(v).flatMap(strings) : [];

test('toPublicQuestion no filtra respuestas', () => {
  const m = toPublicQuestion(matching)!;
  assert.deepEqual(m.lefts, ['dog', 'cat', 'bird']);
  assert.deepEqual([...m.options!].sort(), ['gato', 'perro', 'pájaro'].sort());
  assert.ok(!('pairs' in m));

  const o = toPublicQuestion(ordering)!;
  assert.deepEqual([...o.options!].sort(), ['I', 'am', 'happy', 'today'].sort());
  assert.notDeepEqual(o.options, ['I', 'am', 'happy', 'today']); // nunca llega ya resuelto

  const c = toPublicQuestion(classification)!;
  assert.deepEqual(c.categories, ['Fruit', 'Animal']);
  assert.deepEqual([...c.options!].sort(), ['apple', 'banana', 'dog']);
  assert.ok(!JSON.stringify(c).includes('"items"'));

  const l = toPublicQuestion(labeling)!;
  assert.deepEqual(l.points, [
    { x: 10, y: 20 },
    { x: 50, y: 60 },
    { x: 80, y: 30 },
  ]); // posiciones sin etiqueta

  const h = toPublicQuestion(hotspot)!;
  assert.deepEqual(h.points, [
    { x: 10, y: 20 },
    { x: 50, y: 60 },
  ]);
  assert.ok(!JSON.stringify(h).includes('correctSpot'));
  assert.ok(!JSON.stringify(h).includes('door')); // la etiqueta del punto no viaja
});

test('toPublicQuestion de los tipos de siempre sigue sin respuesta', () => {
  const q = toPublicQuestion(blk('q', 'quiz', { question: 'x', options: ['a', 'b'], correctIndex: 1, feedback: 'because' }))!;
  assert.ok(!('correctIndex' in q));
  assert.ok(!strings(q).includes('because'));
  const f = toPublicQuestion(blk('f', 'fill-blank', { text: 'She {{is}} here' }))!;
  assert.deepEqual(f.segments, ['She ', '', ' here']);
});

// ── image/audio/callout viajan con su pregunta ──────────────────────────────
test('collectExamQuestions: image/audio/callout se agrupan con la pregunta siguiente', () => {
  const quiz = [
    blk('h1', 'heading', { text: 'Part 1' }),
    blk('img1', 'image', { url: 'https://cdn.test/a.png' }),
    blk('aud1', 'audio', { url: 'https://cdn.test/a.mp3' }),
    blk('q1', 'quiz', { question: 'What do you see?', options: ['a', 'b'], correctIndex: 0 }),
    blk('call1', 'callout', { text: 'Listen', variant: 'tip' }),
    blk('t1', 'text', {}), // el texto no rompe el agrupado
    blk('q2', 'true-false', { statement: 'x', answer: true }),
    blk('q3', 'ordering', { prompt: 'x', items: ['a', 'b'] }), // sin contexto
    blk('img-final', 'image', { url: 'https://cdn.test/z.png' }), // al final, sin pregunta: se descarta
  ];
  const got = collectExamQuestions(quiz);
  assert.deepEqual(got.map((g) => g.block.id), ['q1', 'q2', 'q3']);
  assert.deepEqual(got[0].context.map((b) => b.id), ['img1', 'aud1']);
  assert.deepEqual(got[1].context.map((b) => b.id), ['call1']);
  assert.deepEqual(got[2].context, []);
});

test('collectExamQuestions: un hotspot sin correctSpot es contexto de la pregunta siguiente', () => {
  const got = collectExamQuestions([
    blk('v', 'image-hotspot', { imageUrl: 'x', spots: [{ x: 1, y: 1, label: 'a' }] }),
    blk('q', 'quiz', { question: 'x', options: ['a', 'b'], correctIndex: 0 }),
  ]);
  assert.deepEqual(got[0].context.map((b) => b.id), ['v']);
});

test('toPublicQuestion lleva el contexto', () => {
  const q = toPublicQuestion(blk('q', 'quiz', { question: 'x', options: ['a', 'b'], correctIndex: 0 }), [
    blk('img1', 'image', { url: 'https://cdn.test/a.png', alt: 'cat' }),
  ])!;
  assert.deepEqual(q.context, [{ id: 'img1', type: 'image', data: { url: 'https://cdn.test/a.png', alt: 'cat' } }]);
  assert.equal('context' in toPublicQuestion(blk('q', 'quiz', { question: 'x', options: ['a'], correctIndex: 0 }))!, false);
});

test('los bloques anidados en columns también cuentan', () => {
  const got = collectExamQuestions([
    blk('cols', 'columns', {
      columns: [[blk('img', 'image', {}), blk('q', 'quiz', { question: 'x', options: ['a', 'b'], correctIndex: 0 })]],
    }),
  ]);
  assert.deepEqual(got.map((g) => g.block.id), ['q']);
  assert.deepEqual(got[0].context.map((b) => b.id), ['img']);
});
