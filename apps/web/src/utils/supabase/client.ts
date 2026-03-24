import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    if (typeof window !== 'undefined') {
      console.error('Supabase credentials are missing!')
    }
    // Return a dummy client or just let it fail gracefully if called
  }

  return createBrowserClient(
    url || '',
    key || ''
  )
}
