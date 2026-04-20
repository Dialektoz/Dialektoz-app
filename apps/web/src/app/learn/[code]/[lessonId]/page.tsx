import Link from 'next/link'
import Sidebar from '@/components/layout/Sidebar'
import TopNavigation from '@/components/layout/TopNavigation'
import MobileHeader from '@/components/layout/MobileHeader'
import MobileBottomNav from '@/components/layout/MobileBottomNav'
import { createClient } from '@/utils/supabase/server'
import { ArrowLeft, Clock } from 'lucide-react'
import { notFound } from 'next/navigation'
import LessonRenderer from '@/components/learn/LessonRenderer'
import type { BlockData } from '@/components/editor/LessonBuilder'

export default async function LessonViewPage({
  params,
}: {
  params: Promise<{ code: string; lessonId: string }>
}) {
  const { code, lessonId } = await params
  const supabase = await createClient()

  const { data: lesson } = await supabase
    .from('lessons')
    .select('id, title, description, skill_type, duration_minutes, content, published, level_id')
    .eq('id', lessonId)
    .single()

  if (!lesson || !lesson.published) notFound()

  const blocks: BlockData[] = Array.isArray(lesson.content) ? lesson.content : []

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

          {blocks.length === 0 ? (
            <div className="text-center py-16 text-foreground/50">
              Esta lección aún no tiene contenido.
            </div>
          ) : (
            <LessonRenderer blocks={blocks} />
          )}
        </div>
      </main>
      <MobileBottomNav />
    </div>
  )
}
