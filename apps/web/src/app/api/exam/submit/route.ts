import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { flattenBlocks, gradeExam } from '@/lib/exam/grading';
import type { AnswerValue, RawBlock } from '@/lib/exam/grading';

/** Grades an attempt server-side and issues the certificate when passed. */
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  let body: { attemptId?: string; answers?: Record<string, AnswerValue> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Petición inválida' }, { status: 400 });
  }
  const { attemptId, answers = {} } = body;
  if (!attemptId) return NextResponse.json({ error: 'Falta el intento' }, { status: 400 });

  const admin = createAdminClient();

  const { data: attempt } = await admin
    .from('exam_attempts')
    .select('id, user_id, exam_id, questions, submitted_at')
    .eq('id', attemptId)
    .single();

  if (!attempt || attempt.user_id !== user.id) {
    return NextResponse.json({ error: 'Intento no encontrado' }, { status: 404 });
  }
  if (attempt.submitted_at) {
    return NextResponse.json({ error: 'Este intento ya fue enviado' }, { status: 409 });
  }

  const { data: exam } = await admin
    .from('exams')
    .select('id, level_id, passing_score')
    .eq('id', attempt.exam_id)
    .single();
  if (!exam) return NextResponse.json({ error: 'Examen no encontrado' }, { status: 404 });

  // Re-read the original blocks (with answers) from the database.
  const refs = (attempt.questions ?? []) as { lesson_id: string; block_id: string }[];
  const lessonIds = [...new Set(refs.map((r) => r.lesson_id))];
  const { data: lessons } = await admin.from('lessons').select('id, content, quiz').in('id', lessonIds);

  // Questions come from the evaluation, but content is indexed too so older
  // attempts (created before the content/quiz split) still grade correctly.
  const blockIndex = new Map<string, RawBlock>();
  for (const lesson of lessons ?? []) {
    for (const block of [...flattenBlocks(lesson.quiz), ...flattenBlocks(lesson.content)]) {
      if (!blockIndex.has(`${lesson.id}:${block.id}`)) blockIndex.set(`${lesson.id}:${block.id}`, block);
    }
  }

  const blocks = refs
    .map((r) => blockIndex.get(`${r.lesson_id}:${r.block_id}`))
    .filter((b): b is RawBlock => Boolean(b));

  const result = gradeExam(blocks, answers);
  const passed = result.score >= exam.passing_score;

  await admin
    .from('exam_attempts')
    .update({ score: result.score, passed, submitted_at: new Date().toISOString() })
    .eq('id', attempt.id);

  let serial: string | null = null;

  if (passed) {
    const { data: existing } = await admin
      .from('certificates')
      .select('serial')
      .eq('user_id', user.id)
      .eq('level_id', exam.level_id)
      .maybeSingle();

    if (existing) {
      serial = existing.serial;
    } else {
      const [{ data: level }, { data: profile }, { data: hoursRow }] = await Promise.all([
        admin.from('levels').select('code, title, description').eq('id', exam.level_id).single(),
        admin.from('profiles').select('display_name, full_name, first_name, last_name, email').eq('id', user.id).single(),
        admin.rpc('level_hours', { p_level_id: exam.level_id }),
      ]);

      const holder =
        profile?.display_name?.trim() ||
        profile?.full_name?.trim() ||
        [profile?.first_name, profile?.last_name].filter(Boolean).join(' ').trim() ||
        profile?.email?.split('@')[0] ||
        'Estudiante';

      serial = `DZ-${level?.code ?? 'XX'}-${crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()}`;

      const { error: certError } = await admin.from('certificates').insert({
        user_id: user.id,
        level_id: exam.level_id,
        serial,
        score: result.score,
        hours: Number(hoursRow ?? 0),
        level_code: level?.code ?? '',
        level_title: level?.title ?? '',
        description: level?.description ?? null,
        holder_name: holder,
      });
      if (certError) serial = null;
    }
  }

  return NextResponse.json({
    score: result.score,
    correct: result.correct,
    total: result.total,
    passed,
    passingScore: exam.passing_score,
    serial,
  });
}
