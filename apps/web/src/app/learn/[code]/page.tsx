import Link from 'next/link'
import Sidebar from '@/components/layout/Sidebar'
import TopNavigation from '@/components/layout/TopNavigation'
import MobileHeader from '@/components/layout/MobileHeader'
import MobileBottomNav from '@/components/layout/MobileBottomNav'
import { createClient } from '@/utils/supabase/server'
import { ArrowLeft, BookOpen, Clock, Play } from 'lucide-react'
import { notFound } from 'next/navigation'

export default async function LevelLessonsPage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const { code } = await params
  const supabase = await createClient()

  const { data: level } = await supabase
    .from('levels')
    .select('id, code, title, description, published')
    .eq('code', code.toUpperCase())
    .single()

  if (!level || !level.published) notFound()

  const { data: lessons } = await supabase
    .from('lessons')
    .select('id, title, description, skill_type, duration_minutes, "order"')
    .eq('level_id', level.id)
    .eq('published', true)
    .order('order', { ascending: true })

  const realLessons = lessons || []

  return (
    <div className="flex w-full h-[100dvh] bg-background overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto px-4 md:px-6 lg:px-10 pb-20 md:pb-6 border-x border-border/50 custom-scrollbar relative">
        <MobileHeader />
        <TopNavigation />

        <div className="max-w-5xl mx-auto py-8">
          <Link
            href="/learn"
            className="inline-flex items-center gap-2 text-sm font-semibold text-foreground/60 hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a niveles
          </Link>

          <div className="mb-10">
            <span className="text-4xl font-black text-primary block mb-2">{level.code}</span>
            <h1 className="text-3xl font-bold text-foreground mb-3 tracking-tight">{level.title}</h1>
            <p className="text-foreground/60 max-w-2xl">{level.description}</p>
          </div>

          <h2 className="text-xl font-bold mb-4 border-b border-border/50 pb-2">
            Lecciones ({realLessons.length})
          </h2>

          {realLessons.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-border/50 rounded-xl bg-muted/10">
              <BookOpen className="w-12 h-12 text-foreground/30 mx-auto mb-3" />
              <p className="font-medium text-foreground/70">Aún no hay lecciones publicadas</p>
              <p className="text-sm text-foreground/50 mt-1">Vuelve pronto — se está construyendo este nivel.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {realLessons.map((lesson, idx) => (
                <Link
                  key={lesson.id}
                  href={`/learn/${code.toLowerCase()}/${lesson.id}`}
                  className="flex items-center justify-between p-4 bg-card border border-border/60 hover:border-primary/50 transition-colors rounded-xl group"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-bold text-foreground/60 group-hover:bg-primary/20 group-hover:text-primary transition-colors shrink-0">
                      {lesson.order || idx + 1}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-foreground truncate">{lesson.title}</h3>
                      <div className="flex items-center gap-2 text-xs text-foreground/50 mt-1">
                        {lesson.skill_type && (
                          <>
                            <span className="uppercase text-[10px] tracking-wider px-2 py-0.5 rounded-sm bg-primary/10 text-primary font-bold">
                              {lesson.skill_type}
                            </span>
                            <span>•</span>
                          </>
                        )}
                        {lesson.duration_minutes && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {lesson.duration_minutes} min
                          </span>
                        )}
                        {lesson.description && <span className="truncate">{lesson.description}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-primary font-semibold text-sm shrink-0 pl-3">
                    <Play className="w-4 h-4 fill-primary" />
                    <span className="hidden sm:inline">Empezar</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <MobileBottomNav />
    </div>
  )
}
