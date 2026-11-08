/**
 * Validation + transformation of lesson.json into what the lesson editor saves.
 * Shared by the editor's "Importar desde JSON" dialog and the local CLI
 * (scripts/import-lesson). Pure and import-free on purpose, so it runs both in
 * the browser bundle and under plain Node; the caller injects the skills list.
 *
 * The editor's block registry can't run outside Next (it pulls in React and the
 * `@/` alias), so every block shape is mirrored here, read from each block's
 * createDefault/Editor/Renderer. There is no runtime validation in the editor: a
 * missing array or a bad enum crashes it, so everything is checked strictly here
 * and nothing is ever dropped silently (unknown fields are errors: usually typos).
 *
 * Blocks are written "flat" in lesson.json ({ type, ...fields }) and stored as
 * { id, type, data }. Media is referenced by file name (`img` for images, `file`
 * for audio/video/documents) and replaced by the uploaded URL.
 */

export interface BlockInstance {
  id: string;
  type: string;
  data: unknown;
}

export type MediaKind = 'image' | 'audio' | 'video' | 'file';

export const MEDIA_EXTENSIONS: Record<MediaKind, string[]> = {
  image: ['png', 'jpg', 'jpeg', 'webp', 'gif'],
  audio: ['mp3', 'wav', 'm4a', 'ogg'],
  video: ['mp4', 'webm', 'mov', 'm4v'],
  file: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv', 'zip'],
};

export const MEDIA_MAX_BYTES: Record<MediaKind, number> = {
  image: 10 * 1024 * 1024,
  audio: 50 * 1024 * 1024,
  video: 200 * 1024 * 1024,
  file: 50 * 1024 * 1024,
};

/** Hosts allowed inside an <iframe> (embed block, non-direct video). The renderers don't sanitize URLs. */
export const IFRAME_HOSTS = [
  'youtube.com',
  'youtube-nocookie.com',
  'youtu.be',
  'vimeo.com',
  'genially.com',
  'genial.ly',
  'canva.com',
  'docs.google.com',
  'drive.google.com',
  'wordwall.net',
  'quizlet.com',
  'padlet.com',
  'h5p.org',
  'loom.com',
];

/** In 'cli' mode level, order and title are always present; in 'editor' mode they may be null. */
export interface LessonFields {
  level: string | null;
  order: number | null;
  title: string | null;
  skill_type: string | null;
  description: string | null;
  duration_minutes: number | null;
  author: string | null;
}

export interface BuildContext {
  errors: string[];
  /** Media files referenced by the lesson (name as written in lesson.json -> kind). */
  files: Map<string, MediaKind>;
  resolveFile: (file: string, kind: MediaKind) => string;
  /** Block id for the block at `path` (reuses the existing one on re-import). */
  newId: (path: string, type: string) => string;
}

type Rec = Record<string, unknown>;

const isRec = (v: unknown): v is Rec => typeof v === 'object' && v !== null && !Array.isArray(v);
const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;
const CALLOUT_VARIANTS = ['info', 'warning', 'success', 'danger', 'tip'];
const MAX_NESTING = 3;

export const SUPPORTED_TYPES = [
  'heading', 'text', 'callout', 'quote', 'image', 'gallery', 'table', 'divider',
  'audio', 'video', 'file', 'embed', 'button', 'accordion', 'tabs', 'timeline', 'columns', 'container', 'code',
  'quiz', 'multi-choice', 'true-false', 'fill-blank', 'short-answer', 'ordering', 'matching', 'classification',
  'swipe', 'essay', 'flashcards', 'image-hotspot', 'image-labeling',
];

/** Types the Evaluación tab accepts (src/lib/exam/grading.ts QUIZ_EDITOR_TYPES). */
export const QUIZ_TYPES = ['heading', 'text', 'quiz', 'multi-choice', 'true-false', 'fill-blank', 'short-answer'];

const TIPTAP_NODES = new Set([
  'doc',
  'paragraph',
  'text',
  'heading',
  'bulletList',
  'orderedList',
  'listItem',
  'blockquote',
  'hardBreak',
]);
const TIPTAP_MARKS = new Set(['bold', 'italic', 'strike', 'code', 'link', 'underline', 'textStyle']);

// ── pasted text -> JSON ──────────────────────────────────────────────────────

/** Parse what a chat produced: tolerates ```json fences, a BOM and prose around the JSON. */
export function extractJson(text: string): { value?: unknown; error?: string } {
  const trimmed = text.replace(/^﻿/, '').trim();
  if (!trimmed) return { error: 'No hay texto.' };
  const attempts: string[] = [trimmed];

  const fence = /```(?:json|JSON)?\s*([\s\S]*?)```/.exec(trimmed);
  if (fence) attempts.push(fence[1].trim());

  const firstObj = trimmed.indexOf('{');
  const firstArr = trimmed.indexOf('[');
  const starts = [firstObj, firstArr].filter((i) => i >= 0);
  if (starts.length) {
    const start = Math.min(...starts);
    const closer = trimmed[start] === '{' ? '}' : ']';
    const end = trimmed.lastIndexOf(closer);
    if (end > start) attempts.push(trimmed.slice(start, end + 1));
  }

  let lastError = '';
  for (const a of attempts) {
    try {
      return { value: JSON.parse(a) };
    } catch (e) {
      lastError = (e as Error).message;
    }
  }
  return { error: `JSON no válido: ${lastError}` };
}

// ── lesson-level fields ──────────────────────────────────────────────────────

export interface ValidateOptions {
  /** Allowed skill names (src/lib/skills.ts SKILLS), injected to keep this module import-free. */
  skills: readonly string[];
  /**
   * 'cli': level, order and title are required (the lesson is created/updated by them).
   * 'editor': blocks are inserted into the lesson being edited, so those are optional and
   * ignored, and a bare array of blocks is accepted too.
   */
  mode: 'cli' | 'editor';
}

export function validateLesson(
  raw: unknown,
  opts: ValidateOptions
): { fields?: LessonFields; content?: unknown[]; quiz?: unknown[]; errors: string[] } {
  const { skills: SKILLS, mode } = opts;
  const errors: string[] = [];

  if (Array.isArray(raw) && mode === 'editor') {
    if (raw.length === 0) return { errors: ['La lista de bloques está vacía.'] };
    return {
      errors,
      content: raw,
      fields: { level: null, order: null, title: null, skill_type: null, description: null, duration_minutes: null, author: null },
    };
  }
  if (!isRec(raw)) {
    return { errors: [mode === 'editor' ? 'El JSON debe ser un lesson.json (objeto) o una lista de bloques.' : 'lesson.json debe ser un objeto JSON.'] };
  }

  const known = ['level', 'order', 'title', 'skill_type', 'description', 'duration_minutes', 'author', 'content', 'quiz'];
  for (const key of Object.keys(raw)) {
    if (!known.includes(key)) errors.push(`Campo desconocido en lesson.json: "${key}".`);
  }

  const required = mode === 'cli';

  const level = raw.level;
  const hasLevel = typeof level === 'string' && level.trim() !== '';
  if (required ? !hasLevel : level !== undefined && !hasLevel) {
    errors.push('"level" es obligatorio (código del nivel, p. ej. "a1").');
  }

  const order = raw.order;
  const hasOrder = typeof order === 'number' && Number.isInteger(order) && order >= 1;
  if (required ? !hasOrder : order !== undefined && !hasOrder) errors.push('"order" debe ser un entero ≥ 1.');

  const title = raw.title;
  const hasTitle = typeof title === 'string' && title.trim() !== '';
  if (required ? !hasTitle : title !== undefined && !hasTitle) errors.push('"title" es obligatorio y no puede estar vacío.');

  let skill: string | null = null;
  if (raw.skill_type !== undefined && raw.skill_type !== null) {
    const list = Array.isArray(raw.skill_type)
      ? raw.skill_type
      : typeof raw.skill_type === 'string'
        ? raw.skill_type.split(',')
        : null;
    if (!list) {
      errors.push('"skill_type" debe ser una lista (o texto separado por comas) de: ' + SKILLS.join(', ') + '.');
    } else {
      const canon: string[] = [];
      for (const s of list) {
        const found = typeof s === 'string' ? SKILLS.find((k) => k.toLowerCase() === s.trim().toLowerCase()) : undefined;
        if (!found) errors.push(`Skill inválida: ${JSON.stringify(s)}. Válidas: ${SKILLS.join(', ')}.`);
        else if (!canon.includes(found)) canon.push(found);
      }
      skill = canon.length ? canon.join(', ') : null;
    }
  }

  let description: string | null = null;
  if (raw.description !== undefined && raw.description !== null) {
    if (typeof raw.description !== 'string') errors.push('"description" debe ser texto.');
    else description = raw.description.trim() || null;
  }

  let duration: number | null = null;
  if (raw.duration_minutes !== undefined && raw.duration_minutes !== null) {
    const d = raw.duration_minutes;
    if (typeof d !== 'number' || !Number.isInteger(d) || d < 0) errors.push('"duration_minutes" debe ser un entero ≥ 0.');
    else duration = d;
  }

  let author: string | null = null;
  if (raw.author !== undefined && raw.author !== null) {
    if (typeof raw.author !== 'string' || !raw.author.trim()) errors.push('"author" debe ser texto no vacío.');
    else author = raw.author.trim();
  }

  if (raw.content !== undefined && !Array.isArray(raw.content)) errors.push('"content" debe ser una lista de bloques.');
  if (raw.quiz !== undefined && !Array.isArray(raw.quiz)) errors.push('"quiz" debe ser una lista de bloques.');
  const content = Array.isArray(raw.content) ? raw.content : [];
  const quiz = Array.isArray(raw.quiz) ? raw.quiz : undefined;
  if (content.length === 0 && (quiz?.length ?? 0) === 0 && !errors.some((e) => e.startsWith('"content"') || e.startsWith('"quiz"'))) {
    errors.push('Falta contenido: incluye "content" y/o "quiz" con al menos un bloque.');
  }

  if (errors.length) return { errors };
  return {
    errors,
    content,
    quiz,
    fields: {
      level: hasLevel ? (level as string).trim() : null,
      order: hasOrder ? (order as number) : null,
      title: hasTitle ? (title as string).trim() : null,
      skill_type: skill,
      description,
      duration_minutes: duration,
      author,
    },
  };
}

// ── small helpers ────────────────────────────────────────────────────────────

function checkKeys(b: Rec, allowed: string[], path: string, errors: string[]): void {
  for (const key of Object.keys(b)) {
    if (key !== 'type' && !allowed.includes(key)) errors.push(`${path}: campo desconocido "${key}".`);
  }
}

/** CText: a plain string, or { t, c? } with an optional #RRGGBB color. Empty text is rejected. */
function cText(v: unknown, path: string, errors: string[]): string | { t: string; c?: string } {
  if (typeof v === 'string') {
    if (!v.trim()) errors.push(`${path}: el texto no puede estar vacío.`);
    return v;
  }
  if (isRec(v) && typeof v.t === 'string' && v.t.trim()) {
    const extra = Object.keys(v).filter((k) => k !== 't' && k !== 'c');
    if (extra.length) errors.push(`${path}: campos desconocidos en el texto con color: ${extra.join(', ')}.`);
    if (v.c !== undefined && (typeof v.c !== 'string' || !HEX_COLOR.test(v.c))) {
      errors.push(`${path}: "c" debe ser un color #RRGGBB.`);
      return v.t;
    }
    return v.c ? { t: v.t, c: v.c as string } : v.t;
  }
  errors.push(`${path}: debe ser texto, o { "t": "...", "c": "#RRGGBB" }.`);
  return '';
}

const ctPlain = (v: string | { t: string; c?: string }): string => (typeof v === 'string' ? v : v.t);

/** Plain string field (optional with a default). */
function str(v: unknown, path: string, errors: string[], fallback = ''): string {
  if (v === undefined || v === null) return fallback;
  if (typeof v !== 'string') {
    errors.push(`${path}: debe ser texto.`);
    return fallback;
  }
  return v;
}

function reqStr(v: unknown, path: string, errors: string[]): string {
  if (typeof v !== 'string' || !v.trim()) {
    errors.push(`${path}: es obligatorio y debe ser texto no vacío.`);
    return '';
  }
  return v;
}

function bool(v: unknown, path: string, errors: string[], fallback: boolean): boolean {
  if (v === undefined) return fallback;
  if (typeof v !== 'boolean') {
    errors.push(`${path}: debe ser true o false.`);
    return fallback;
  }
  return v;
}

function oneOf<T extends string>(v: unknown, allowed: readonly T[], fallback: T, path: string, errors: string[]): T {
  if (v === undefined) return fallback;
  if (typeof v !== 'string' || !(allowed as readonly string[]).includes(v)) {
    errors.push(`${path}: debe ser uno de ${allowed.join(', ')}.`);
    return fallback;
  }
  return v as T;
}

function list(v: unknown, path: string, errors: string[], min: number, what: string): unknown[] {
  if (!Array.isArray(v) || v.length < min) {
    errors.push(`${path}: debe ser una lista con al menos ${min} ${what}.`);
    return [];
  }
  return v;
}

function rec(v: unknown, path: string, errors: string[], allowed: string[]): Rec {
  if (!isRec(v)) {
    errors.push(`${path}: debe ser un objeto.`);
    return {};
  }
  checkKeys({ type: 'x', ...v }, allowed, path, errors);
  return v;
}

function intIn(v: unknown, min: number, max: number, path: string, errors: string[]): number {
  if (typeof v !== 'number' || !Number.isInteger(v) || v < min || v > max) {
    errors.push(`${path}: debe ser un entero entre ${min} y ${max}.`);
    return min;
  }
  return v;
}

function num0to100(v: unknown, path: string, errors: string[]): number {
  if (typeof v !== 'number' || !Number.isFinite(v) || v < 0 || v > 100) {
    errors.push(`${path}: debe ser un número entre 0 y 100 (porcentaje de la imagen).`);
    return 0;
  }
  return v;
}

// ── URLs and media ───────────────────────────────────────────────────────────

function parseHttps(v: unknown, path: string, errors: string[]): URL | null {
  if (typeof v !== 'string' || !v.trim()) {
    errors.push(`${path}: es obligatorio (URL https://).`);
    return null;
  }
  let u: URL;
  try {
    u = new URL(v.trim());
  } catch {
    errors.push(`${path}: no es una URL válida.`);
    return null;
  }
  if (u.protocol !== 'https:' || u.username || u.password) {
    errors.push(`${path}: solo se aceptan URLs https:// (sin usuario/clave).`);
    return null;
  }
  return u;
}

function hostAllowed(host: string): boolean {
  return IFRAME_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
}

/** URL that ends up inside an <iframe>: https and a known host only. */
function iframeUrl(v: unknown, path: string, errors: string[]): string {
  const u = parseHttps(v, path, errors);
  if (!u) return '';
  if (!hostAllowed(u.hostname.toLowerCase())) {
    errors.push(`${path}: el sitio "${u.hostname}" no está en la lista permitida para incrustar (${IFRAME_HOSTS.join(', ')}). Añádelo a mano en el editor.`);
    return '';
  }
  return u.toString();
}

/** A local file reference: plain name with an extension valid for `kind`. */
function mediaName(v: unknown, kind: MediaKind, path: string, ctx: BuildContext): string {
  const exts = MEDIA_EXTENSIONS[kind];
  const ok = typeof v === 'string' && !/[/\\]/.test(v) && exts.includes((v.split('.').pop() ?? '').toLowerCase()) && v.includes('.');
  if (!ok) {
    ctx.errors.push(`${path}: debe ser el nombre de un archivo (${exts.join('/')}), sin carpetas.`);
    return '';
  }
  const name = v as string;
  const prev = ctx.files.get(name);
  if (prev && prev !== kind) ctx.errors.push(`${path}: "${name}" se usa como ${prev} y como ${kind}.`);
  ctx.files.set(name, kind);
  return ctx.resolveFile(name, kind);
}

/** Image given by file name in `field`. */
function imageField(b: Rec, field: string, path: string, ctx: BuildContext): string {
  return mediaName(b[field], 'image', `${path}.${field}`, ctx);
}

const DIRECT_VIDEO = /\.(mp4|webm|ogg|mov|m4v)$/i;

/** audio/video/file: exactly one of `file` (uploaded with the lesson) or `url` (https). */
function fileOrUrl(b: Rec, kind: 'audio' | 'video' | 'file', path: string, ctx: BuildContext): string {
  const hasFile = b.file !== undefined;
  const hasUrl = b.url !== undefined;
  if (hasFile === hasUrl) {
    ctx.errors.push(`${path}: usa "file" (archivo que subes junto al JSON) o "url" (https://), uno de los dos.`);
    return '';
  }
  if (hasFile) return mediaName(b.file, kind, `${path}.file`, ctx);
  if (kind === 'video') {
    const u = parseHttps(b.url, `${path}.url`, ctx.errors);
    if (!u) return '';
    // A direct file URL plays in <video src>; anything else is framed, so it must be a known host.
    return DIRECT_VIDEO.test(u.pathname) ? u.toString() : iframeUrl(b.url, `${path}.url`, ctx.errors);
  }
  return parseHttps(b.url, `${path}.url`, ctx.errors)?.toString() ?? '';
}

// ── Tiptap docs ──────────────────────────────────────────────────────────────

const SAFE_HREF = /^(https?:\/\/|mailto:|\/)/i;

function checkTiptap(node: unknown, path: string, errors: string[]): void {
  if (!isRec(node) || typeof node.type !== 'string' || !TIPTAP_NODES.has(node.type)) {
    errors.push(`${path}: nodo Tiptap no soportado (${JSON.stringify(isRec(node) ? node.type : node)}).`);
    return;
  }
  if (node.type === 'text' && typeof node.text !== 'string') errors.push(`${path}: un nodo "text" necesita "text".`);
  if (Array.isArray(node.marks)) {
    node.marks.forEach((m, i) => {
      if (!isRec(m) || typeof m.type !== 'string' || !TIPTAP_MARKS.has(m.type)) {
        errors.push(`${path}.marks[${i}]: marca Tiptap no soportada.`);
        return;
      }
      const attrs = isRec(m.attrs) ? m.attrs : {};
      // Imported text is rendered to students: only allow safe link targets (no javascript: etc.).
      if (m.type === 'link' && !(typeof attrs.href === 'string' && SAFE_HREF.test(attrs.href))) {
        errors.push(`${path}.marks[${i}]: un enlace necesita "href" que empiece por http://, https://, mailto: o /.`);
      }
      if (m.type === 'textStyle' && attrs.color !== undefined && !(typeof attrs.color === 'string' && HEX_COLOR.test(attrs.color))) {
        errors.push(`${path}.marks[${i}]: "color" debe ser #RRGGBB.`);
      }
    });
  }
  if (node.content !== undefined) {
    if (!Array.isArray(node.content)) errors.push(`${path}.content debe ser una lista.`);
    else node.content.forEach((c, i) => checkTiptap(c, `${path}.content[${i}]`, errors));
  }
}

type TNode = { type: string; text?: string; marks?: { type: string; attrs?: Rec }[]; content?: TNode[] };

const INLINE = /\*\*([^*\n]+)\*\*|\*([^*\n]+)\*|`([^`\n]+)`|\[([^\]\n]+)\]\(([^)\s]+)\)/g;

function inlineNodes(src: string, path: string, errors: string[]): TNode[] {
  const out: TNode[] = [];
  const push = (text: string, marks?: TNode['marks']) => {
    if (text) out.push(marks ? { type: 'text', text, marks } : { type: 'text', text });
  };
  let last = 0;
  INLINE.lastIndex = 0;
  for (let m = INLINE.exec(src); m; m = INLINE.exec(src)) {
    push(src.slice(last, m.index));
    if (m[1] !== undefined) push(m[1], [{ type: 'bold' }]);
    else if (m[2] !== undefined) push(m[2], [{ type: 'italic' }]);
    else if (m[3] !== undefined) push(m[3], [{ type: 'code' }]);
    else {
      if (!SAFE_HREF.test(m[5])) errors.push(`${path}: enlace con destino no permitido "${m[5]}" (usa http://, https://, mailto: o /).`);
      push(m[4], [{ type: 'link', attrs: { href: m[5] } }]);
    }
    last = m.index + m[0].length;
  }
  push(src.slice(last));
  return out;
}

/** Small markdown subset -> Tiptap doc: paragraphs, **bold**, *italic*, `code`, [text](url), "- " and "1. " lists. */
export function markdownToDoc(md: string, path: string, errors: string[]): { type: 'doc'; content: TNode[] } {
  const content: TNode[] = [];
  const blocks = md.replace(/\r\n/g, '\n').split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  for (const block of blocks) {
    const lines = block.split('\n').map((l) => l.trim());
    const bullet = lines.every((l) => /^[-*]\s+/.test(l));
    const ordered = lines.every((l) => /^\d+[.)]\s+/.test(l));
    if (bullet || ordered) {
      const items: TNode[] = lines.map((l) => ({
        type: 'listItem',
        content: [{ type: 'paragraph', content: inlineNodes(l.replace(/^([-*]|\d+[.)])\s+/, ''), path, errors) }],
      }));
      content.push({ type: bullet ? 'bulletList' : 'orderedList', content: items });
      continue;
    }
    const inline: TNode[] = [];
    lines.forEach((l, i) => {
      if (i > 0) inline.push({ type: 'hardBreak' });
      inline.push(...inlineNodes(l, path, errors));
    });
    content.push({ type: 'paragraph', content: inline });
  }
  if (content.length === 0) content.push({ type: 'paragraph' });
  return { type: 'doc', content };
}

/** Plain text (newlines = paragraphs) -> Tiptap doc, no markdown parsing. */
function plainToDoc(text: string): { type: 'doc'; content: TNode[] } {
  const content: TNode[] = text
    .split(/\n+/)
    .filter((p) => p.trim())
    .map((p) => ({ type: 'paragraph', content: [{ type: 'text', text: p }] }));
  return { type: 'doc', content: content.length ? content : [{ type: 'paragraph' }] };
}

// ── blocks ───────────────────────────────────────────────────────────────────

type Builder = (b: Rec, path: string, ctx: BuildContext, depth: number) => unknown;

const FILLBLANK = /\{\{([^{}\n]*?)\}\}/g;

function checkFillBlank(text: string, path: string, errors: string[]): void {
  let blanks = 0;
  const rest = text.replace(FILLBLANK, (_m, answer: string) => {
    blanks++;
    if (!answer.trim()) errors.push(`${path}: hay un hueco {{ }} vacío; escribe la respuesta dentro.`);
    return '';
  });
  if (blanks === 0) errors.push(`${path}: debe tener al menos un hueco con la forma {{respuesta}}.`);
  if (/\{\{|\}\}/.test(rest)) errors.push(`${path}: llaves {{ }} sin cerrar o con saltos de línea dentro.`);
}

const uniq = (values: string[]): boolean => new Set(values.map((v) => v.trim().toLowerCase())).size === values.length;

const BUILDERS: Record<string, Builder> = {
  heading: (b, path, ctx) => {
    checkKeys(b, ['text', 'level'], path, ctx.errors);
    const level = b.level === undefined ? 2 : b.level;
    if (level !== 1 && level !== 2 && level !== 3) ctx.errors.push(`${path}: "level" debe ser 1, 2 o 3.`);
    return { text: cText(b.text, `${path}.text`, ctx.errors), level };
  },
  callout: (b, path, ctx) => {
    checkKeys(b, ['text', 'variant'], path, ctx.errors);
    return {
      text: cText(b.text, `${path}.text`, ctx.errors),
      variant: oneOf(b.variant, CALLOUT_VARIANTS, 'info', `${path}.variant`, ctx.errors),
    };
  },
  quote: (b, path, ctx) => {
    checkKeys(b, ['text', 'author'], path, ctx.errors);
    return { text: cText(b.text, `${path}.text`, ctx.errors), author: str(b.author, `${path}.author`, ctx.errors) };
  },
  text: (b, path, ctx) => {
    checkKeys(b, ['paragraphs', 'markdown', 'doc'], path, ctx.errors);
    const given = ['paragraphs', 'markdown', 'doc'].filter((k) => b[k] !== undefined);
    if (given.length !== 1) {
      ctx.errors.push(`${path}: usa exactamente uno de "paragraphs" (lista de textos), "markdown" (texto con **negrita**, listas…) o "doc" (JSON de Tiptap).`);
      return { doc: { type: 'doc', content: [{ type: 'paragraph' }] } };
    }
    if (b.doc !== undefined) {
      if (!isRec(b.doc) || b.doc.type !== 'doc') ctx.errors.push(`${path}.doc: debe ser un documento Tiptap { "type": "doc", ... }.`);
      else checkTiptap(b.doc, `${path}.doc`, ctx.errors);
      return { doc: b.doc };
    }
    if (b.markdown !== undefined) {
      if (typeof b.markdown !== 'string' || !b.markdown.trim()) {
        ctx.errors.push(`${path}.markdown: debe ser texto no vacío.`);
        return { doc: { type: 'doc', content: [{ type: 'paragraph' }] } };
      }
      return { doc: markdownToDoc(b.markdown, `${path}.markdown`, ctx.errors) };
    }
    const p = b.paragraphs;
    if (!Array.isArray(p) || p.length === 0 || p.some((x) => typeof x !== 'string')) {
      ctx.errors.push(`${path}.paragraphs: debe ser una lista de textos con al menos uno.`);
      return { doc: { type: 'doc', content: [{ type: 'paragraph' }] } };
    }
    const content: TNode[] = (p as string[]).map((t) => (t ? { type: 'paragraph', content: [{ type: 'text', text: t }] } : { type: 'paragraph' }));
    return { doc: { type: 'doc', content } };
  },
  image: (b, path, ctx) => {
    checkKeys(b, ['img', 'alt', 'caption'], path, ctx.errors);
    return { url: imageField(b, 'img', path, ctx), alt: str(b.alt, `${path}.alt`, ctx.errors), caption: str(b.caption, `${path}.caption`, ctx.errors) };
  },
  gallery: (b, path, ctx) => {
    checkKeys(b, ['images'], path, ctx.errors);
    const images = list(b.images, `${path}.images`, ctx.errors, 1, 'imagen').map((img, i) => {
      const p = `${path}.images[${i}]`;
      const o = rec(img, p, ctx.errors, ['img', 'caption']);
      return { url: imageField(o, 'img', p, ctx), caption: str(o.caption, `${p}.caption`, ctx.errors) };
    });
    return { images };
  },
  table: (b, path, ctx) => {
    checkKeys(b, ['hasHeader', 'rows'], path, ctx.errors);
    const hasHeader = bool(b.hasHeader, `${path}.hasHeader`, ctx.errors, true);
    const rows = b.rows;
    if (!Array.isArray(rows) || rows.length === 0 || rows.some((r) => !Array.isArray(r) || r.some((c) => typeof c !== 'string'))) {
      ctx.errors.push(`${path}.rows: debe ser una lista de filas, cada una una lista de textos.`);
      return { hasHeader, rows: [['']] };
    }
    const width = (rows[0] as string[]).length;
    if (width === 0 || rows.some((r) => (r as string[]).length !== width)) {
      ctx.errors.push(`${path}.rows: todas las filas deben tener el mismo número de columnas (≥ 1).`);
    }
    return { hasHeader, rows };
  },
  divider: (b, path, ctx) => {
    checkKeys(b, [], path, ctx.errors);
    return {};
  },

  // media
  audio: (b, path, ctx) => {
    checkKeys(b, ['file', 'url', 'title'], path, ctx.errors);
    return { url: fileOrUrl(b, 'audio', path, ctx), title: str(b.title, `${path}.title`, ctx.errors) };
  },
  video: (b, path, ctx) => {
    checkKeys(b, ['file', 'url', 'caption'], path, ctx.errors);
    return { url: fileOrUrl(b, 'video', path, ctx), caption: str(b.caption, `${path}.caption`, ctx.errors) };
  },
  file: (b, path, ctx) => {
    checkKeys(b, ['file', 'url', 'name', 'showPreview'], path, ctx.errors);
    const url = fileOrUrl(b, 'file', path, ctx);
    const fallbackName = typeof b.file === 'string' ? b.file : '';
    // The PDF preview puts the URL in an <iframe>: only for files we upload, never for external URLs.
    const external = b.url !== undefined;
    const showPreview = bool(b.showPreview, `${path}.showPreview`, ctx.errors, !external);
    if (external && showPreview) {
      ctx.errors.push(`${path}.showPreview: la vista previa en pantalla solo se permite con "file" (archivo subido); con una "url" externa usa false.`);
    }
    return { url, name: str(b.name, `${path}.name`, ctx.errors, fallbackName), showPreview };
  },
  embed: (b, path, ctx) => {
    checkKeys(b, ['url', 'height'], path, ctx.errors);
    const height = b.height === undefined ? 400 : intIn(b.height, 100, 1200, `${path}.height`, ctx.errors);
    return { url: iframeUrl(b.url, `${path}.url`, ctx.errors), height };
  },
  button: (b, path, ctx) => {
    checkKeys(b, ['label', 'url', 'align', 'variant'], path, ctx.errors);
    return {
      label: reqStr(b.label, `${path}.label`, ctx.errors),
      url: parseHttps(b.url, `${path}.url`, ctx.errors)?.toString() ?? '',
      align: oneOf(b.align, ['left', 'center', 'right'] as const, 'left', `${path}.align`, ctx.errors),
      variant: oneOf(b.variant, ['primary', 'secondary', 'outline'] as const, 'primary', `${path}.variant`, ctx.errors),
    };
  },

  // layout
  accordion: (b, path, ctx) => {
    checkKeys(b, ['items'], path, ctx.errors);
    const items = list(b.items, `${path}.items`, ctx.errors, 1, 'sección').map((it, i) => {
      const p = `${path}.items[${i}]`;
      const o = rec(it, p, ctx.errors, ['title', 'body']);
      return { title: reqStr(o.title, `${p}.title`, ctx.errors), body: str(o.body, `${p}.body`, ctx.errors) };
    });
    return { items };
  },
  tabs: (b, path, ctx) => {
    checkKeys(b, ['tabs'], path, ctx.errors);
    const tabs = list(b.tabs, `${path}.tabs`, ctx.errors, 1, 'pestaña').map((t, i) => {
      const p = `${path}.tabs[${i}]`;
      const o = rec(t, p, ctx.errors, ['label', 'body']);
      return { label: reqStr(o.label, `${p}.label`, ctx.errors), body: str(o.body, `${p}.body`, ctx.errors) };
    });
    return { tabs };
  },
  timeline: (b, path, ctx) => {
    checkKeys(b, ['events'], path, ctx.errors);
    const events = list(b.events, `${path}.events`, ctx.errors, 1, 'evento').map((e, i) => {
      const p = `${path}.events[${i}]`;
      const o = rec(e, p, ctx.errors, ['date', 'title', 'description']);
      return { date: str(o.date, `${p}.date`, ctx.errors), title: reqStr(o.title, `${p}.title`, ctx.errors), description: str(o.description, `${p}.description`, ctx.errors) };
    });
    return { events };
  },
  columns: (b, path, ctx, depth) => {
    checkKeys(b, ['columns'], path, ctx.errors);
    if (!Array.isArray(b.columns) || b.columns.length < 2 || b.columns.length > 4) {
      ctx.errors.push(`${path}.columns: debe ser una lista de 2 a 4 columnas, cada una una lista de bloques.`);
      return { columns: [[], []] };
    }
    const columns = b.columns.map((col, i) => {
      if (!Array.isArray(col)) {
        ctx.errors.push(`${path}.columns[${i}]: debe ser una lista de bloques.`);
        return [];
      }
      return buildList(col, `${path}.columns[${i}]`, ctx, depth + 1, undefined);
    });
    return { columns };
  },
  container: (b, path, ctx, depth) => {
    checkKeys(b, ['title', 'variant', 'children'], path, ctx.errors);
    const children = Array.isArray(b.children) && b.children.length > 0 ? buildList(b.children, `${path}.children`, ctx, depth + 1, undefined) : [];
    if (!Array.isArray(b.children) || b.children.length === 0) ctx.errors.push(`${path}.children: debe ser una lista con al menos un bloque.`);
    return {
      title: str(b.title, `${path}.title`, ctx.errors),
      variant: oneOf(b.variant, ['plain', 'card', 'muted', 'outline'] as const, 'card', `${path}.variant`, ctx.errors),
      children,
    };
  },
  code: (b, path, ctx) => {
    checkKeys(b, ['code', 'language'], path, ctx.errors);
    return { code: reqStr(b.code, `${path}.code`, ctx.errors), language: str(b.language, `${path}.language`, ctx.errors, 'text') };
  },

  // activities
  quiz: (b, path, ctx) => {
    checkKeys(b, ['question', 'options', 'correctIndex', 'feedback'], path, ctx.errors);
    const options = list(b.options, `${path}.options`, ctx.errors, 2, 'opciones').map((o, i) => cText(o, `${path}.options[${i}]`, ctx.errors));
    const correctIndex = intIn(b.correctIndex, 0, Math.max(options.length - 1, 0), `${path}.correctIndex`, ctx.errors);
    const data: Rec = { question: cText(b.question, `${path}.question`, ctx.errors), options, correctIndex };
    if (b.feedback !== undefined) data.feedback = cText(b.feedback, `${path}.feedback`, ctx.errors);
    return data;
  },
  'multi-choice': (b, path, ctx) => {
    checkKeys(b, ['question', 'options', 'correctIndices'], path, ctx.errors);
    const options = list(b.options, `${path}.options`, ctx.errors, 2, 'opciones').map((o, i) => cText(o, `${path}.options[${i}]`, ctx.errors));
    const idx = list(b.correctIndices, `${path}.correctIndices`, ctx.errors, 1, 'índice correcto').map((v, i) =>
      intIn(v, 0, Math.max(options.length - 1, 0), `${path}.correctIndices[${i}]`, ctx.errors)
    );
    if (new Set(idx).size !== idx.length) ctx.errors.push(`${path}.correctIndices: hay índices repetidos.`);
    return { question: cText(b.question, `${path}.question`, ctx.errors), options, correctIndices: idx };
  },
  'true-false': (b, path, ctx) => {
    checkKeys(b, ['statement', 'answer'], path, ctx.errors);
    if (typeof b.answer !== 'boolean') ctx.errors.push(`${path}.answer: debe ser true o false.`);
    return { statement: cText(b.statement, `${path}.statement`, ctx.errors), answer: b.answer === true };
  },
  'fill-blank': (b, path, ctx) => {
    checkKeys(b, ['text'], path, ctx.errors);
    const text = cText(b.text, `${path}.text`, ctx.errors);
    checkFillBlank(ctPlain(text), `${path}.text`, ctx.errors);
    return { text };
  },
  'short-answer': (b, path, ctx) => {
    checkKeys(b, ['question', 'answers', 'caseSensitive'], path, ctx.errors);
    const answers = list(b.answers, `${path}.answers`, ctx.errors, 1, 'respuesta aceptada').map((a, i) => reqStr(a, `${path}.answers[${i}]`, ctx.errors));
    return { question: cText(b.question, `${path}.question`, ctx.errors), answers, caseSensitive: bool(b.caseSensitive, `${path}.caseSensitive`, ctx.errors, false) };
  },
  ordering: (b, path, ctx) => {
    checkKeys(b, ['prompt', 'items'], path, ctx.errors);
    const items = list(b.items, `${path}.items`, ctx.errors, 2, 'elementos (en el orden CORRECTO)').map((it, i) => cText(it, `${path}.items[${i}]`, ctx.errors));
    if (!uniq(items.map(ctPlain))) ctx.errors.push(`${path}.items: hay elementos repetidos.`);
    return { prompt: cText(b.prompt, `${path}.prompt`, ctx.errors), items };
  },
  matching: (b, path, ctx) => {
    checkKeys(b, ['prompt', 'pairs'], path, ctx.errors);
    const pairs = list(b.pairs, `${path}.pairs`, ctx.errors, 2, 'pares').map((pr, i) => {
      const p = `${path}.pairs[${i}]`;
      const o = rec(pr, p, ctx.errors, ['left', 'right']);
      return { left: cText(o.left, `${p}.left`, ctx.errors), right: reqStr(o.right, `${p}.right`, ctx.errors) };
    });
    if (!uniq(pairs.map((p) => p.right))) ctx.errors.push(`${path}.pairs: hay valores "right" repetidos.`);
    return { prompt: cText(b.prompt, `${path}.prompt`, ctx.errors), pairs };
  },
  classification: (b, path, ctx) => {
    checkKeys(b, ['prompt', 'categories'], path, ctx.errors);
    const categories = list(b.categories, `${path}.categories`, ctx.errors, 2, 'categorías').map((c, i) => {
      const p = `${path}.categories[${i}]`;
      const o = rec(c, p, ctx.errors, ['name', 'items']);
      const items = list(o.items, `${p}.items`, ctx.errors, 0, 'elementos').map((it, j) => cText(it, `${p}.items[${j}]`, ctx.errors));
      return { name: cText(o.name, `${p}.name`, ctx.errors), items };
    });
    if (categories.length && categories.every((c) => c.items.length === 0)) ctx.errors.push(`${path}.categories: debe haber al menos un elemento para clasificar.`);
    if (!uniq(categories.map((c) => ctPlain(c.name)))) ctx.errors.push(`${path}.categories: hay nombres de categoría repetidos.`);
    return { prompt: cText(b.prompt, `${path}.prompt`, ctx.errors), categories };
  },
  swipe: (b, path, ctx) => {
    checkKeys(b, ['prompt', 'categoryLeft', 'categoryRight', 'items'], path, ctx.errors);
    const items = list(b.items, `${path}.items`, ctx.errors, 1, 'elemento').map((it, i) => {
      const p = `${path}.items[${i}]`;
      const o = rec(it, p, ctx.errors, ['label', 'category']);
      if (o.category !== 0 && o.category !== 1) ctx.errors.push(`${p}.category: debe ser 0 (categoría izquierda) o 1 (derecha).`);
      return { label: cText(o.label, `${p}.label`, ctx.errors), category: o.category === 1 ? 1 : 0 };
    });
    return {
      prompt: cText(b.prompt, `${path}.prompt`, ctx.errors),
      categoryLeft: cText(b.categoryLeft, `${path}.categoryLeft`, ctx.errors),
      categoryRight: cText(b.categoryRight, `${path}.categoryRight`, ctx.errors),
      items,
    };
  },
  essay: (b, path, ctx) => {
    checkKeys(b, ['prompt', 'minWords', 'placeholder'], path, ctx.errors);
    return {
      prompt: cText(b.prompt, `${path}.prompt`, ctx.errors),
      minWords: b.minWords === undefined ? 0 : intIn(b.minWords, 0, 10000, `${path}.minWords`, ctx.errors),
      placeholder: str(b.placeholder, `${path}.placeholder`, ctx.errors, 'Escribe tu respuesta…'),
    };
  },
  flashcards: (b, path, ctx) => {
    checkKeys(b, ['cards'], path, ctx.errors);
    const cards = list(b.cards, `${path}.cards`, ctx.errors, 1, 'tarjeta').map((c, i) => {
      const p = `${path}.cards[${i}]`;
      const o = rec(c, p, ctx.errors, ['front', 'front_img', 'front_alt', 'back']);
      const back = plainToDoc(reqStr(o.back, `${p}.back`, ctx.errors));
      if ((o.front === undefined) === (o.front_img === undefined)) {
        ctx.errors.push(`${p}: usa "front" (texto) o "front_img" (archivo de imagen), uno de los dos.`);
        return { front: { kind: 'text', doc: plainToDoc('') }, back };
      }
      if (o.front !== undefined) {
        return { front: { kind: 'text', doc: plainToDoc(reqStr(o.front, `${p}.front`, ctx.errors)) }, back };
      }
      const url = mediaName(o.front_img, 'image', `${p}.front_img`, ctx);
      const alt = str(o.front_alt, `${p}.front_alt`, ctx.errors);
      return { front: { kind: 'image', url, ...(alt ? { alt } : {}) }, back };
    });
    return { cards };
  },
  'image-hotspot': (b, path, ctx) => {
    checkKeys(b, ['img', 'prompt', 'spots'], path, ctx.errors);
    const spots = list(b.spots, `${path}.spots`, ctx.errors, 1, 'zona').map((s, i) => {
      const p = `${path}.spots[${i}]`;
      const o = rec(s, p, ctx.errors, ['x', 'y', 'label']);
      return { x: num0to100(o.x, `${p}.x`, ctx.errors), y: num0to100(o.y, `${p}.y`, ctx.errors), label: reqStr(o.label, `${p}.label`, ctx.errors) };
    });
    return { imageUrl: imageField(b, 'img', path, ctx), prompt: cText(b.prompt, `${path}.prompt`, ctx.errors), spots };
  },
  'image-labeling': (b, path, ctx) => {
    checkKeys(b, ['img', 'prompt', 'points'], path, ctx.errors);
    const points = list(b.points, `${path}.points`, ctx.errors, 1, 'punto').map((s, i) => {
      const p = `${path}.points[${i}]`;
      const o = rec(s, p, ctx.errors, ['x', 'y', 'label']);
      return { x: num0to100(o.x, `${p}.x`, ctx.errors), y: num0to100(o.y, `${p}.y`, ctx.errors), label: reqStr(o.label, `${p}.label`, ctx.errors) };
    });
    if (!uniq(points.map((p) => p.label))) ctx.errors.push(`${path}.points: las etiquetas deben ser únicas (son la respuesta correcta).`);
    return { imageUrl: imageField(b, 'img', path, ctx), prompt: cText(b.prompt, `${path}.prompt`, ctx.errors), points };
  },
};

function buildList(raw: unknown[], basePath: string, ctx: BuildContext, depth: number, allowed: string[] | undefined): BlockInstance[] {
  const out: BlockInstance[] = [];
  raw.forEach((item, i) => {
    const path = `${basePath}[${i}]`;
    if (!isRec(item) || typeof item.type !== 'string') {
      ctx.errors.push(`${path}: cada bloque debe ser un objeto con "type".`);
      return;
    }
    if (depth > MAX_NESTING) {
      ctx.errors.push(`${path}: demasiados niveles de bloques anidados (máximo ${MAX_NESTING}).`);
      return;
    }
    const builder = BUILDERS[item.type];
    if (!builder) {
      ctx.errors.push(`${path}: tipo de bloque no soportado (${JSON.stringify(item.type)}). Soportados: ${SUPPORTED_TYPES.join(', ')}.`);
      return;
    }
    if (allowed && !allowed.includes(item.type)) {
      ctx.errors.push(`${path}: el tipo "${item.type}" no se puede usar en "quiz" (Evaluación). Permitidos: ${allowed.join(', ')}.`);
      return;
    }
    const data = builder(item, path, ctx, depth);
    out.push({ id: ctx.newId(path, item.type), type: item.type, data });
  });
  return out;
}

/**
 * Validate every block and return the { id, type, data } list the editor stores.
 * `root` is 'content' (any block) or 'quiz' (Evaluación: only QUIZ_TYPES).
 */
export function buildBlocks(rawBlocks: unknown[], ctx: BuildContext, root: 'content' | 'quiz' = 'content'): BlockInstance[] {
  return buildList(rawBlocks, root, ctx, 0, root === 'quiz' ? QUIZ_TYPES : undefined);
}

/** Every block type in a (possibly nested) block list, for summaries. */
export function flattenTypes(blocks: BlockInstance[]): string[] {
  const out: string[] = [];
  for (const b of blocks) {
    out.push(b.type);
    const d = b.data as Rec;
    if (b.type === 'columns' && Array.isArray(d.columns)) {
      for (const col of d.columns as BlockInstance[][]) out.push(...flattenTypes(col));
    }
    if (b.type === 'container' && Array.isArray(d.children)) out.push(...flattenTypes(d.children as BlockInstance[]));
  }
  return out;
}

/** Key-order-insensitive deep equality (Postgres jsonb reorders object keys). */
export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (Array.isArray(a) || Array.isArray(b)) {
    return Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((v, i) => deepEqual(v, b[i]));
  }
  if (isRec(a) && isRec(b)) {
    const ka = Object.keys(a);
    const kb = Object.keys(b);
    return ka.length === kb.length && ka.every((k) => k in b && deepEqual(a[k], b[k]));
  }
  return false;
}
