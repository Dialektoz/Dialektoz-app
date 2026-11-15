import { cache } from 'react';
import { createClient } from './server';
import { computeStreak } from '@/lib/learning';

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

/**
 * Current daily streak (same computeStreak as the dashboard, /progress and /streak),
 * cached per request. Only the latest ~1000 active days are read: enough for any
 * realistic streak and it keeps the query small.
 */
export const getCurrentStreak = cache(async (): Promise<number> => {
  const user = await getCurrentUser();
  if (!user) return 0;

  const supabase = await createClient();
  const { data } = await supabase
    .from('user_activity')
    .select('activity_date')
    .eq('user_id', user.id)
    .order('activity_date', { ascending: false })
    .limit(1000);

  return computeStreak((data ?? []).map((r) => r.activity_date));
});
