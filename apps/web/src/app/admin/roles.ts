/**
 * Roles accepted across the admin panel.
 * Keep this in sync with whatever check constraint we add to profiles.role.
 *
 * Lives in its own file (not actions.ts) because Next.js' "use server" files
 * can only export async functions — exporting constants/types from there
 * triggers an "invalid-use-server-value" runtime error.
 */
export const ASSIGNABLE_ROLES = ['admin', 'teacher', 'premium', 'student_premium', 'free'] as const
export type AssignableRole = typeof ASSIGNABLE_ROLES[number]
