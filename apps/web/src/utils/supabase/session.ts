import { cache } from 'react';
import { createClient } from './server';

/**
 * Request-scoped, deduplicated session helpers.
 *
 * React's `cache()` memoizes per server render pass, so multiple components
 * (page + sidebar + layout) that need the user/profile trigger a SINGLE round
 * trip to Supabase instead of one each.
 */
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export interface SessionProfile {
  id: string;
  role: string;
  name: string;
  email: string | null;
  avatarUrl: string | null;
}

export const getCurrentProfile = cache(async (): Promise<SessionProfile | null> => {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from('profiles')
    .select('role, display_name, full_name, first_name, email, avatar_url')
    .eq('id', user.id)
    .single();

  const name =
    data?.display_name?.trim() ||
    data?.full_name?.trim() ||
    data?.first_name?.trim() ||
    (data?.email ?? user.email ?? '').split('@')[0] ||
    'Estudiante';

  return {
    id: user.id,
    role: data?.role ?? 'free',
    name,
    email: data?.email ?? user.email ?? null,
    avatarUrl: data?.avatar_url ?? null,
  };
});
