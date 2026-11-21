'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronUp, FileText, GripVertical, Loader2, Save, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DeleteLessonButton } from '@/components/dashboard/DeleteLessonButton';
import { createClient } from '@/utils/supabase/client';

export interface LessonRow {
  id: string;
  title: string;
  published: boolean;
  skill_type: string | null;
  blockCount: number;
}

/**
 * The level's lessons, in order. They can be reordered by dragging a row or with the arrows;
 * nothing is saved until "Guardar orden" (one atomic call that renumbers the whole level 1..n).
 * The page remounts this component (via `key`) after a save, so it always starts from the server's order.
 */
export default function LessonList({ levelId, lessons }: { levelId: string; lessons: LessonRow[] }) {
  const router = useRouter();
  const [items, setItems] = useState(lessons);
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dirty = items.some((l, i) => l.id !== lessons[i]?.id);

  // Warn before leaving the page with an unsaved order.
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  const move = (from: number, to: number) => {
    if (from === to || to < 0 || to >= items.length) return;
    setItems((prev) => {
      const next = [...prev];
      const [m] = next.splice(from, 1);
      next.splice(to, 0, m);
      return next;
    });
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    const { error: rpcError } = await createClient().rpc('reorder_lessons', {
      p_level_id: levelId,
      p_lesson_ids: items.map((l) => l.id),
    });
    if (rpcError) {
      setSaving(false);
      if (rpcError.code === '22023') {
        setError('El nivel cambió mientras reordenabas (alguien añadió o borró una lección). Recarga la página e inténtalo de nuevo.');
      } else if (rpcError.code === 'PGRST202' || (/reorder_lessons/i.test(rpcError.message) && /find|exist/i.test(rpcError.message))) {
        setError('Falta aplicar la actualización de la base de datos (reorder_lessons). Avísale al equipo técnico.');
      } else {
        setError(rpcError.message || 'No se pudo guardar el orden.');
      }
      return;
    }
    router.refresh();
  };

  return (
    <>
      {dirty && (
        <div className="sticky top-2 z-20 mb-3 flex flex-wrap items-center gap-3 rounded-xl border border-primary/40 bg-card/95 px-4 py-3 shadow-lg backdrop-blur">
          <span className="text-sm font-semibold text-foreground">Orden modificado, aún sin guardar.</span>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => { setItems(lessons); setError(null); }} disabled={saving}>
              <Undo2 className="w-4 h-4" /> Descartar
            </Button>
            <Button size="sm" className="gap-1.5" onClick={save} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Guardar orden
            </Button>
          </div>
          {error && <p className="basis-full text-sm font-semibold text-destructive">{error}</p>}
        </div>
      )}

      <div className="flex flex-col gap-3">
        {items.map((lesson, idx) => (
          <div
            key={lesson.id}
            data-lesson-row
            onDragOver={(e) => { e.preventDefault(); if (dragOver !== idx) setDragOver(idx); }}
            onDrop={() => {
              if (dragFrom !== null) move(dragFrom, idx);
              setDragFrom(null);
              setDragOver(null);
            }}
            className={`flex items-center justify-between p-4 bg-card border rounded-xl cursor-default group transition-colors ${
              dragOver === idx && dragFrom !== null && dragFrom !== idx ? 'border-primary border-dashed' : 'border-border/60 hover:border-primary/50'
            } ${dragFrom === idx ? 'opacity-50' : ''}`}
          >
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <div className="flex items-center gap-0.5 shrink-0">
                {/* Only the handle is draggable (so the delete dialog's text field keeps working); touch devices use the arrows. */}
                <div
                  draggable={!saving}
                  onDragStart={(e) => {
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/plain', lesson.id);
                    const row = e.currentTarget.closest('[data-lesson-row]');
                    if (row) e.dataTransfer.setDragImage(row, 24, 24);
                    setDragFrom(idx);
                  }}
                  onDragEnd={() => { setDragFrom(null); setDragOver(null); }}
                  title="Arrastra para reordenar"
                  className="hidden [@media(hover:hover)_and_(pointer:fine)]:block p-0.5 cursor-grab active:cursor-grabbing"
                >
                  <GripVertical className="w-4 h-4 text-muted-foreground/60" aria-hidden />
                </div>
                {/* With a mouse the arrows appear on hover/keyboard focus; on touch devices they are always visible. */}
                <div className="flex flex-col transition-opacity [@media(hover:hover)_and_(pointer:fine)]:opacity-0 [@media(hover:hover)_and_(pointer:fine)]:group-hover:opacity-100 [@media(hover:hover)_and_(pointer:fine)]:focus-within:opacity-100">
                  <button
                    type="button"
                    onClick={() => move(idx, idx - 1)}
                    disabled={idx === 0 || saving}
                    aria-label={`Subir «${lesson.title}»`}
                    className="p-0.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-25"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(idx, idx + 1)}
                    disabled={idx === items.length - 1 || saving}
                    aria-label={`Bajar «${lesson.title}»`}
                    className="p-0.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-25"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="w-10 h-10 shrink-0 rounded-full bg-muted flex items-center justify-center font-bold text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                {idx + 1}
              </div>
              <div className="min-w-0">
                <h4 className="font-semibold text-foreground flex flex-wrap items-center gap-2">
                  {lesson.title}
                  {lesson.published ? (
                    <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-sm bg-green-500/15 text-green-600 font-bold">Publicada</span>
                  ) : (
                    <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-sm bg-muted text-muted-foreground font-bold">Borrador</span>
                  )}
                </h4>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-1">
                  {lesson.skill_type && (
                    <>
                      <span className="uppercase text-[10px] tracking-wider px-2 py-0.5 rounded-sm bg-primary/10 text-primary">{lesson.skill_type}</span>
                      <span>•</span>
                    </>
                  )}
                  <span className="uppercase text-[10px] tracking-wider px-2 py-0.5 rounded-sm bg-muted flex items-center gap-1">
                    <FileText className="w-3 h-3" /> Lección
                  </span>
                  <span>•</span>
                  <span>{lesson.blockCount} bloques</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
              <Link href={`/admin/content/lessons/${lesson.id}/edit`}>
                <Button variant="outline" size="sm" className="border-primary/50 text-primary hover:bg-primary/10">
                  Editar Lección
                </Button>
              </Link>
              <DeleteLessonButton lessonId={lesson.id} lessonTitle={lesson.title} />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
