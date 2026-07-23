'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LessonBuilder } from '@/components/editor/LessonBuilder';
import type { BlockInstance } from '@/components/editor/blocks/types';
import { normalizeBlocks, createBlock } from '@/components/editor/blocks/registry';
import { ArrowLeft, Save, Loader2, Check, CloudOff } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

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
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [title, setTitle] = useState('');
  const [skillType, setSkillType] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState<number | ''>('');
  const [published, setPublished] = useState(false);
  const [blocks, setBlocks] = useState<BlockInstance[]>([createBlock('heading')]);

  // Load existing lesson.
  useEffect(() => {
    async function loadData() {
      if (isNew) {
        setIsLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from('lessons')
        .select('title, content, skill_type, description, published, duration_minutes')
        .eq('id', lessonIdParam)
        .single();

      if (error) {
        console.error('Error fetching lesson:', error);
      } else if (data) {
        setTitle(data.title || '');
        setSkillType(data.skill_type || '');
        setDescription(data.description || '');
        setDuration(data.duration_minutes ?? '');
        setPublished(!!data.published);
        const normalized = normalizeBlocks(data.content);
        if (normalized.length > 0) setBlocks(normalized);
      }
      setIsLoading(false);
    }
    loadData();
  }, [lessonIdParam, isNew, supabase]);

  const buildPayload = useCallback(() => {
    let finalTitle = title;
    const first = blocks[0];
    if (!finalTitle && first?.type === 'heading') {
      finalTitle = (first.data as { text?: string })?.text ?? '';
    }
    if (!finalTitle) finalTitle = 'Lección sin título';
    return {
      title: finalTitle,
      content: blocks,
      skill_type: skillType || null,
      description: description || null,
      duration_minutes: duration === '' ? null : Number(duration),
      published,
    };
  }, [title, blocks, skillType, description, duration, published]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveState('saving');
    const payload = buildPayload();

    if (isNew) {
      if (!levelId) {
        alert('Falta el level_id para saber dónde guardar esta lección.');
        setIsSaving(false);
        setSaveState('idle');
        return;
      }
      // `order` is assigned automatically by a DB trigger (next slot in level).
      const { data, error } = await supabase
        .from('lessons')
        .insert({ ...payload, level_id: levelId })
        .select()
        .single();

      if (error) {
        console.error(error);
        setSaveState('error');
        alert('Error al crear la lección: ' + error.message);
      } else {
        setSaveState('saved');
        router.replace(`/admin/content/lessons/${data.id}/edit`);
      }
    } else {
      const { error } = await supabase.from('lessons').update(payload).eq('id', lessonIdParam);
      if (error) {
        console.error(error);
        setSaveState('error');
      } else {
        setSaveState('saved');
      }
    }
    setIsSaving(false);
  };

  // ── Autosave (existing lessons only) ──────────────────
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipFirst = useRef(true);
  useEffect(() => {
    if (isNew || isLoading) return;
    if (skipFirst.current) {
      skipFirst.current = false;
      return;
    }
    setSaveState('saving');
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(async () => {
      const { error } = await supabase.from('lessons').update(buildPayload()).eq('id', lessonIdParam);
      setSaveState(error ? 'error' : 'saved');
    }, 1500);
    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, skillType, description, duration, published, blocks]);

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
              <Button variant="ghost" className="mb-2 -ml-3 text-muted-foreground hover:text-foreground" onClick={() => router.back()}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                {levelCode ? `Atrás al Nivel ${levelCode}` : 'Atrás'}
              </Button>
              <h1 className="text-3xl font-bold tracking-tight">{isNew ? 'Nueva Lección Interactiva' : 'Editando Lección'}</h1>
            </div>
            <div className="flex items-center gap-3">
              {!isNew && <SaveIndicator state={saveState} />}
              <Button onClick={handleSave} disabled={isSaving} className="gap-2 shrink-0 min-w-[180px]">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {isSaving ? 'Guardando...' : isNew ? 'Crear Lección' : 'Guardar'}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">Título de la Lección</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full text-lg font-semibold bg-background border border-border p-3 rounded-xl outline-none text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary" placeholder="Ej: Verbo To Be básico" />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">Duración (min)</label>
              <input type="number" min={0} value={duration} onChange={(e) => setDuration(e.target.value === '' ? '' : Number(e.target.value))} className="w-full text-base bg-background border border-border p-3 rounded-xl outline-none text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary" placeholder="Ej: 15" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">Skill / Habilidad</label>
              <input type="text" value={skillType} onChange={(e) => setSkillType(e.target.value)} className="w-full text-base bg-background border border-border p-3 rounded-xl outline-none text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary" placeholder="Ej: Listening, Grammar…" />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">Descripción corta</label>
              <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full text-sm bg-background border border-border p-3 rounded-xl outline-none text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary" placeholder="Resumen para la lista (opcional)" />
            </div>
          </div>

          <div className="mb-6 flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} className="w-4 h-4 accent-primary cursor-pointer" />
              <span className="text-sm font-semibold text-foreground">Publicar lección (visible en /learn para estudiantes)</span>
            </label>
          </div>

          <div className="border-t border-border/50 mb-2 pt-6">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Contenido de la Lección (Bloques)</h2>
          </div>

          <div className="min-h-[500px]">
            <LessonBuilder initialBlocks={blocks} onChange={setBlocks} />
          </div>
        </>
      )}
    </div>
  );
}

function SaveIndicator({ state }: { state: SaveState }) {
  if (state === 'saving') return <span className="text-xs text-muted-foreground flex items-center gap-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Guardando…</span>;
  if (state === 'saved') return <span className="text-xs text-green-600 flex items-center gap-1.5"><Check className="w-3.5 h-3.5" /> Guardado</span>;
  if (state === 'error') return <span className="text-xs text-destructive flex items-center gap-1.5"><CloudOff className="w-3.5 h-3.5" /> Error al guardar</span>;
  return null;
}
