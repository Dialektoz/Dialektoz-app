import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { isR2Configured, buildKey, presignPut, publicUrl } from '@/lib/r2';

const MAX_BYTES = 200 * 1024 * 1024; // 200 MB per file

export async function POST(req: Request) {
  if (!isR2Configured()) {
    return NextResponse.json({ error: 'Almacenamiento (R2) no configurado en el servidor.' }, { status: 501 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  let body: { filename?: string; size?: number; folder?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Petición inválida' }, { status: 400 });
  }

  const { filename, size, folder } = body;
  if (!filename) return NextResponse.json({ error: 'Falta el nombre del archivo' }, { status: 400 });
  if (typeof size === 'number' && size > MAX_BYTES) {
    return NextResponse.json({ error: 'El archivo supera el límite de 200 MB' }, { status: 413 });
  }

  // Anyone signed in may upload their own avatar; content media is staff-only.
  const isAvatar = folder === 'avatars';
  let keyFolder: string;
  if (isAvatar) {
    keyFolder = `avatars/${user.id}`;
  } else {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (!profile || !['superadmin', 'teacher'].includes(profile.role)) {
      return NextResponse.json({ error: 'Sin permiso para subir archivos' }, { status: 403 });
    }
    // Only these content folders are allowed for staff uploads.
    keyFolder = folder === 'levels' ? 'levels' : 'lessons';
  }

  const key = buildKey(filename, keyFolder);
  const uploadUrl = await presignPut(key);

  return NextResponse.json({ uploadUrl, publicUrl: publicUrl(key), key });
}
