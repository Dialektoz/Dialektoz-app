'use server'

import { createClient as createVerifierClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/utils/supabase/admin'
import { getCurrentProfile, getCurrentUser } from '@/utils/supabase/session'
import { deletePrefix } from '@/lib/r2'

export interface DeleteAccountInput {
  /** The person ticked "I understand this is permanent" (enforced here, not just in the UI). */
  acknowledged: boolean
  confirmText: string
  /** Required for accounts that have a password. */
  password?: string
}

const RECENT_SIGN_IN_MS = 10 * 60 * 1000

/**
 * Permanently delete the signed-in user's account.
 *
 * The id always comes from the validated session, never from the client. The
 * database does the cleanup (profile, progress, activity and exam attempts
 * cascade; certificates are kept as "Titular eliminado" by a trigger; see
 * migration 20261115000000). Only R2 avatar uploads are removed here.
 */
export async function deleteMyAccount(input: DeleteAccountInput): Promise<{ ok?: true; error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: 'Tu sesión expiró. Vuelve a iniciar sesión.' }

  if (input.acknowledged !== true) {
    return { error: 'Debes aceptar que la eliminación es permanente para continuar.' }
  }
  if (input.confirmText !== 'ELIMINAR') {
    return { error: 'Escribe ELIMINAR (en mayúsculas) para confirmar.' }
  }

  const profile = await getCurrentProfile()
  if (profile?.role === 'superadmin') {
    return { error: 'Las cuentas de superadmin no se pueden eliminar desde aquí.' }
  }

  // Re-authenticate. Password accounts prove it with the password (checked with a throwaway
  // client that keeps no session); Google/Facebook/Apple accounts must have signed in recently.
  const hasPassword = (user.identities ?? []).some((i) => i.provider === 'email')
  if (hasPassword) {
    if (!input.password || !user.email) return { error: 'Escribe tu contraseña para confirmar.' }
    const verifier = createVerifierClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    )
    const { error } = await verifier.auth.signInWithPassword({ email: user.email, password: input.password })
    if (error) return { error: 'La contraseña no es correcta.' }
  } else {
    const lastSignIn = user.last_sign_in_at ? Date.parse(user.last_sign_in_at) : 0
    if (Date.now() - lastSignIn > RECENT_SIGN_IN_MS) {
      return { error: 'Por seguridad, cierra sesión y vuelve a entrar antes de eliminar tu cuenta.' }
    }
  }

  const { error: deleteError } = await createAdminClient().auth.admin.deleteUser(user.id)
  if (deleteError) {
    console.error('[deleteMyAccount] deleteUser failed', { uid: user.id, message: deleteError.message })
    return { error: 'No pudimos eliminar tu cuenta. Inténtalo de nuevo o escríbenos a info@dialektoz.com.' }
  }

  // Best effort: the account is already gone, so a storage hiccup must not look like a failure.
  try {
    await deletePrefix(`avatars/${user.id}/`)
  } catch (e) {
    console.error('[deleteMyAccount] avatar cleanup failed', { uid: user.id, message: (e as Error).message })
  }

  console.log(`[deleteMyAccount] deleted uid=${user.id} at=${new Date().toISOString()}`)
  return { ok: true }
}
