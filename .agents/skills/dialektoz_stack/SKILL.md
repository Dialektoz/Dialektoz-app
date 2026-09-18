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

## 5. Development Language Guidelines

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
