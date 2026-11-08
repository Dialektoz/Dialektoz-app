/**
 * Optional lesson importer (staff tool, runs on your own machine).
 *
 *   npm run import:lesson -- <folder>           dry-run: shows what would change, writes nothing
 *   npm run import:lesson -- <folder> --apply   uploads images to R2 and inserts/updates the lesson
 *
 * <folder> holds lesson.json plus the images it references by file name.
 * See README.md for the format. Secrets come from apps/web/.env.local (git-ignored).
 *
 * Uses the Supabase service-role key, which bypasses RLS: this script only ever
 * reads `levels`, reads/inserts/updates `lessons`, never deletes, always inserts
 * with published=false and never changes `published` on an existing lesson.
 */
import { existsSync, readFileSync, statSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { loadEnvFile, readEnv } from './env.ts';
import { R2_ENV, contentTypeFor, createR2, imageKey, publicUrlFor } from './r2.ts';
import { buildBlocks, deepEqual, validateLesson } from './validate.ts';
import type { BlockInstance } from './validate.ts';

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MIGRATION = '20261108180000_lesson_author.sql';

type Row = Record<string, unknown>;

function die(lines: string[]): never {
  console.error(lines.map((l) => `  ✗ ${l}`).join('\n'));
  console.error('\nNo se escribió nada.');
  process.exit(1);
}

async function main() {
  const args = process.argv.slice(2);
  const apply = args.includes('--apply');
  const unknownFlags = args.filter((a) => a.startsWith('-') && a !== '--apply');
  const positional = args.filter((a) => !a.startsWith('-'));
  if (unknownFlags.length || positional.length !== 1) {
    console.error('Uso: npm run import:lesson -- <carpeta> [--apply]');
    process.exit(1);
  }
  const folder = resolve(positional[0]);

  // apps/web/.env.local (this file lives in apps/web/scripts/import-lesson/)
  const envPath = fileURLToPath(new URL('../../.env.local', import.meta.url));
  if (!loadEnvFile(envPath)) console.warn(`(No se encontró ${envPath}; se usarán las variables del entorno.)`);

  // 1. Read + validate everything before touching anything.
  const jsonPath = join(folder, 'lesson.json');
  if (!existsSync(jsonPath)) die([`No existe ${jsonPath}`]);
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(jsonPath, 'utf8'));
  } catch (e) {
    die([`lesson.json no es JSON válido: ${(e as Error).message}`]);
  }

  const lesson = validateLesson(raw);
  if (!lesson.fields || !lesson.content) die(lesson.errors);
  const fields = lesson.fields;

  const errors: string[] = [];
  const firstPass = new Set<string>();
  buildBlocks(lesson.content, {
    errors,
    images: firstPass,
    resolveImage: (f) => f,
    newId: () => 'tmp',
  });

  const imageBytes = new Map<string, Uint8Array>();
  for (const file of firstPass) {
    const path = join(folder, file);
    if (!existsSync(path) || !statSync(path).isFile()) {
      errors.push(`Falta la imagen "${file}" en ${folder}.`);
      continue;
    }
    const size = statSync(path).size;
    if (size === 0 || size > MAX_IMAGE_BYTES) {
      errors.push(`La imagen "${file}" pesa ${size} bytes (debe estar entre 1 y ${MAX_IMAGE_BYTES}).`);
      continue;
    }
    imageBytes.set(file, new Uint8Array(readFileSync(path)));
  }
  if (errors.length) die(errors);

  // 2. Environment. Dry-run only reads Supabase; --apply also needs R2.
  const supa = readEnv(['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']);
  const r2Env = readEnv(R2_ENV);
  const missing = [...supa.missing, ...(apply ? r2Env.missing : [])];
  if (missing.length) die([`Faltan variables en apps/web/.env.local: ${missing.join(', ')}`]);

  const sb = createClient(supa.values.NEXT_PUBLIC_SUPABASE_URL, supa.values.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // 3. Resolve level + existing lesson (idempotency key = level code + order).
  const { data: levels, error: levelsError } = await sb.from('levels').select('id, code, title');
  if (levelsError) die([`No se pudieron leer los niveles: ${levelsError.message}`]);
  const level = (levels ?? []).find((l: Row) => String(l.code).trim().toLowerCase() === fields.level.toLowerCase());
  if (!level) {
    die([
      `No existe el nivel "${fields.level}". Niveles disponibles: ${(levels ?? []).map((l: Row) => l.code).join(', ') || '(ninguno)'}.`,
    ]);
  }

  const { data: levelLessons, error: lessonsError } = await sb
    .from('lessons')
    .select('*')
    .eq('level_id', level.id)
    .order('order', { ascending: true });
  if (lessonsError) die([`No se pudieron leer las lecciones del nivel: ${lessonsError.message}`]);
  const rows = (levelLessons ?? []) as Row[];

  const matches = rows.filter((l) => l.order === fields.order);
  if (matches.length > 1) {
    die([`Hay ${matches.length} lecciones con orden ${fields.order} en el nivel ${level.code}; resuélvelo a mano (ambiguo).`]);
  }
  const existing = matches[0];

  if (fields.author && rows.length > 0 && !('author_name' in rows[0])) {
    die([`La base de datos aún no tiene la columna author_name. Aplica la migración ${MIGRATION} y reintenta.`]);
  }

  // 4. Build the final blocks: R2 URLs from deterministic keys, ids reused from the existing lesson.
  const publicBase = r2Env.values.R2_PUBLIC_BASE_URL ?? 'https://<R2_PUBLIC_BASE_URL>';
  const keyByFile = new Map<string, string>();
  for (const [file, bytes] of imageBytes) keyByFile.set(file, imageKey(file, bytes));

  const oldBlocks = existing && Array.isArray(existing.content) ? (existing.content as Row[]) : [];
  const finalErrors: string[] = [];
  const blocks: BlockInstance[] = buildBlocks(lesson.content, {
    errors: finalErrors,
    images: new Set<string>(),
    resolveImage: (file) => publicUrlFor(publicBase, keyByFile.get(file) as string),
    newId: (path, type) => {
      const old = oldBlocks[Number(/\[(\d+)\]/.exec(path)?.[1])];
      return old && typeof old.id === 'string' && old.type === type ? old.id : randomUUID();
    },
  });
  if (finalErrors.length) die(finalErrors);

  const row: Row = {
    title: fields.title,
    description: fields.description,
    skill_type: fields.skill_type,
    duration_minutes: fields.duration_minutes,
    content: blocks,
  };
  if (fields.author) row.author_name = fields.author;

  // 5. Report the plan (always printed, so --apply shows what it is about to do).
  console.log(`\n${apply ? 'APLICANDO' : 'DRY-RUN (no se escribe nada; usa --apply para aplicar)'}`);
  console.log(`Lección: "${fields.title}"  →  nivel ${level.code}, orden ${fields.order}`);

  if (existing) {
    console.log(`Acción: ACTUALIZAR la lección existente ${existing.id} (se conservan su id, su progreso y su estado de publicación).`);
    const changed: string[] = [];
    for (const key of ['title', 'description', 'skill_type', 'duration_minutes'] as const) {
      if (existing[key] !== row[key]) changed.push(`${key}: ${JSON.stringify(existing[key] ?? null)} → ${JSON.stringify(row[key])}`);
    }
    if (fields.author && existing.author_name !== fields.author) {
      changed.push(`author_name: ${JSON.stringify(existing.author_name ?? null)} → ${JSON.stringify(fields.author)}`);
    }
    console.log(changed.length ? `Campos que cambian:\n${changed.map((c) => `  - ${c}`).join('\n')}` : 'Campos: sin cambios.');
    const total = Math.max(oldBlocks.length, blocks.length);
    const diffs: string[] = [];
    for (let i = 0; i < total; i++) {
      const o = oldBlocks[i];
      const n = blocks[i];
      if (!o) diffs.push(`  + bloque ${i + 1} (${n.type}): nuevo`);
      else if (!n) diffs.push(`  - bloque ${i + 1} (${String(o.type)}): se elimina`);
      else if (!deepEqual({ type: o.type, data: o.data }, { type: n.type, data: n.data })) diffs.push(`  ~ bloque ${i + 1} (${n.type}): cambia`);
    }
    console.log(diffs.length ? `Bloques:\n${diffs.join('\n')}` : 'Bloques: sin cambios.');
    console.log('⚠ Actualizar reemplaza el contenido completo: lo que se haya editado a mano en el editor se sobrescribe.');
  } else {
    console.log('Acción: INSERTAR lección nueva (published=false).');
    const maxOrder = rows.reduce((m, l) => Math.max(m, Number(l.order) || 0), 0);
    if (fields.order > maxOrder + 1) {
      console.log(`⚠ El nivel tiene ${rows.length} lecciones (orden máx. ${maxOrder}); el orden ${fields.order} dejará un hueco.`);
    }
    console.log(`Bloques (${blocks.length}): ${blocks.map((b) => b.type).join(', ')}`);
  }

  console.log(`Imágenes (${imageBytes.size}):`);
  for (const [file, key] of keyByFile) console.log(`  - ${file}  →  ${key}`);

  if (!apply) {
    console.log('\nNada se subió ni se escribió.');
    return;
  }

  // 6. Apply: R2 first (idempotent), then the database.
  const r2 = createR2(r2Env.values);
  for (const [file, key] of keyByFile) {
    if (await r2.exists(key)) {
      console.log(`  = ${file}: ya estaba en R2, no se vuelve a subir`);
    } else {
      await r2.put(key, imageBytes.get(file) as Uint8Array, contentTypeFor(file));
      console.log(`  ↑ ${file}: subida`);
    }
  }

  let lessonId: string;
  if (existing) {
    const { error } = await sb.from('lessons').update(row).eq('id', existing.id);
    if (error) die([`No se pudo actualizar la lección: ${error.message}`]);
    lessonId = String(existing.id);
  } else {
    const { data, error } = await sb
      .from('lessons')
      .insert({ level_id: level.id, ...row, published: false })
      .select('id')
      .single();
    if (error || !data) die([`No se pudo crear la lección: ${error?.message ?? 'sin respuesta'}`]);
    lessonId = String(data.id);
    // A DB trigger assigns the next free order on insert; set the requested one afterwards.
    const { error: orderError } = await sb.from('lessons').update({ order: fields.order }).eq('id', lessonId);
    if (orderError) die([`La lección se creó (${lessonId}) pero no se pudo fijar el orden: ${orderError.message}`]);
  }

  console.log(`\n✓ Listo. Lección ${lessonId} (${existing ? 'actualizada' : 'creada como borrador'}).`);
  console.log(`  Ábrela en /admin/content/lessons/${lessonId}/edit`);
}

main().catch((e: unknown) => {
  console.error(`\nError inesperado: ${(e as Error).message}`);
  process.exit(1);
});
