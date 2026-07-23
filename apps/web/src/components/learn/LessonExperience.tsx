'use client';

import { LessonAttemptProvider } from './LessonAttempt';
import { BlockList } from '@/components/editor/blocks/BlockList';
import LessonFooter from './LessonFooter';

interface LessonExperienceProps {
  blocks: unknown;
  lessonId: string;
  levelCode: string;
  initialStatus: 'not_started' | 'in_progress' | 'completed';
  prevLessonId: string | null;
  nextLessonId: string | null;
}

/**
 * Client wrapper that shares one attempt context between the rendered blocks
 * (which report per-activity results) and the footer (which shows and saves
 * the aggregated score).
 */
export default function LessonExperience({ blocks, ...footer }: LessonExperienceProps) {
  return (
    <LessonAttemptProvider>
      <div className="max-w-3xl mx-auto">
        <BlockList blocks={blocks} />
      </div>
      <LessonFooter {...footer} />
    </LessonAttemptProvider>
  );
}
