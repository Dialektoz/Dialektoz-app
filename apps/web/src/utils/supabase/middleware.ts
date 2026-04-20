import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Redirect authenticated users away from public auth pages to dashboard
  if (
    user &&
    (request.nextUrl.pathname === '/' ||
     request.nextUrl.pathname.startsWith('/login') ||
     request.nextUrl.pathname.startsWith('/signup'))
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  if (
    !user &&
    !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/signup') &&
    !request.nextUrl.pathname.startsWith('/auth') &&
    request.nextUrl.pathname !== '/' && // root landing
    request.nextUrl.pathname !== '/signup' // signup page
  ) {
    // no user, potentially respond by redirecting the user to the login page
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Progressive Profiling Check & RBAC
  if (user && !request.nextUrl.pathname.startsWith('/auth') && request.nextUrl.pathname !== '/') {
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_completed, role')
      .eq('id', user.id)
      .single()

    if (profile) {
      // 1. Check if user needs to complete onboarding or change password (first-login teachers)
      if (!profile.onboarding_completed) {
        if (profile.role === 'teacher') {
          if (!request.nextUrl.pathname.startsWith('/change-password')) {
            const url = request.nextUrl.clone()
            url.pathname = '/change-password'
            return NextResponse.redirect(url)
          }
        } else if (!request.nextUrl.pathname.startsWith('/onboarding')) {
          const url = request.nextUrl.clone()
          url.pathname = '/onboarding'
          return NextResponse.redirect(url)
        }
      }

      // 2. Role-Based Access Control (Admin Routes Protection)
      // Admin and teacher both can enter /admin; teacher permissions refined later.
      if (
        request.nextUrl.pathname.startsWith('/admin') &&
        profile.role !== 'admin' &&
        profile.role !== 'teacher'
      ) {
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
      }

      // Forward the user's role to app routes via headers
      request.headers.set('x-user-role', profile.role)
      supabaseResponse.headers.set('x-user-role', profile.role)
    }
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally: return myNewResponse

  return supabaseResponse
}
