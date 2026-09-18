'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { createClient } from '@/utils/supabase/client';

interface DeleteLessonButtonProps {
  lessonId: string;
  lessonTitle: string;
}

export function DeleteLessonButton({ lessonId, lessonTitle }: DeleteLessonButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleDelete = async () => {
    if (confirmText !== lessonTitle) return;

    setIsDeleting(true);
    const { error } = await supabase.from('lessons').delete().eq('id', lessonId);

    if (error) {
      alert('Error al eliminar la leccion. Asegurate de tener permisos de DELETE.');
      setIsDeleting(false);
      return;
    }

    setIsOpen(false);
    setConfirmText('');
    setIsDeleting(false);
    router.refresh();
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(true)}
        className="text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isDeleting && setIsOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-2xl"
            >
              <div className="mb-4 flex items-center gap-3 text-destructive">
                <div className="rounded-lg bg-destructive/10 p-2">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold">Accion destructiva</h3>
              </div>

              <p className="mb-6 text-sm text-muted-foreground">
                Esta accion eliminara la leccion{' '}
                <strong className="text-foreground">&quot;{lessonTitle}&quot;</strong> de forma
                permanente. Esta accion no se puede deshacer.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Escribe &quot;<span className="text-foreground">{lessonTitle}</span>&quot; para
                    confirmar:
                  </label>
                  <input
                    type="text"
                    value={confirmText}
                    onChange={(event) => setConfirmText(event.target.value)}
                    className="w-full rounded-xl border border-border bg-background p-3 text-foreground outline-none focus:border-destructive focus:ring-1 focus:ring-destructive/50"
                    placeholder="Nombre de la leccion..."
                    disabled={isDeleting}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="ghost"
                    className="flex-1"
                    onClick={() => setIsOpen(false)}
                    disabled={isDeleting}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1 gap-2"
                    disabled={confirmText !== lessonTitle || isDeleting}
                    onClick={handleDelete}
                  >
                    {isDeleting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    {isDeleting ? 'Eliminando...' : 'Eliminar leccion'}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
