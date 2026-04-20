'use server'

import crypto from 'crypto'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'

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

function generatePassword(): string {
  // 16 chars: mix of upper, lower, digits, symbols — no ambiguous chars (0/O, 1/l/I)
  const upper = 'ABCDEFGHJKMNPQRSTUVWXYZ'
  const lower = 'abcdefghjkmnpqrstuvwxyz'
  const digits = '23456789'
  const symbols = '!@#$%&*'
  const all = upper + lower + digits + symbols

  const bytes = crypto.randomBytes(16)
  let password = ''

  // Guarantee at least one of each required type
  password += upper[bytes[0] % upper.length]
  password += lower[bytes[1] % lower.length]
  password += digits[bytes[2] % digits.length]
  password += symbols[bytes[3] % symbols.length]

  for (let i = 4; i < 16; i++) {
    password += all[bytes[i] % all.length]
  }

  // Shuffle so the guaranteed chars aren't always at the start
  return password
    .split('')
    .sort(() => crypto.randomInt(3) - 1)
    .join('')
}

export async function createTeacher(formData: FormData): Promise<{ password?: string; error?: string }> {
  await verifyAdmin()

  const firstName = (formData.get('first_name') as string).trim()
  const lastName = (formData.get('last_name') as string).trim()
  const email = (formData.get('email') as string).trim().toLowerCase()

  if (!firstName || !email) return { error: 'Nombre y email son obligatorios.' }

  const password = generatePassword()
  const adminClient = createAdminClient()

  // Create auth user — email already confirmed, no verification email sent
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { first_name: firstName, last_name: lastName },
  })

  if (authError) {
    if (authError.message.includes('already registered')) {
      return { error: 'Ya existe un usuario con ese correo.' }
    }
    return { error: authError.message }
  }

  // Upsert profile — the DB trigger may have already created a row on user creation
  const { error: profileError } = await adminClient.from('profiles').upsert({
    id: authData.user.id,
    first_name: firstName,
    last_name: lastName,
    role: 'teacher',
    onboarding_completed: false,
  })

  if (profileError) {
    // Rollback: delete the auth user we just created
    await adminClient.auth.admin.deleteUser(authData.user.id)
    return { error: profileError.message }
  }

  revalidatePath('/admin')
  return { password }
}

export async function setUserRole(userId: string, newRole: 'teacher' | 'free') {
  await verifyAdmin()

  const adminClient = createAdminClient()
  const { error } = await adminClient
    .from('profiles')
    .update({ role: newRole })
    .eq('id', userId)

  if (error) throw new Error(error.message)

  revalidatePath('/admin')
}
