# Dialektoz

Plataforma para aprender inglés: ruta estructurada por niveles (A1–C1), editor de
lecciones basado en bloques (estilo Notion), gamificación (XP, rachas,
clasificación) y **certificación gratuita verificable** por nivel.

## Stack

| Capa | Tecnología |
|---|---|
| Framework | **Next.js 16** (App Router + Turbopack), **React 19**, **TypeScript 5** |
| Estilos / UI | **Tailwind CSS v4**, **shadcn/ui** sobre **Radix UI**, Framer Motion, lucide-react |
| Editor | **TipTap 3** (+ extensiones color / text-style) |
| Backend | **Supabase** — PostgreSQL con RLS, Auth (email + OAuth), RPCs `SECURITY DEFINER` |
| Media | **Cloudflare R2** (S3-compatible) vía `aws4fetch`, subidas con URL prefirmada |
| Deploy | **Vercel** (desde `main`) |

Runtime: **Node 20**.

## Arquitectura en breve

- **Editor de bloques modular** (`src/components/editor/blocks/`): cada bloque es un
  módulo autocontenido registrado en `registry.ts`. Añadir uno nuevo = crear un
  archivo + una línea. ~31 tipos: texto, media, layout anidado y actividades.
- **Lecciones en dos partes**: `content` (estudio) y `quiz` (evaluación calificada,
  que alimenta el examen de certificación del nivel).
- **Integridad del progreso**: `user_progress` y `user_activity` son de solo lectura
  para el cliente; toda escritura pasa por el RPC `record_progress` (valida
  autenticación, disponibilidad de la lección, desbloqueo secuencial y calcula el XP).
- **Certificación con calificación en servidor**: las respuestas correctas nunca se
  envían al navegador; el examen se corrige contra la base de datos y emite un
  certificado verificable públicamente en `/certificate/[serial]` y `/verify`.
- **Roles**: `superadmin` › `admin` › `teacher` › estudiantes, con matriz de permisos
  en `src/app/admin/roles.ts` aplicada en cliente y servidor.

## Puesta en marcha

```bash
npm install
npm run dev        # http://localhost:3000
```

### Variables de entorno (`.env.local`)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Cloudflare R2 (media/archivos)
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET=...
R2_PUBLIC_BASE_URL=https://pub-xxxx.r2.dev
```

El bucket de R2 necesita una política CORS que permita `PUT`/`GET` desde los orígenes
de la app (localhost + dominio de producción).

## Base de datos

El esquema está versionado en [`supabase/migrations/`](./supabase/migrations) (ver su
README). Para recrearlo en un proyecto nuevo:

```bash
supabase link --project-ref <ref>
supabase db push
```

> ⚠️ Al aplicar cualquier cambio en Supabase, añade también el archivo de migración
> correspondiente para que el repo no se desincronice del esquema real.

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run start` | Sirve el build |
| `npm run lint` | ESLint |

## Estructura

```
src/
  app/            Rutas (App Router): landing, auth, learn, admin, certification, verify…
    api/          Route handlers (uploads R2, exámenes)
  components/     UI: editor de bloques, learn, dashboard, admin, layout, landing
  lib/            Lógica: progress, streak, leaderboard, certification, exam/grading, r2…
  utils/supabase/ Clientes de Supabase (server, client, admin, middleware)
supabase/migrations/  Esquema versionado
```
