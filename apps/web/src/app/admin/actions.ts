'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { ASSIGNABLE_ROLES, type AssignableRole } from './roles'

async function verifyAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') throw new Error('Acceso denegado')
}

/**
 * Invite a teacher and email them their access.
 *
 * Flow:
 *  1. Call inviteUserByEmail — Supabase creates the auth user AND sends the
 *     "Invite user" templated email in one operation. The email contains a
 *     one-time link that lands the user signed in on /auth/callback.
 *  2. Upsert the profile with role=teacher, onboarding_completed=false.
 *  3. Middleware will route the freshly-arrived teacher to /change-password
 *     because onboarding_completed=false + role=teacher.
 *
 * WHY NOT createUser + send password in email:
 *   Supabase Auth's email templates only support pre-defined variables (.ConfirmationURL,
 *   .Email, .Token, .SiteURL, .Data). We cannot inject a generated random password into
 *   the email body without our own SMTP client (nodemailer). So instead of the
 *   "credentials in plaintext" UX, we use the secure invite flow: the teacher receives
 *   one click → set their own password.
 *
 * TEMPLATE TO CUSTOMIZE: Supabase Dashboard → Authentication → Emails → "Invite user".
 *   Suggested copy: "Has sido invitado como profesor a Dialektoz. Haz clic aquí para
 *   crear tu contraseña: {{ .ConfirmationURL }}".
 *
 * EMAIL DELIVERY: rides Supabase Auth SMTP today (built-in or custom). When custom
 * SMTP is enabled in Supabase Dashboard, the invite goes out via Zoho automatically —
 * no code change here.
 */
export async function createTeacher(formData: FormData): Promise<{ success?: boolean; error?: string; email?: string }> {
  await verifyAdmin()

  const firstName = (formData.get('first_name') as string).trim()
  const lastName = (formData.get('last_name') as string).trim()
  const email = (formData.get('email') as string).trim().toLowerCase()

  if (!firstName || !email) return { error: 'Nombre y email son obligatorios.' }

  const adminClient = createAdminClient()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
    email,
    {
      data: { first_name: firstName, last_name: lastName, role: 'teacher' },
      redirectTo: `${siteUrl}/auth/callback`,
    },
  )

  if (inviteError) {
    if (inviteError.message.toLowerCase().includes('already')) {
      return { error: 'Ya existe un usuario con ese correo.' }
    }
    return { error: inviteError.message }
  }

  const { error: profileError } = await adminClient.from('profiles').upsert({
    id: inviteData.user.id,
    first_name: firstName,
    last_name: lastName,
    role: 'teacher',
    onboarding_completed: false,
  })

  if (profileError) {
    // Roll back the auth user — invite link is now orphaned anyway.
    await adminClient.auth.admin.deleteUser(inviteData.user.id)
    return { error: profileError.message }
  }

  revalidatePath('/admin')
  revalidatePath('/admin/teachers')
  return { success: true, email }
}

/**
 * Resend the access email to a pending teacher.
 *
 * Why we use resetPasswordForEmail instead of re-inviting:
 *   - inviteUserByEmail fails with "already registered" once the user exists.
 *   - generateLink({ type: 'invite' }) returns a link but does NOT send the email
 *     (we'd need our own SMTP to deliver it).
 *   - resetPasswordForEmail produces a fresh single-use link that drops the user
 *     onto /auth/callback?type=recovery → /change-password?recovery=1, which
 *     allows them to set their password just like the original invite would.
 *
 * Note: the email subject will say "Reset Password" (not "Invite"). When we
 * migrate to Zoho + nodemailer, this can be replaced with a custom-templated
 * "Reenviamos tu invitación" email.
 */
export async function resendTeacherInvite(userId: string): Promise<{ success?: boolean; error?: string; email?: string }> {
  await verifyAdmin()

  const adminClient = createAdminClient()

  const { data: authUser, error: getUserError } = await adminClient.auth.admin.getUserById(userId)
  if (getUserError || !authUser?.user?.email) {
    return { error: 'No se pudo obtener el correo del profesor.' }
  }

  const email = authUser.user.email
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  const { error: emailError } = await adminClient.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/callback?type=recovery`,
  })

  if (emailError) {
    return { error: emailError.message }
  }

  return { success: true, email }
}

/**
 * Update a user's role and notify them by email.
 *
 * Notification email: we trigger a Supabase magic-link email (not strictly a magic link —
 * we use it as a transactional carrier) only when the role grants new access (premium, teacher, admin).
 * For now this is a soft notification using Supabase's built-in flow. When we wire Zoho
 * SMTP + nodemailer in a follow-up, this is the single function to update with a custom template.
 */
export async function setUserRole(
  userId: string,
  newRole: AssignableRole,
): Promise<{ success?: boolean; error?: string }> {
  await verifyAdmin()

  if (!ASSIGNABLE_ROLES.includes(newRole)) {
    return { error: `Rol inválido: ${newRole}` }
  }

  const adminClient = createAdminClient()

  const { data: existing, error: fetchError } = await adminClient
    .from('profiles')
    .select('id, role, first_name')
    .eq('id', userId)
    .single()

  if (fetchError || !existing) {
    return { error: 'Usuario no encontrado.' }
  }

  if (existing.role === newRole) {
    return { error: 'El usuario ya tiene ese rol.' }
  }

  const { error } = await adminClient
    .from('profiles')
    .update({ role: newRole })
    .eq('id', userId)

  if (error) return { error: error.message }

  // Role-change notification email — placeholder.
  //
  // Supabase Auth only sends templated emails for auth events (signup confirm,
  // recovery, magic, invite, change email). There is no clean Supabase-native way
  // to send a "tu rol cambió a X" message without abusing the recovery template,
  // which would confuse users with an unexpected password-reset link.
  //
  // TODO(zoho-migration): when Zoho SMTP + nodemailer are wired up, send a
  // purpose-built role-change email here. The function should live at
  // src/lib/email/sendRoleChangeEmail.ts and use the SENDER_FROM constant from
  // src/lib/email/config.ts so the from-address swaps automatically.
  try {
    const { data: authUser } = await adminClient.auth.admin.getUserById(userId)
    const userEmail = authUser?.user?.email
    if (userEmail) {
      console.log(
        `[setUserRole] role changed for ${userEmail}: ${existing.role} → ${newRole}. ` +
        `Notification email pending implementation (Zoho/nodemailer migration).`,
      )
    }
  } catch (e) {
    console.error('[setUserRole] notification log failed:', e)
  }

  revalidatePath('/admin')
  revalidatePath('/admin/users')
  revalidatePath('/admin/teachers')
  return { success: true }
}
