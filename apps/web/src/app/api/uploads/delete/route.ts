import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { isR2Configured, keyFromPublicUrl, deleteObject } from '@/lib/r2';

/**
 * Deletes an R2 object by its public URL, so removing/replacing an image
 * doesn't leave orphaned files.
 *
 * Permissions:
 *   - avatars/<uid>/…  → only the owner (uid must match the caller)
 *   - lessons/… , levels/… → staff (admin/teacher/superadmin)
 */
export async function POST(req: Request) {
  if (!isR2Configured()) {
    return NextResponse.json({ error: 'R2 no configurado' }, { status: 501 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  let body: { url?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Petición inválida' }, { status: 400 });
  }

  const key = body.url ? keyFromPublicUrl(body.url) : null;
  if (!key) {
    // Not an R2 URL of ours (e.g. an external image) — nothing to delete.
    return NextResponse.json({ ok: true, skipped: true });
  }

  if (key.startsWith('avatars/')) {
    if (key.split('/')[1] !== user.id) {
      return NextResponse.json({ error: 'Sin permiso' }, { status: 403 });
    }
  } else {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (!profile || !['superadmin', 'teacher'].includes(profile.role)) {
      return NextResponse.json({ error: 'Sin permiso' }, { status: 403 });
    }
  }

  const ok = await deleteObject(key);
  return NextResponse.json({ ok });
}
