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

Ejemplo completo en [`examples/in-on-under/lesson.json`](examples/in-on-under/lesson.json)
(sin imágenes: pon tus PNG/JPG junto al JSON con los mismos nombres).

| Campo | Obligatorio | Notas |
|---|---|---|
| `level` | sí | Código del nivel (`levels.code`), sin distinguir mayúsculas. |
| `order` | sí | Entero ≥ 1. Junto con `level` identifica la lección: reimportar **actualiza** en vez de duplicar. |
| `title` | sí | No vacío. |
| `skill_type` | no | Lista con `Listening, Reading, Writing, Speaking, Grammar, Vocabulary`. |
| `description`, `duration_minutes` | no | Texto / entero ≥ 0. |
| `author` | no | Nombre que verán los estudiantes (requiere la migración `20261108180000_lesson_author.sql`). |
| `content` | sí | Lista de bloques, escritos "planos": `{ "type": "...", ...campos }`. |

Las imágenes se escriben con `"img": "nombre del archivo.png"` (sin carpetas); el importador las
sube a R2 y pone la URL pública.

### Bloques soportados

| `type` | Campos |
|---|---|
| `heading` | `text`, `level` (1–3, por defecto 2) |
| `text` | `paragraphs`: lista de textos, **o** `doc`: JSON de Tiptap |
| `callout` | `text`, `variant`: `info` \| `warning` \| `success` \| `danger` \| `tip` (por defecto `info`) |
| `quote` | `text`, `author` |
| `image` | `img`, `alt`, `caption` |
| `gallery` | `images`: lista de `{ "img", "caption" }` |
| `table` | `rows`: lista de filas (mismo número de columnas), `hasHeader` (por defecto `true`) |
| `divider` | — |

`text` en `heading`/`callout`/`quote` puede ser un texto o `{ "t": "texto", "c": "#RRGGBB" }` (con color).
Cualquier otro tipo (actividades, quiz, etc.), un campo desconocido o un valor inválido se
**rechaza con un error claro**: nunca se descarta en silencio. Actividades y quiz no están en esta
versión; se crean desde el editor.

## Qué hace (y qué garantiza)

1. **Valida todo antes de tocar nada** (campos, bloques, que las imágenes existan y pesen ≤ 10 MB).
   Si hay un solo error, no escribe nada y los lista todos.
2. **Imágenes:** la clave en R2 depende del contenido del archivo, así que reimportar no duplica
   archivos ni cambia URLs; si ya existe, no se vuelve a subir.
3. **Idempotente por (nivel, `order`):** si no existe → crea la lección (borrador); si existe →
   la actualiza conservando su `id`, el progreso de los estudiantes y si está publicada; si hay
   más de una con ese orden → error (ambiguo).
4. **Ids de bloque:** en una actualización se reutiliza el id del bloque que ya estaba en esa
   posición y tipo; los nuevos usan `crypto.randomUUID()`.
5. **Actualizar reemplaza el contenido completo.** Lo que se haya editado a mano en el editor
   desde la última importación se sobrescribe; la simulación muestra el diff antes de aplicar.
6. El orden lo asigna un trigger al insertar (siguiente libre); el script lo ajusta después al
   valor pedido. Si deja un hueco en la numeración, te avisa.

## Primera vez

La base de datos es la de producción. Prueba con una lección nueva en un **nivel sin publicar**,
ábrela en el editor, edítala, reimporta (debe actualizarla, no duplicarla) y bórrala con el botón
de eliminar lección.
