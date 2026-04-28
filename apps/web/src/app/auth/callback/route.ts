import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

/**
 * Auth callback for invite, recovery, magic link and OAuth flows.
 *
 * Two failure modes we explicitly handle:
 *  1. Supabase verify endpoint sends an error (expired/used OTP) — the error
 *     comes either as a query param (?error=...) or hash fragment (#error=...).
 *     We can only read query params server-side; the hash never reaches us.
 *     So if there's no `code` AND we see an error query, we redirect to /login
 *     with a descriptive flag. If only a hash error is present, we still hit
 *     the no-code branch and redirect to /login?error=link_expired generically.
 *  2. Code exchange itself fails — same destination, generic error flag.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const type = searchParams.get('type')
  const errorParam = searchParams.get('error')
  const errorCode = searchParams.get('error_code')

  // Explicit error from Supabase verify endpoint
  if (errorParam || errorCode) {
    const reason = errorCode === 'otp_expired' ? 'link_expired' : 'auth_error'
    return NextResponse.redirect(`${origin}/login?error=${reason}`)
  }

  if (code) {
    const supabase = await createClient()
    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && session) {
      // Password recovery flow: send the user to /change-password regardless of onboarding state.
      if (type === 'recovery') {
        return NextResponse.redirect(`${origin}/change-password?recovery=1`)
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed, role')
        .eq('id', session.user.id)
        .single()

      if (profile && !profile.onboarding_completed && profile.role === 'teacher') {
        return NextResponse.redirect(`${origin}/change-password`)
      }

      if (profile && !profile.onboarding_completed) {
        return NextResponse.redirect(`${origin}/onboarding`)
      }

      return NextResponse.redirect(`${origin}/dashboard`)
    }

    // Code exchange failed
    return NextResponse.redirect(`${origin}/login?error=auth_error`)
  }

  // No code and no query error → likely a hash error. Tell the user the link expired.
  return NextResponse.redirect(`${origin}/login?error=link_expired`)
}
