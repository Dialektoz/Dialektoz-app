import { redirect, notFound } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import TopNavigation from '@/components/layout/TopNavigation';
import MobileHeader from '@/components/layout/MobileHeader';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import { createClient } from '@/utils/supabase/server';
import { getCertificationLevels } from '@/lib/certification';
import ExamRunner from '@/components/certification/ExamRunner';

export const metadata = {
  title: 'Examen de certificación | Dialektoz',
};

export default async function ExamPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const levels = await getCertificationLevels(supabase, user.id);
  const level = levels.find((l) => l.code.toLowerCase() === code.toLowerCase());
  if (!level) notFound();

  // Guard the same rules the API enforces, so the student never lands on a
  // dead end: already certified, not eligible yet, or out of attempts.
  if (level.certificate) redirect(`/certificate/${level.certificate.serial}`);
  if (!level.eligible || !level.available || level.attemptsLeft === 0) redirect('/certification');

  return (
    <div className="flex w-full h-[100dvh] bg-background overflow-hidden selection:bg-primary/30">
      <Sidebar />
      <main className="flex-1 overflow-y-auto px-4 md:px-6 lg:px-10 pb-20 md:pb-6 border-x border-border/50 custom-scrollbar relative">
        <MobileHeader />
        <TopNavigation />

        <div className="py-6">
          <ExamRunner
            levelCode={level.code}
            levelTitle={level.title}
            questionCount={level.questionCount}
            passingScore={level.passingScore}
            timeLimitMinutes={level.timeLimitMinutes}
            attemptsLeft={level.attemptsLeft}
          />
        </div>
      </main>
      <MobileBottomNav />
    </div>
  );
}
