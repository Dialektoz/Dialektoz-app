# Migraciones de base de datos

Historial versionado del esquema de Supabase de Dialektoz.

## Cómo está organizado

Los archivos siguen el formato de la CLI de Supabase: `<version>_<nombre>.sql`, y se
aplican en orden alfabético (que es orden cronológico).

| Archivo | Qué hace |
|---|---|
| `20260420000000_baseline_schema.sql` | **Base.** Enums, `profiles` + su trigger de alta, y el modelo de contenido (`levels`, `lessons`, `user_progress`) |
| `20260722203720_content_rls_hardening_and_integrity.sql` | Restringe la escritura de contenido a `admin`/`teacher`; orden automático de lecciones |
| `20260722203748_fix_set_lesson_order_search_path.sql` | Endurece la función trigger |
| `20260722213204_learning_progress_and_level_creator.sql` | Creador del nivel denormalizado; índice único para el progreso |
| `20260722215909_dashboard_leaderboard_rpc.sql` | Primera versión de la clasificación |
| `20260722220245_leaderboard_name_fallback.sql` | Nombre por defecto en la clasificación |
| `20260723204559_progress_integrity_activity_and_gating.sql` | **Seguridad.** El progreso solo se escribe desde el servidor; log de actividad diaria; desbloqueo secuencial |
| `20260723204623_leaderboard_privacy_and_periods.sql` | Clasificación semanal/mensual/global + consentimiento |
| `20260723210901_profiles_column_privileges_lockdown.sql` | **Seguridad.** Impide que un usuario se cambie el rol a `admin` |
| `20260723211639_leaderboard_my_rank.sql` | Posición exacta del usuario |
| `20260723212231_certification_schema.sql` | Exámenes, intentos y certificados |
| `20260723212251_certificate_verification.sql` | Verificación pública del certificado y horas del nivel |
| `20260723213440_lesson_quiz_section.sql` | Separa cada lección en Contenido y Evaluación |

## Nota importante sobre el baseline

Las tablas de contenido y `profiles` se crearon originalmente **a mano desde el editor
SQL de Supabase**, sin quedar registradas en ningún archivo. El baseline las reconstruye
a partir del esquema en producción para que el proyecto se pueda recrear desde cero.

Por eso el baseline **no aparece en el historial remoto de migraciones** de Supabase:
sus objetos ya existían allí. Todas sus sentencias son **idempotentes**
(`create ... if not exists`), así que ejecutarlo contra el proyecto actual no cambia nada.

## Recrear el esquema en un proyecto nuevo

```bash
supabase link --project-ref <nuevo-project-ref>
supabase db push
```

## Qué NO está aquí

- **Los datos** (niveles, lecciones, usuarios). Esto es solo el esquema.
- **La configuración de Supabase Auth** (plantillas de correo, SMTP, proveedores).
- **El bucket de Cloudflare R2** y su política CORS, que se configuran aparte.

## Al hacer cambios nuevos

Si aplicas un cambio directamente en Supabase, **añade también el archivo aquí** con la
misma versión y nombre que registró Supabase (`supabase migration list` los muestra).
De lo contrario el repo vuelve a quedar desincronizado del esquema real.
