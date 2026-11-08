# Importador de lecciones (extra opcional)

Crea o actualiza **una lección** a partir de una carpeta con `lesson.json` + las imágenes que usa.
Es un extra: el editor de `/admin/content` sigue siendo la vía principal y no depende de esto.
Todo lo importado se abre y se edita en el editor igual que cualquier lección.

> **Sin llaves ni terminal:** el mismo formato de `lesson.json` se puede importar **desde el
> editor**: en la pestaña Contenido, abre el menú "+" y elige **Importar desde JSON** (pie del
> menú). Pegas el JSON, eliges las imágenes y se **insertan los bloques en la lección abierta**
> (y se completan los campos vacíos). Ahí `level` y `order` se ignoran. Este documento describe el
> comando local, que además puede crear/actualizar una lección completa por (nivel, orden).
> Ambos usan el validador `src/lib/lessonImport.ts`.

## Uso

```bash
# 1. Simulación (por defecto): muestra qué se subiría y qué cambiaría. No escribe nada.
npm run import:lesson -- ruta/a/mi-leccion

# 2. Aplicar: sube las imágenes a R2 y crea/actualiza la lección.
npm run import:lesson -- ruta/a/mi-leccion --apply
```

Requiere Node 22.18+ (probado en Node 24). No instala dependencias nuevas.

## Secretos (nunca en git)

Se leen de `apps/web/.env.local` (ya ignorado por git: `.env*`). Nunca los pegues en el código,
en `lesson.json` ni en un commit. Nombres de las variables (los valores son tuyos):

```
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET=...
R2_PUBLIC_BASE_URL=...
```

La simulación solo necesita las dos de Supabase (y `R2_PUBLIC_BASE_URL` para mostrar las URLs
finales). `--apply` necesita todas.

**La llave `SUPABASE_SERVICE_ROLE_KEY` se salta la seguridad por filas (RLS).** Por eso el script
solo lee `levels`, lee/inserta/actualiza `lessons`, **nunca borra**, inserta siempre con
`published=false` y **nunca cambia `published`** de una lección existente. Guarda tus lecciones
reales (con imágenes que pueden tener derechos) en `scripts/import-lesson/content/`, que está
ignorada por git.

## Formato de `lesson.json`

> **¿Quién escribe el JSON?** El chat. Pega [`PROMPT.md`](PROMPT.md) al inicio de la conversación donde
> creas el contenido y el chat te entrega el JSON y la lista de archivos a crear. Tú solo importas y
> verificas en la página.

Ejemplos: [`examples/all-blocks/lesson.json`](examples/all-blocks/lesson.json) (los 32 tipos de bloque menos
audio y documento; ideal para probar: usa `demo-1.png` y `demo-2.png`, cualquier imagen renombrada) y
[`examples/in-on-under/lesson.json`](examples/in-on-under/lesson.json) (lección corta real).

| Campo | Obligatorio | Notas |
|---|---|---|
| `level` | sí (comando) | Código del nivel (`levels.code`), sin distinguir mayúsculas. En el editor se ignora. |
| `order` | sí (comando) | Entero ≥ 1. Con `level` identifica la lección: reimportar **actualiza** en vez de duplicar. |
| `title` | sí (comando) | No vacío. |
| `skill_type` | no | Lista con `Listening, Reading, Writing, Speaking, Grammar, Vocabulary`. |
| `description`, `duration_minutes` | no | Texto / entero ≥ 0. |
| `author` | no | Nombre que verán los estudiantes (requiere la migración `20261108180000_lesson_author.sql`). |
| `content` | uno de los dos | Bloques del Contenido, escritos "planos": `{ "type": "...", ...campos }`. |
| `quiz` | uno de los dos | Preguntas de **Evaluación** (las que puntúan y cuentan para el examen). Solo `heading, text, quiz, multi-choice, true-false, fill-blank, short-answer`. |

Los archivos se escriben solo con su nombre (sin carpetas) y se reemplazan por la URL pública:
`"img"` para imágenes y `"file"` para audio, video y documentos (o `"url"` https externa).

### Bloques soportados (los 32 del editor)

| Grupo | `type` y campos |
|---|---|
| Texto | `heading` (`text`, `level` 1–3) · `text` (**uno de**: `paragraphs` lista de textos, `markdown` con **negrita**, *cursiva*, listas y enlaces, o `doc` Tiptap) · `callout` (`text`, `variant` info/warning/success/danger/tip) · `quote` (`text`, `author`) |
| Imágenes | `image` (`img`, `alt`, `caption`) · `gallery` (`images`: `{img, caption}`) |
| Media | `audio` (`file`|`url`, `title`) · `video` (`file`|`url`, `caption`) · `file` (`file`|`url`, `name`, `showPreview`) · `embed` (`url`, `height` 100–1200) |
| Estructura | `table` (`rows`, `hasHeader`) · `divider` · `accordion` (`items`: `{title, body}`) · `tabs` (`tabs`: `{label, body}`) · `timeline` (`events`: `{date, title, description}`) · `columns` (`columns`: 2–4 listas de bloques) · `container` (`title`, `variant`, `children`) · `code` (`code`, `language`) · `button` (`label`, `url`, `align`, `variant`) |
| Actividades | `quiz` (`question`, `options`, `correctIndex`, `feedback`) · `multi-choice` (`correctIndices`) · `true-false` (`statement`, `answer`) · `fill-blank` (`text` con `{{respuesta}}`) · `short-answer` (`answers`, `caseSensitive`) · `ordering` (`items` en el orden correcto) · `matching` (`pairs`: `{left, right}`) · `classification` (`categories`: `{name, items}`) · `swipe` (`categoryLeft`, `categoryRight`, `items`: `{label, category 0|1}`) · `essay` (`minWords`, `placeholder`) · `flashcards` (`cards`: `{front|front_img, front_alt, back}`) · `image-hotspot` (`img`, `spots`: `{x, y, label}`) · `image-labeling` (`img`, `points`: `{x, y, label}`) |

Los textos de `heading`/`callout`/`quote` y de las actividades pueden ser un texto o
`{ "t": "texto", "c": "#RRGGBB" }` (con color). `x` e `y` son porcentajes (0–100) desde la esquina superior
izquierda de la imagen.

**Reglas que el importador impone** (un error las lista todas, con la ruta exacta, y no escribe nada):
cada actividad se valida por su tipo (respuesta correcta dentro de las opciones, huecos `{{ }}` con
respuesta, categorías 0/1, etiquetas únicas…); campos desconocidos y tipos no soportados se **rechazan**,
nunca se descartan en silencio; `quiz` solo admite los 7 tipos de arriba. Archivos: imágenes png/jpg/jpeg/webp/gif
(≤ 10 MB), audio mp3/wav/m4a/ogg (≤ 50 MB), video mp4/webm/mov/m4v (≤ 200 MB), documentos
pdf/doc(x)/xls(x)/ppt(x)/txt/csv/zip (≤ 50 MB). Enlaces: solo `https://`; para `embed` y videos que no son un archivo
directo, solo sitios de la lista de `IFRAME_HOSTS` en `src/lib/lessonImport.ts` (YouTube, Vimeo, Genially, Canva,
Google Docs/Drive, Wordwall, Quizlet, Padlet, H5P, Loom); otro sitio se añade a mano en el editor (los renderers no
sanitizan URLs ni usan `sandbox`).

**Puntaje:** solo cuenta lo que va en `quiz` (Evaluación). Las actividades de `content` son práctica libre.

## Qué hace (y qué garantiza)

1. **Valida todo antes de tocar nada** (campos, bloques, que los archivos existan y no excedan su tope).
   Si hay un solo error, no escribe nada y los lista todos.
2. **Archivos:** la clave en R2 depende del contenido del archivo, así que reimportar no duplica
   archivos ni cambia URLs; si ya existe, no se vuelve a subir.
3. **Idempotente por (nivel, `order`):** si no existe → crea la lección (borrador); si existe →
   la actualiza conservando su `id`, el progreso de los estudiantes y si está publicada; si hay
   más de una con ese orden → error (ambiguo).
4. **Ids de bloque:** en una actualización se reutiliza el id del bloque que ya estaba en esa
   posición (también dentro de columnas y contenedores) y tipo; los nuevos usan `crypto.randomUUID()`.
5. **`quiz`:** solo se toca si el JSON trae la clave `quiz` (en ese caso reemplaza la Evaluación completa).
6. **Actualizar reemplaza el contenido completo.** Lo que se haya editado a mano en el editor
   desde la última importación se sobrescribe; la simulación muestra el diff antes de aplicar.
7. El orden lo asigna un trigger al insertar (siguiente libre); el script lo ajusta después al
   valor pedido. Si deja un hueco en la numeración, te avisa.

## Primera vez

La base de datos es la de producción. Prueba con una lección nueva en un **nivel sin publicar**,
ábrela en el editor, edítala, reimporta (debe actualizarla, no duplicarla) y bórrala con el botón
de eliminar lección.
