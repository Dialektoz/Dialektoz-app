import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getCurrentUser } from '@/utils/supabase/session';

/**
 * "Descargar mis datos": a JSON file with the signed-in user's own data.
 *
 * Runs with the user's session (no service role), so RLS guarantees only their
 * rows come back. Exam attempts are exported without `questions` (block
 * references, not the user's data) and nothing about other users is included.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const supabase = await createClient();

  const [profile, progress, activity, attempts, certificates] = await Promise.all([
    supabase
      .from('profiles')
      .select('first_name, last_name, full_name, display_name, phone, birth_date, timezone, leaderboard_opt_in, avatar_url, email, role, onboarding_completed')
      .eq('id', user.id)
      .single(),
    supabase.from('user_progress').select('lesson_id, status, score, last_accessed_at, created_at').eq('user_id', user.id),
    supabase.from('user_activity').select('activity_date, xp_earned, lessons_completed, minutes').eq('user_id', user.id).order('activity_date', { ascending: true }),
    supabase.from('exam_attempts').select('exam_id, score, passed, started_at, submitted_at').eq('user_id', user.id).order('started_at', { ascending: true }),
    supabase.from('certificates').select('serial, level_code, level_title, score, hours, holder_name, issued_at').eq('user_id', user.id).order('issued_at', { ascending: true }),
  ]);

  if (profile.error) {
    return NextResponse.json({ error: 'No se pudieron leer tus datos.' }, { status: 500 });
  }

  const payload = {
    exportedAt: new Date().toISOString(),
    account: {
      id: user.id,
      email: user.email ?? null,
      createdAt: user.created_at,
      lastSignInAt: user.last_sign_in_at ?? null,
      signInMethods: (user.identities ?? []).map((i) => i.provider),
    },
    profile: profile.data,
    lessonProgress: progress.data ?? [],
    dailyActivity: activity.data ?? [],
    examAttempts: attempts.data ?? [],
    certificates: certificates.data ?? [],
  };

  const day = new Date().toISOString().slice(0, 10);
  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="dialektoz-mis-datos-${day}.json"`,
      'Cache-Control': 'no-store',
    },
  });
}
