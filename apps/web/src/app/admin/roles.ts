/**
 * Role hierarchy and the rules for who may change whom.
 *
 * Lives in its own file (not actions.ts) because Next.js' "use server" files
 * can only export async functions — exporting constants/types/pure helpers
 * from there triggers an "invalid-use-server-value" runtime error.
 *
 * Hierarchy (high → low):
 *   superadmin > admin > teacher > premium / student_premium / free
 *
 * Rules:
 *   - SuperAdmin: may set anyone to any role (incl. admin/superadmin), but
 *     may NOT change an existing superadmin's role (irrevocable / inviolable).
 *   - Admin: may set teacher / premium / student_premium / free. May not
 *     create admins or superadmins, nor modify admins/superadmins.
 *   - Teacher and below: may not change roles at all.
 *   - Nobody may change their own role.
 */

export const ALL_ROLES = ['superadmin', 'admin', 'teacher', 'premium', 'student_premium', 'free'] as const
export type Role = (typeof ALL_ROLES)[number]

// Backwards-compatible alias used elsewhere.
export const ASSIGNABLE_ROLES = ALL_ROLES
export type AssignableRole = Role

export const ROLE_LABEL: Record<string, string> = {
  superadmin: 'Super Admin',
  admin: 'Admin',
  teacher: 'Teacher',
  premium: 'Premium',
  student_premium: 'Student Premium',
  free: 'Free',
  student: 'Free',
}

export const ROLE_DESCRIPTION: Record<Role, string> = {
  superadmin: 'Fundador — control total, irrevocable',
  admin: 'Coordinador — gestiona profesores y membresías',
  teacher: 'Profesor — gestiona contenido y ve progreso',
  premium: 'Estudiante con suscripción',
  student_premium: 'Estudiante premium de la academia',
  free: 'Estudiante sin suscripción',
}

export function isRole(value: string): value is Role {
  return (ALL_ROLES as readonly string[]).includes(value)
}

/** Roles an actor is allowed to hand out. */
export function assignableRolesFor(actor: string): Role[] {
  if (actor === 'superadmin') return ['superadmin', 'admin', 'teacher', 'premium', 'student_premium', 'free']
  if (actor === 'admin') return ['teacher', 'premium', 'student_premium', 'free']
  return []
}

/** Can `actor` change a user currently at `targetCurrent` to `newRole`? */
export function canAssignRole(actor: string, targetCurrent: string, newRole: string): boolean {
  // A superadmin's role is inviolable — nobody can change it.
  if (targetCurrent === 'superadmin') return false
  // The new role must be within the actor's power to grant.
  if (!assignableRolesFor(actor).includes(newRole as Role)) return false
  // Only a superadmin may modify an existing admin.
  if (actor !== 'superadmin' && targetCurrent === 'admin') return false
  return true
}

/** Whether the actor can change this target's role at all (drives the UI). */
export function canManageTarget(actor: string, targetCurrent: string): boolean {
  return assignableRolesFor(actor).some((r) => canAssignRole(actor, targetCurrent, r))
}
