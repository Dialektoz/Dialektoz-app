'use client';

import { ClipboardCheck } from 'lucide-react';
import { LessonAttemptProvider } from './LessonAttempt';
import { BlockList } from '@/components/editor/blocks/BlockList';
import LessonFooter from './LessonFooter';

interface LessonExperienceProps {
  blocks: unknown;
  quiz: unknown;
  lessonId: string;
  levelCode: string;
  initialStatus: 'not_started' | 'in_progress' | 'completed';
  prevLessonId: string | null;
  nextLessonId: string | null;
}

/**
 * A lesson has two parts:
 *   1. Contenido  — study material (free practice, not scored)
 *   2. Evaluación — the graded questions that also feed the level exam
 *
 * Only the evaluation lives inside the attempt provider, so the lesson score
 * comes from the evaluation and practice activities never affect it.
 */
export default function LessonExperience({ blocks, quiz, ...footer }: LessonExperienceProps) {
  const hasQuiz = Array.isArray(quiz) && quiz.length > 0;

  return (
    <>
      {/* Part 1 — study material. Deliberately OUTSIDE the attempt provider so
          practice activities render and self-check but never affect the score. */}
      <div className="max-w-3xl mx-auto">
        <BlockList blocks={blocks} />
      </div>

      {/* Part 2 — evaluation. Only this counts. */}
      <LessonAttemptProvider>
        {hasQuiz && (
          <section className="max-w-3xl mx-auto mt-12 pt-8 border-t-2 border-primary/20">
            <div className="flex items-center gap-2 mb-1 text-primary">
              <ClipboardCheck className="w-5 h-5" />
              <span className="text-[11px] font-bold uppercase tracking-widest">Evaluación</span>
            </div>
            <p className="text-sm text-foreground/50 mb-6">
              Responde todas las preguntas para completar la lección.
            </p>
            <BlockList blocks={quiz} />
          </section>
        )}

        <div className="max-w-3xl mx-auto">
          <LessonFooter {...footer} requiresQuiz={hasQuiz} />
        </div>
      </LessonAttemptProvider>
    </>
  );
}
