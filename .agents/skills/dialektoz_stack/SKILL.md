---
name: Dialektoz Architecture Guidelines
description: Especificaciones técnicas detalladas y guía de desarrollo para la plataforma web y móvil Dialektoz (Next.js, React Native/Expo, Tailwind, Supabase).
---

# Dialektoz - Guía de Arquitectura y Desarrollo

Esta skill (guía técnica) sirve como la fuente de la verdad para las decisiones arquitectónicas y el stack tecnológico de Dialektoz, una plataforma de aprendizaje de inglés moderna dividida en niveles (A1-C1), habilidades (Listening, Reading, Writing, Speaking) y casos de uso situacionales.

## 1. Arquitectura de Alto Nivel: Monorepo

Dado que el proyecto requiere aplicación Web y Móvil, utilizaremos una arquitectura de **Monorepo** para compartir código (lógica de negocio, tipos, validaciones y configuración) entre ambas plataformas.

*   **Herramienta de Monorepo:** Turborepo + pnpm (Workspaces).
*   **Estructura sugerida:**
    *   `apps/web`: Aplicación web en Next.js.
    *   `apps/mobile`: Aplicación móvil en React Native (Expo).
    *   `packages/ui`: Componentes de interfaz compartidos (React + Tailwind).
    *   `packages/config`: Configuraciones de ESLint, TypeScript, Tailwind.
    *   `packages/core`: Lógica de negocio de Dialektoz, cliente (SDK) de Supabase, tipos y schemas (Zod).

## 2. Stack Tecnológico (Especificaciones)

### 2.1 Web (apps/web)
*   **Framework:** Next.js (App Router preferido para React Server Components).
*   **Estilos:** Tailwind CSS.
*   **Componentes UI:** Shadcn UI (Radix UI + Tailwind) para accesibilidad y un diseño premium.
*   **Animaciones:** Framer Motion (crucial para la fluidez, transiciones de módulos, feedback visual al responder).

### 2.2 Móvil (apps/mobile)
*   **Framework:** React Native con Expo (Managed Workflow, Expo Router para navegación).
*   **Estilos:** NativeWind (permite usar clases de Tailwind en React Native).
*   **Animaciones:** React Native Reanimated.

### 2.3 Backend y Base de Datos (Compartido - BaaS)
*   **Proveedor:** Supabase.
*   **Base de Datos:** PostgreSQL. Ideal y robusta para guardar perfiles de usuario, progreso por niveles (A1-C1) y métricas de habilidades.
*   **Autenticación:** Supabase Auth (Email, Apple, Google Logins).
*   **Almacenamiento (Storage):** Supabase Storage para alojar los archivos de audio (Listening) y recursos visuales.

### 2.4 Estado y Data Fetching
*   **Data Fetching & Cache:** TanStack Query (React Query) para manejar las peticiones a Supabase y mantener el progreso y UI sincronizados con una gran experiencia de usuario (cacheo activo).
*   **Estado Global:** Zustand (ligero, escalable y sin boilerplate) para estados puramente del cliente como tema oscuro/claro, preferencias del usuario o estado de la sesión de práctica actual.

## 3. Implementación Específica por Habilidades (Skills)

### 3.1 Listening (Comprensión Auditiva)
*   **Almacenamiento:** Archivos de audio curados en Supabase Storage.
*   **Reproductor Web:** `Howler.js` o la API nativa `HTMLAudioElement` para control preciso (pausar, volver a escuchar, cambiar velocidad de reproducción a x0.5).
*   **Reproductor Móvil:** `expo-av`.

### 3.2 Speaking (Producción Oral)
*   **Captura de Audio:** Identificar uso con `MediaRecorder` o Web Speech API (Web), y `expo-av` Audio Recording (Móvil).
*   **Evaluación y Transcripción:** Uso de servicios de IA en la nube como **OpenAI Whisper API** (u otros STT - Speech to Text modernos) para capturar el texto hablado y compararlo con la respuesta esperada para dar retroalimentación sobre la pronunciación.

### 3.3 Reading & Writing
*   **Renderizado de Texto:** `react-markdown` para presentar lecciones, notas gramaticales, ejemplos y diálogos. 
*   **Validación de Escritura:** Algoritmos de "fuzzy matching" (ej. distancia de Levenshtein) en el frontend para no penalizar excesivamente los errores tipográficos menores (typos) en ejercicios de fill-in-the-blanks.

## 4. Estructura de Datos Base (Mental Model para la BD)

La arquitectura de la base de datos reflejará la progresión holística:
1.  **Niveles:** A1, A2, B1, B2, C1, C2.
2.  **Módulos/Situaciones:** Ej. "Ordering at the restaurant", "Airport navigation".
3.  **Secciones/Habilidades:** Listening, Reading, Writing, Speaking dentro de un módulo.
4.  **Lecciones/Preguntas:** El contenido atómico a consumir.

## 5. Development Language Guidelines

*   **Code and Documentation:** All code (variables, functions, components), commits, comments, and internal documentation **MUST be written in English**.
*   **User-Facing Content:** The default language for the user interface texts, instructions, and learning materials will be **Spanish** by default (since it is an English learning app for Spanish speakers).
*   **Responsive Design (Mobile First):** All web UI components **MUST** be fully responsive. Always start styling for mobile (`w-full`, `flex-col`, `p-4`) and use Tailwind breakpoints (`sm:`, `md:`, `lg:`, `xl:`) to adapt the layout for larger screens.

*NOTA PARA EL AGENTE DE IA: Durante el desarrollo de Dialektoz, DEBES consultar e internalizar esta skill. Garantiza que las decisiones de código mantengan consistencia tecnológica, promoviendo el aislamiento de UI y lógica en caso de ser necesario dada la naturaleza dual (Web/Mobile) del stack. Cumple siempre estrictamente con la regla de código/comentarios en inglés, contenido de la app en español, y **diseño responsivo por defecto**.*
