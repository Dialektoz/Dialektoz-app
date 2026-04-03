import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  
  if (code) {
    const supabase = await createClient()
    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && session) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', session.user.id)
        .single()
        
      if (profile && !profile.onboarding_completed) {
        return NextResponse.redirect(`${origin}/onboarding`)
      }
      
      return NextResponse.redirect(`${origin}/dashboard`)
    }
  }

  // Si hay error o no hay code, devolver a la página de registro
  return NextResponse.redirect(`${origin}/signup?error=auth-failed`)
}
