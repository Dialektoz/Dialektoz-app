import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, PlusCircle, BookOpen, Settings, FileText } from 'lucide-react';
import { createClient } from '@/utils/supabase/server';
import { DeleteLevelButton } from '@/components/dashboard/DeleteLevelButton';
import PublishLevelToggle from './PublishLevelToggle';

export default async function LevelAdminDashboard({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const levelCode = resolvedParams.id;

  const supabase = await createClient();

  const { data: levelData, error: levelError } = await supabase
    .from('levels')
    .select('id, title, code, published')
    .eq('code', levelCode)
    .single();

  if (!levelData || levelError) {
    return (
      <div className="flex items-center justify-center py-24 text-foreground flex-col gap-4">
        <h2>No se encontró el Nivel {levelCode} en la base de datos.</h2>
        <Link href="/admin">
          <Button>Volver al panel</Button>
        </Link>
      </div>
    );
  }

  const { data: lessons } = await supabase
    .from('lessons')
    .select('id, title, "order", content, skill_type, published')
    .eq('level_id', levelData.id)
    .order('order', { ascending: true });

  const realLessons = lessons || [];

  return (
    <div className="py-6 px-6 lg:px-10 max-w-5xl mx-auto w-full">
      <div className="flex flex-col gap-6 mb-10">
        <div className="flex items-center justify-between">
          <Link href="/admin/content">
            <Button variant="ghost" className="-ml-3 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a contenido
            </Button>
          </Link>

          <div className="flex items-center gap-2">
            <PublishLevelToggle levelId={levelData.id} initialPublished={!!levelData.published} />
            <DeleteLevelButton levelId={levelData.id} levelTitle={levelData.title} />
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-bold tracking-tight uppercase text-primary">
                Nivel {levelData.code} - {levelData.title}
              </h1>
            </div>
            <p className="text-muted-foreground mt-2 max-w-2xl">
              Administra el material educativo, agrega lecciones interactivas y define las skills (listening, reading, etc.).
            </p>
          </div>

          <Link
            href={`/admin/content/lessons/new/edit?level_id=${levelData.id}&level_code=${levelData.code}`}
          >
            <Button size="lg" className="gap-2 shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
              <PlusCircle className="w-5 h-5" />
              Añadir Lección
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-card border border-border p-4 rounded-xl flex flex-col">
          <span className="text-muted-foreground text-sm font-medium">Total Lecciones</span>
          <span className="text-2xl font-bold">{realLessons.length}</span>
        </div>
        <div className="bg-card border border-border p-4 rounded-xl flex flex-col">
          <span className="text-muted-foreground text-sm font-medium">Publicadas</span>
          <span className="text-2xl font-bold text-green-500">
            {realLessons.filter((l) => l.published).length}
          </span>
        </div>
      </div>

      <h3 className="text-xl font-bold mb-4 border-b border-border/50 pb-2">
        Material Existente ({realLessons.length})
      </h3>
      <div className="flex flex-col gap-3">
        {realLessons.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-border/50 rounded-xl bg-muted/10">
            <BookOpen className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-foreground">El nivel está vacío</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1 mb-4">
              Empieza a construir el temario creando tu primera lección interactiva.
            </p>
          </div>
        ) : (
          realLessons.map((lesson, idx) => {
            const blockCount = Array.isArray(lesson.content) ? lesson.content.length : 0;
            return (
              <div
                key={lesson.id}
                className="flex items-center justify-between p-4 bg-card border border-border/60 hover:border-primary/50 transition-colors rounded-xl cursor-default group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-bold text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                    {lesson.order || idx + 1}
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground flex items-center gap-2">
                      {lesson.title}
                      {lesson.published ? (
                        <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-sm bg-green-500/15 text-green-600 font-bold">
                          Publicada
                        </span>
                      ) : (
                        <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-sm bg-muted text-muted-foreground font-bold">
                          Borrador
                        </span>
                      )}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      {lesson.skill_type && (
                        <>
                          <span className="uppercase text-[10px] tracking-wider px-2 py-0.5 rounded-sm bg-primary/10 text-primary">
                            {lesson.skill_type}
                          </span>
                          <span>•</span>
                        </>
                      )}
                      <span className="uppercase text-[10px] tracking-wider px-2 py-0.5 rounded-sm bg-muted flex items-center gap-1">
                        <FileText className="w-3 h-3" /> Lección
                      </span>
                      <span>•</span>
                      <span>{blockCount} bloques</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                    <Settings className="w-4 h-4" />
                  </Button>
                  <Link href={`/admin/content/lessons/${lesson.id}/edit`}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-primary/50 text-primary hover:bg-primary/10"
                    >
                      Editar Lección
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
