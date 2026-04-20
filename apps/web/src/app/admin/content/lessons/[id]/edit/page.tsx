'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LessonBuilder, BlockData } from '@/components/editor/LessonBuilder';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

export default function LessonEditorPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const lessonIdParam = params.id as string;
  const isNew = lessonIdParam === 'new';

  const levelId = searchParams.get('level_id');
  const levelCode = searchParams.get('level_code');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [skillType, setSkillType] = useState('');
  const [description, setDescription] = useState('');
  const [published, setPublished] = useState(false);

  const [blocks, setBlocks] = useState<BlockData[]>([
    { id: 'initial-1', type: 'heading', content: '' },
  ]);

  useEffect(() => {
    async function loadData() {
      if (isNew) {
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('lessons')
        .select('title, content, skill_type, description, published')
        .eq('id', lessonIdParam)
        .single();

      if (error) {
        console.error('Error fetching lesson:', error);
      } else if (data) {
        setTitle(data.title || '');
        setSkillType(data.skill_type || '');
        setDescription(data.description || '');
        setPublished(!!data.published);
        if (data.content && Array.isArray(data.content) && data.content.length > 0) {
          setBlocks(data.content as BlockData[]);
        }
      }
      setIsLoading(false);
    }
    loadData();
  }, [lessonIdParam, isNew, supabase]);

  const handleSave = async () => {
    setIsSaving(true);

    let finalTitle = title;
    if (!finalTitle && blocks[0]?.type === 'heading' && blocks[0]?.content) {
      finalTitle = blocks[0].content;
      setTitle(finalTitle);
    }
    if (!finalTitle) finalTitle = 'Lección sin título';

    const payload = {
      title: finalTitle,
      content: blocks,
      skill_type: skillType || null,
      description: description || null,
      published,
    };

    if (isNew) {
      if (!levelId) {
        alert('Falta el level_id para saber dónde guardar esta lección.');
        setIsSaving(false);
        return;
      }
      const { data, error } = await supabase
        .from('lessons')
        .insert({ ...payload, level_id: levelId, order: 1 })
        .select()
        .single();

      if (error) {
        console.error(error);
        alert('Error al crear la lección');
      } else {
        router.replace(`/admin/content/lessons/${data.id}/edit`);
      }
    } else {
      const { error } = await supabase.from('lessons').update(payload).eq('id', lessonIdParam);

      if (error) {
        console.error(error);
        alert('Error al guardar la lección');
      } else {
        alert('Lección guardada exitosamente');
      }
    }
    setIsSaving(false);
  };

  return (
    <div className="py-6 px-6 lg:px-10 max-w-5xl mx-auto w-full">
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <Button
                variant="ghost"
                className="mb-2 -ml-3 text-muted-foreground hover:text-foreground"
                onClick={() => router.back()}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {levelCode ? `Atrás al Nivel ${levelCode}` : 'Atrás'}
              </Button>
              <h1 className="text-3xl font-bold tracking-tight">
                {isNew ? 'Nueva Lección Interactiva' : 'Editando Lección'}
              </h1>
            </div>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="gap-2 shrink-0 border-primary text-primary-foreground min-w-[200px]"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isSaving ? 'Guardando...' : isNew ? 'Crear Lección' : 'Guardar Progreso'}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                Título de la Lección
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-lg font-semibold bg-background border border-border p-3 rounded-xl outline-none text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary"
                placeholder="Ej: Verbo To Be básico"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                Skill / Habilidad
              </label>
              <input
                type="text"
                value={skillType}
                onChange={(e) => setSkillType(e.target.value)}
                className="w-full text-base bg-background border border-border p-3 rounded-xl outline-none text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary"
                placeholder="Ej: Listening, Grammar, Vocabulary..."
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">
              Descripción corta
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-sm bg-background border border-border p-3 rounded-xl outline-none text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none"
              placeholder="Resumen breve para la lista de lecciones (opcional)"
            />
          </div>

          <div className="mb-8 flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
                className="w-4 h-4 accent-primary cursor-pointer"
              />
              <span className="text-sm font-semibold text-foreground">
                Publicar lección (visible en /learn para estudiantes)
              </span>
            </label>
          </div>

          <div className="border-t border-border/50 mb-8 pt-6">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Contenido de la Lección (Bloques)
            </h2>
          </div>

          <div className="min-h-[500px]">
            <LessonBuilder initialBlocks={blocks} onChange={(newBlocks) => setBlocks(newBlocks)} />
          </div>
        </>
      )}
    </div>
  );
}
