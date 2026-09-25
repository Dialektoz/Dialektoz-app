---
name: Dialektoz Architecture Guidelines
description: Especificaciones técnicas del stack tecnológico real de Dialektoz (Next.js, Supabase, Cloudflare R2, Vercel).
---

# Dialektoz - Guía de Arquitectura y Desarrollo

Esta skill (guía técnica) sirve como la fuente de la verdad para el stack tecnológico y las
decisiones arquitectónicas de Dialektoz, una plataforma de aprendizaje de inglés dividida en
niveles (A1-C1), lecciones por skill (listening, reading, writing, speaking) y ejercicios
interactivos.

## 1. Arquitectura de Alto Nivel: aplicación única

Dialektoz **no** es un monorepo. Es una única aplicación Next.js que vive en `apps/web` dentro
de este repositorio, gestionada con npm plano (sin Turborepo, sin pnpm workspaces, sin
`packages/` compartidos). No existe una app móvil nativa ni código React Native/Expo en este
repo — cualquier soporte móvil se resuelve con diseño web responsivo (mobile-first), no con una
app separada.

## 2. Stack Tecnológico (lo que realmente está instalado en `apps/web/package.json`)

*   **Framework:** Next.js 16 (App Router, React Server Components, build con Turbopack).
*   **Lenguaje:** TypeScript, React 19.
*   **Estilos:** Tailwind CSS v4 (`@tailwindcss/postcss`, `@tailwindcss/typography`).
*   **Componentes UI:** Estilo shadcn sobre primitivas de Radix UI (`radix-ui`,
    `class-variance-authority`, `tailwind-merge`, `tw-animate-css`) para accesibilidad y un
    diseño premium.
*   **Animaciones:** Framer Motion (transiciones de módulos, feedback visual al responder).
*   **Iconografía:** `lucide-react`.
*   **Editor de texto enriquecido:** Tiptap (`@tiptap/core`, `@tiptap/react`, `@tiptap/pm`,
    `@tiptap/starter-kit`, extensiones de color y text-style) — usado en el editor de contenido
    de lecciones dentro de `/admin`.
*   **Backend y Base de Datos:** Supabase (PostgreSQL + Auth + Row Level Security), consumido vía
    `@supabase/ssr` y `@supabase/supabase-js`. Los helpers de cliente/servidor/middleware viven
    en `src/utils/supabase/` (`client.ts`, `server.ts`, `middleware.ts`, `session.ts`, `admin.ts`).
*   **Almacenamiento de medios:** Cloudflare R2, con subidas vía PUT presignado firmado con
    `aws4fetch` (ver `src/lib/r2.ts`, `api/uploads/*`) — no Supabase Storage.
*   **Hosting/Deploy:** Vercel. Una sola rama (`main`); cada push a `main` dispara un deploy
    automático. No hay CI configurado aparte de eso.

## 3. Estado y Data Fetching

*   **No hay una librería de estado global ni de data-fetching** (no TanStack Query, no Zustand).
*   Los Server Components hacen fetch directo a Supabase; las páginas comparten sesión/perfil vía
    los helpers cacheados de `src/utils/supabase/session.ts` (`getCurrentUser()`,
    `getCurrentProfile()`), no vía un store de cliente.
*   Preferencias puramente de UI en el cliente (ej. si el sidebar está colapsado) se resuelven con
    un store mínimo hecho a mano sobre `useSyncExternalStore` + `localStorage`
    (`src/lib/sidebarStore.ts`), no con una librería de estado.

## 4. Estructura de Datos Base (mental model de la BD)

La arquitectura de la base de datos refleja la progresión holística real del producto:
1.  **Niveles (`levels`):** A1 a C1.
2.  **Lecciones (`lessons`):** contenido atómico por nivel, con bloques de contenido (JSON) por
    skill (listening, reading, writing, speaking) y tipo de ejercicio.
3.  **Progreso (`user_progress`, `user_activity`):** por usuario y lección, con cascada al borrar
    nivel/lección.
4.  **Certificación (`exams`, `exam_attempts`, `certificates`):** examen por nivel, verificación
    pública vía `/verify` y `/certificate/[serial]`.
5.  **Perfiles y roles (`profiles`):** `student`, `teacher`, `admin`, `superadmin` — ver
    `perf-security` SKILL.md para las reglas de RLS y gating por rol en el middleware.

## 5. Editor de Contenido: Arquitectura de Bloques

Las lecciones (`lessons.content` y `lessons.quiz`, ambos JSON) se arman como una lista de
bloques. La arquitectura vive en `src/components/editor/blocks/`:

*   **Contrato único** (`blocks/types.ts`): cada bloque exporta un `BlockDefinition` con
    `type`, `label`, `category`, `createDefault()`, un componente `Editor` (UI en `/admin`) y
    un componente `Renderer` (vista del alumno). El host (`BlockList.tsx`, `LessonBuilder.tsx`)
    nunca importa un bloque concreto — todo se resuelve vía `registry.ts`.
*   **Agregar un bloque nuevo** = crear un archivo en `blocks/<categoria>/` + una línea de
    import y una entrada en el array `BLOCKS` de `registry.ts`. Nada más del editor/renderer
    necesita cambiar. ~32 bloques ya registrados (texto, media, layout, actividades).
*   **Compatibilidad hacia atrás sin migraciones**: cuando cambia la forma de los datos de un
    bloque (ej. agregar un modo nuevo), el bloque normaliza los datos viejos él mismo al
    leerlos — no hay migraciones de base de datos para el contenido JSON de las lecciones. Ver
    `FlashcardsBlock.tsx` (`normalizeCard`) como ejemplo: soporta en el mismo archivo varios
    formatos históricos de una carta, del más viejo al actual.
*   **Color de texto — dos sistemas, a propósito, no los mezcles**:
    *   La mayoría de los bloques usan `CText` (`src/lib/ctext.ts`): texto plano + un color
        opcional para *todo el campo*. Es el sistema por defecto — liviano, sin dependencias,
        seguro de importar en el servidor (lo usa el motor de calificación de exámenes).
    *   Cuando hace falta colorear *fragmentos* de un mismo campo (ej. una palabra en rojo y
        otra en verde dentro de la misma flashcard), se usa el editor Tiptap real
        (`RichTextEditor.tsx`, contenido `JSONContent`), con su variante `compact` (sin
        encabezados/listas, pensada para campos cortos). Ver `FlashcardsBlock.tsx` para el
        caso de uso real y su normalización desde `CText` viejo hacia `JSONContent`.
*   **Actividades calificables**: un bloque marca `isGradable: true` y su `Renderer` llama a
    `useGradedActivity(blockId)` (`src/components/learn/LessonAttempt.tsx`), que devuelve
    `report(correct: boolean)`. El sistema de puntaje de la lección es **todo-o-nada por
    bloque** — no hay crédito parcial (ej. `ClassificationBlock`/`SwipeBlock` solo reportan
    `true` si el alumno acertó el 100% del bloque). Si una actividad futura necesita crédito
    parcial, eso requiere extender `LessonAttempt.tsx`; hoy no lo soporta.
*   **Media**: subida de imágenes/archivos vía `UploadDropzone.tsx` + `useR2Upload.ts` (R2
    presignado). El patrón estándar de un campo de imagen es dropzone **o** URL pegada a
    mano — ver `ImageBlock.tsx`.

## 6. Autoguardado del editor de lecciones

El editor de lecciones (`src/app/admin/content/lessons/[id]/edit/page.tsx`) autoguarda con
debounce (1.5s tras dejar de escribir) y:

*   Reintenta hasta 3 veces con backoff (1s/3s/7s) si falla el guardado.
*   Si todos los reintentos fallan, guarda una copia local en `localStorage` y muestra un
    banner de error con botón "Reintentar"; al volver a abrir la lección, ofrece restaurar
    esa copia.
*   Advierte antes de cerrar la pestaña/navegar si hay cambios sin confirmar (`beforeunload`),
    y fuerza un guardado antes de que el botón "Atrás" navegue.

## 7. Development Language Guidelines

*   **Code and Documentation:** All code (variables, functions, components), commits, comments,
    and internal documentation **MUST be written in English**.
*   **User-Facing Content:** The default language for the user interface texts, instructions, and
    learning materials will be **Spanish** by default (since it is an English learning app for
    Spanish speakers).
*   **Responsive Design (Mobile First):** All web UI components **MUST** be fully responsive.
    Always start styling for mobile (`w-full`, `flex-col`, `p-4`) and use Tailwind breakpoints
    (`sm:`, `md:`, `lg:`, `xl:`) to adapt the layout for larger screens.

*NOTA PARA EL AGENTE DE IA: Durante el desarrollo de Dialektoz, DEBES consultar e internalizar
esta skill junto con `perf-security` (apps/web/.claude/skills/perf-security/SKILL.md) para todo lo
relacionado con auth, RLS y performance. No asumas monorepo, app móvil, ni librerías que no estén
en `apps/web/package.json` — si una funcionalidad futura los necesita, esa es una decisión nueva a
tomar explícitamente, no algo ya decidido por este documento.*
