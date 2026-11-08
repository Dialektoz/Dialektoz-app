/**
 * Validation + transformation of lesson.json into what the lesson editor saves.
 * Shared by the editor's "Importar desde JSON" dialog and the local CLI
 * (scripts/import-lesson). Pure and import-free on purpose, so it runs both in
 * the browser bundle and under plain Node; the caller injects the skills list.
 *
 * The editor's block registry can't run outside Next (it pulls in React and the
 * `@/` alias), so the block shapes are mirrored here, read from each block's
 * createDefault/Editor:
 *   heading  { text: CText, level: 1|2|3 }        callout { text: CText, variant }
 *   text     { doc: Tiptap JSON }                  quote   { text: CText, author }
 *   image    { url, alt, caption }                 gallery { images: [{ url, caption }] }
 *   table    { hasHeader, rows: string[][] }       divider {}
 * Blocks are written "flat" in lesson.json ({ type, ...fields }) and stored as
 * { id, type, data }. Nothing unknown is accepted: invalid values (e.g. a callout
 * variant) crash the editor, and unknown fields are usually typos.
 */

export interface BlockInstance {
  id: string;
  type: string;
  data: unknown;
}

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
  /** Image file names referenced by the lesson (as written in lesson.json). */
  images: Set<string>;
  resolveImage: (file: string) => string;
  /** Block id for the block at `path` (reuses the existing one on re-import). */
  newId: (path: string, type: string) => string;
}

type Rec = Record<string, unknown>;

const isRec = (v: unknown): v is Rec => typeof v === 'object' && v !== null && !Array.isArray(v);
const IMAGE_FILE = /^[^/\\]+\.(png|jpe?g|webp|gif)$/i;
const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;
const CALLOUT_VARIANTS = ['info', 'warning', 'success', 'danger', 'tip'];

export const SUPPORTED_TYPES = ['heading', 'text', 'callout', 'quote', 'image', 'gallery', 'table', 'divider'];

const TIPTAP_NODES = new Set([
  'doc',
  'paragraph',
  'text',
  'heading',
  'bulletList',
  'orderedList',
  'listItem',
  'blockquote',
  'codeBlock',
  'hardBreak',
  'horizontalRule',
]);
const TIPTAP_MARKS = new Set(['bold', 'italic', 'strike', 'code', 'link', 'underline', 'textStyle']);

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
): { fields?: LessonFields; content?: unknown[]; errors: string[] } {
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

  const known = ['level', 'order', 'title', 'skill_type', 'description', 'duration_minutes', 'author', 'content'];
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

  if (!Array.isArray(raw.content) || raw.content.length === 0) errors.push('"content" debe ser una lista con al menos un bloque.');

  if (errors.length) return { errors };
  return {
    errors,
    content: raw.content as unknown[],
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

// ── blocks ───────────────────────────────────────────────────────────────────

function checkKeys(b: Rec, allowed: string[], path: string, errors: string[]): void {
  for (const key of Object.keys(b)) {
    if (key !== 'type' && !allowed.includes(key)) errors.push(`${path}: campo desconocido "${key}".`);
  }
}

/** CText: a plain string, or { t, c? } with an optional #RRGGBB color. Empty text is rejected. */
function cText(v: unknown, path: string, errors: string[]): string | { t: string; c?: string } | undefined {
  if (typeof v === 'string') {
    if (!v.trim()) errors.push(`${path}: el texto no puede estar vacío.`);
    return v;
  }
  if (isRec(v) && typeof v.t === 'string' && v.t.trim()) {
    const extra = Object.keys(v).filter((k) => k !== 't' && k !== 'c');
    if (extra.length) errors.push(`${path}: campos desconocidos en el texto con color: ${extra.join(', ')}.`);
    if (v.c !== undefined && (typeof v.c !== 'string' || !HEX_COLOR.test(v.c))) {
      errors.push(`${path}: "c" debe ser un color #RRGGBB.`);
      return undefined;
    }
    return v.c ? { t: v.t, c: v.c as string } : v.t;
  }
  errors.push(`${path}: debe ser texto, o { "t": "...", "c": "#RRGGBB" }.`);
  return undefined;
}

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
      if (m.type === 'link' && !(typeof attrs.href === 'string' && /^(https?:\/\/|mailto:|\/)/i.test(attrs.href))) {
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

function imageFile(v: unknown, path: string, ctx: BuildContext): string {
  if (typeof v !== 'string' || !IMAGE_FILE.test(v)) {
    ctx.errors.push(`${path}: "img" debe ser el nombre de un archivo png/jpg/jpeg/webp/gif (sin carpetas).`);
    return '';
  }
  ctx.images.add(v);
  return ctx.resolveImage(v);
}

function str(v: unknown, path: string, errors: string[], fallback = ''): string {
  if (v === undefined || v === null) return fallback;
  if (typeof v !== 'string') {
    errors.push(`${path}: debe ser texto.`);
    return fallback;
  }
  return v;
}

function buildData(b: Rec, path: string, ctx: BuildContext): unknown {
  const { errors } = ctx;
  switch (b.type) {
    case 'heading': {
      checkKeys(b, ['text', 'level'], path, errors);
      const level = b.level === undefined ? 2 : b.level;
      if (level !== 1 && level !== 2 && level !== 3) errors.push(`${path}: "level" debe ser 1, 2 o 3.`);
      return { text: cText(b.text, `${path}.text`, errors) ?? '', level };
    }
    case 'callout': {
      checkKeys(b, ['text', 'variant'], path, errors);
      const variant = b.variant === undefined ? 'info' : b.variant;
      if (typeof variant !== 'string' || !CALLOUT_VARIANTS.includes(variant)) {
        errors.push(`${path}: "variant" debe ser uno de ${CALLOUT_VARIANTS.join(', ')}.`);
      }
      return { text: cText(b.text, `${path}.text`, errors) ?? '', variant };
    }
    case 'quote': {
      checkKeys(b, ['text', 'author'], path, errors);
      return { text: cText(b.text, `${path}.text`, errors) ?? '', author: str(b.author, `${path}.author`, errors) };
    }
    case 'text': {
      checkKeys(b, ['paragraphs', 'doc'], path, errors);
      if ((b.paragraphs === undefined) === (b.doc === undefined)) {
        errors.push(`${path}: usa "paragraphs" (lista de textos) o "doc" (JSON de Tiptap), no ambos ni ninguno.`);
        return { doc: { type: 'doc', content: [{ type: 'paragraph' }] } };
      }
      if (b.doc !== undefined) {
        if (!isRec(b.doc) || b.doc.type !== 'doc') errors.push(`${path}.doc: debe ser un documento Tiptap { "type": "doc", ... }.`);
        else checkTiptap(b.doc, `${path}.doc`, errors);
        return { doc: b.doc };
      }
      if (!Array.isArray(b.paragraphs) || b.paragraphs.length === 0 || b.paragraphs.some((p) => typeof p !== 'string')) {
        errors.push(`${path}.paragraphs: debe ser una lista de textos con al menos uno.`);
        return { doc: { type: 'doc', content: [{ type: 'paragraph' }] } };
      }
      const content = (b.paragraphs as string[]).map((p) =>
        p ? { type: 'paragraph', content: [{ type: 'text', text: p }] } : { type: 'paragraph' }
      );
      return { doc: { type: 'doc', content } };
    }
    case 'image': {
      checkKeys(b, ['img', 'alt', 'caption'], path, errors);
      return {
        url: imageFile(b.img, path, ctx),
        alt: str(b.alt, `${path}.alt`, errors),
        caption: str(b.caption, `${path}.caption`, errors),
      };
    }
    case 'gallery': {
      checkKeys(b, ['images'], path, errors);
      if (!Array.isArray(b.images) || b.images.length === 0) {
        errors.push(`${path}.images: debe ser una lista con al menos una imagen.`);
        return { images: [] };
      }
      const images = b.images.map((img, i) => {
        const p = `${path}.images[${i}]`;
        if (!isRec(img)) {
          errors.push(`${p}: debe ser un objeto { "img": "...", "caption": "..." }.`);
          return { url: '', caption: '' };
        }
        checkKeys({ type: 'x', ...img }, ['img', 'caption'], p, errors);
        return { url: imageFile(img.img, p, ctx), caption: str(img.caption, `${p}.caption`, errors) };
      });
      return { images };
    }
    case 'table': {
      checkKeys(b, ['hasHeader', 'rows'], path, errors);
      if (b.hasHeader !== undefined && typeof b.hasHeader !== 'boolean') errors.push(`${path}.hasHeader: debe ser true o false.`);
      const rows = b.rows;
      if (!Array.isArray(rows) || rows.length === 0 || rows.some((r) => !Array.isArray(r) || r.some((c) => typeof c !== 'string'))) {
        errors.push(`${path}.rows: debe ser una lista de filas, cada una una lista de textos.`);
        return { hasHeader: true, rows: [['']] };
      }
      const width = (rows[0] as string[]).length;
      if (width === 0 || rows.some((r) => (r as string[]).length !== width)) {
        errors.push(`${path}.rows: todas las filas deben tener el mismo número de columnas (≥ 1).`);
      }
      return { hasHeader: b.hasHeader === undefined ? true : b.hasHeader, rows };
    }
    case 'divider': {
      checkKeys(b, [], path, errors);
      return {};
    }
    default:
      errors.push(
        `${path}: tipo de bloque no soportado (${JSON.stringify(b.type)}). Soportados: ${SUPPORTED_TYPES.join(', ')}.`
      );
      return {};
  }
}

/** Validate every block and return the { id, type, data } list the editor stores. */
export function buildBlocks(rawBlocks: unknown[], ctx: BuildContext): BlockInstance[] {
  const out: BlockInstance[] = [];
  rawBlocks.forEach((raw, i) => {
    const path = `content[${i}]`;
    if (!isRec(raw) || typeof raw.type !== 'string') {
      ctx.errors.push(`${path}: cada bloque debe ser un objeto con "type".`);
      return;
    }
    const data = buildData(raw, path, ctx);
    out.push({ id: ctx.newId(path, raw.type), type: raw.type, data });
  });
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
