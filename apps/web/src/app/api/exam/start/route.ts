import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { flattenBlocks, isSupportedQuestion, toPublicQuestion, pickRandom } from '@/lib/exam/grading';

/**
 * Starts a certification attempt.
 *
 * Questions are drawn from the gradable activities of the level's published
 * lessons and returned WITHOUT their answers. The attempt row stores only
 * references (lesson_id + block_id) so a student reading their own attempt
 * can never see the solutions.
 */
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  let body: { levelCode?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Petición inválida' }, { status: 400 });
  }
  const levelCode = (body.levelCode ?? '').toUpperCase().trim();
  if (!levelCode) return NextResponse.json({ error: 'Falta el nivel' }, { status: 400 });

  const admin = createAdminClient();

  const { data: level } = await admin
    .from('levels')
    .select('id, code, title, published')
    .eq('code', levelCode)
    .single();
  if (!level || !level.published) {
    return NextResponse.json({ error: 'Nivel no disponible' }, { status: 404 });
  }

  const { data: exam } = await admin
    .from('exams')
    .select('id, question_count, passing_score, time_limit_minutes, max_attempts, published')
    .eq('level_id', level.id)
    .single();
  if (!exam || !exam.published) {
    return NextResponse.json({ error: 'Este nivel aún no tiene examen' }, { status: 404 });
  }

  // Already certified?
  const { data: cert } = await admin
    .from('certificates')
    .select('serial')
    .eq('user_id', user.id)
    .eq('level_id', level.id)
    .maybeSingle();
  if (cert) {
    return NextResponse.json({ error: 'Ya tienes el certificado de este nivel', serial: cert.serial }, { status: 409 });
  }

  // Eligibility: the whole level must be completed.
  const { data: lessons } = await admin
    .from('lessons')
    .select('id, quiz')
    .eq('level_id', level.id)
    .eq('published', true);
  const lessonList = lessons ?? [];
  if (lessonList.length === 0) {
    return NextResponse.json({ error: 'Este nivel no tiene lecciones' }, { status: 400 });
  }

  const { data: done } = await admin
    .from('user_progress')
    .select('lesson_id')
    .eq('user_id', user.id)
    .eq('status', 'completed')
    .in('lesson_id', lessonList.map((l) => l.id));
  if ((done?.length ?? 0) < lessonList.length) {
    return NextResponse.json({ error: 'Completa todas las lecciones del nivel antes de presentar el examen' }, { status: 403 });
  }

  // Attempts left
  const { count } = await admin
    .from('exam_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('exam_id', exam.id)
    .not('submitted_at', 'is', null);
  if ((count ?? 0) >= exam.max_attempts) {
    return NextResponse.json({ error: 'Has agotado tus intentos para este examen' }, { status: 403 });
  }

  // The exam is the union of every lesson's evaluation ("quiz") in the level.
  const pool: { lesson_id: string; block_id: string; block: { id: string; type: string; data: Record<string, unknown> } }[] = [];
  for (const lesson of lessonList) {
    for (const block of flattenBlocks(lesson.quiz)) {
      if (isSupportedQuestion(block.type)) {
        pool.push({ lesson_id: lesson.id, block_id: block.id, block });
      }
    }
  }
  if (pool.length === 0) {
    return NextResponse.json({ error: 'Este nivel aún no tiene preguntas de evaluación' }, { status: 400 });
  }

  // question_count acts as a cap; by default the exam uses every question.
  const picked = pickRandom(pool, Math.max(exam.question_count, pool.length));
  const questions = picked.map((p) => toPublicQuestion(p.block)).filter(Boolean);

  const { data: attempt, error } = await admin
    .from('exam_attempts')
    .insert({
      user_id: user.id,
      exam_id: exam.id,
      questions: picked.map((p) => ({ lesson_id: p.lesson_id, block_id: p.block_id })),
    })
    .select('id, started_at')
    .single();

  if (error || !attempt) {
    return NextResponse.json({ error: 'No se pudo iniciar el examen' }, { status: 500 });
  }

  return NextResponse.json({
    attemptId: attempt.id,
    startedAt: attempt.started_at,
    timeLimitMinutes: exam.time_limit_minutes,
    passingScore: exam.passing_score,
    attemptsLeft: exam.max_attempts - (count ?? 0) - 1,
    questions,
  });
}
