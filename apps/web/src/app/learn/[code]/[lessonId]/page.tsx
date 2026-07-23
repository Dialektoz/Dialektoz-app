import Link from 'next/link'
import Sidebar from '@/components/layout/Sidebar'
import TopNavigation from '@/components/layout/TopNavigation'
import MobileHeader from '@/components/layout/MobileHeader'
import MobileBottomNav from '@/components/layout/MobileBottomNav'
import { createClient } from '@/utils/supabase/server'
import { ArrowLeft, Clock } from 'lucide-react'
import { notFound } from 'next/navigation'
import LessonExperience from '@/components/learn/LessonExperience'

export default async function LessonViewPage({
  params,
}: {
  params: Promise<{ code: string; lessonId: string }>
}) {
  const { code, lessonId } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: lesson } = await supabase
    .from('lessons')
    .select('id, title, description, skill_type, duration_minutes, content, published, level_id')
    .eq('id', lessonId)
    .single()

  if (!lesson || !lesson.published) notFound()

  // Sibling lessons (for prev/next navigation).
  const { data: siblings } = await supabase
    .from('lessons')
    .select('id')
    .eq('level_id', lesson.level_id)
    .eq('published', true)
    .order('order', { ascending: true })

  const ids = (siblings ?? []).map((s) => s.id)
  const idx = ids.indexOf(lesson.id)
  const prevLessonId = idx > 0 ? ids[idx - 1] : null
  const nextLessonId = idx >= 0 && idx < ids.length - 1 ? ids[idx + 1] : null

  // Current progress status for this user + lesson.
  let initialStatus: 'not_started' | 'in_progress' | 'completed' = 'not_started'
  if (user) {
    const { data: prog } = await supabase
      .from('user_progress')
      .select('status')
      .eq('user_id', user.id)
      .eq('lesson_id', lesson.id)
      .maybeSingle()
    if (prog?.status) initialStatus = prog.status
  }

  const hasContent = Array.isArray(lesson.content) && lesson.content.length > 0

  return (
    <div className="flex w-full h-[100dvh] bg-background overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto px-4 md:px-6 lg:px-10 pb-20 md:pb-6 border-x border-border/50 custom-scrollbar relative">
        <MobileHeader />
        <TopNavigation />

        <div className="max-w-4xl mx-auto py-8">
          <Link
            href={`/learn/${code.toLowerCase()}`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-foreground/60 hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a lecciones
          </Link>

          <div className="mb-8 pb-6 border-b border-border/50">
            <div className="flex flex-wrap items-center gap-2 mb-3 text-xs">
              <span className="uppercase tracking-wider px-2 py-0.5 rounded-sm bg-primary/10 text-primary font-bold">
                {code.toUpperCase()}
              </span>
              {lesson.skill_type && (
                <>
                  <span className="text-foreground/40">•</span>
                  <span className="uppercase tracking-wider font-bold text-foreground/60">
                    {lesson.skill_type}
                  </span>
                </>
              )}
              {lesson.duration_minutes && (
                <>
                  <span className="text-foreground/40">•</span>
                  <span className="flex items-center gap-1 text-foreground/60">
                    <Clock className="w-3 h-3" />
                    {lesson.duration_minutes} min
                  </span>
                </>
              )}
            </div>
            <h1 className="text-4xl font-bold text-foreground tracking-tight">{lesson.title}</h1>
            {lesson.description && (
              <p className="text-foreground/60 mt-3 text-lg">{lesson.description}</p>
            )}
          </div>

          {!hasContent ? (
            <div className="text-center py-16 text-foreground/50">
              Esta lección aún no tiene contenido.
            </div>
          ) : (
            <LessonExperience
              blocks={lesson.content}
              lessonId={lesson.id}
              levelCode={code}
              initialStatus={initialStatus}
              prevLessonId={prevLessonId}
              nextLessonId={nextLessonId}
            />
          )}
        </div>
      </main>
      <MobileBottomNav />
    </div>
  )
}
