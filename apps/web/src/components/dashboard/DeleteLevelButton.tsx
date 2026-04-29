'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { createClient } from '@/utils/supabase/client';

interface DeleteLevelButtonProps {
  levelId: string;
  levelTitle: string;
}

export function DeleteLevelButton({ levelId, levelTitle }: DeleteLevelButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleDelete = async () => {
    if (confirmText !== levelTitle) return;

    setIsDeleting(true);
    const { error } = await supabase.from('levels').delete().eq('id', levelId);

    if (error) {
      alert('Error al eliminar el nivel. Asegurate de tener permisos de DELETE.');
      setIsDeleting(false);
      return;
    }

    router.push('/admin/content');
    router.refresh();
  };

  return (
    <>
      <Button
        variant="ghost"
        onClick={() => setIsOpen(true)}
        className="gap-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
        Eliminar nivel
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
                Esta accion eliminara el nivel{' '}
                <strong className="text-foreground">&quot;{levelTitle}&quot;</strong> y todas sus
                lecciones de forma permanente. Esta accion no se puede deshacer.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Escribe &quot;<span className="text-foreground">{levelTitle}</span>&quot; para
                    confirmar:
                  </label>
                  <input
                    type="text"
                    value={confirmText}
                    onChange={(event) => setConfirmText(event.target.value)}
                    className="w-full rounded-xl border border-border bg-background p-3 text-foreground outline-none focus:border-destructive focus:ring-1 focus:ring-destructive/50"
                    placeholder="Nombre del nivel..."
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
                    disabled={confirmText !== levelTitle || isDeleting}
                    onClick={handleDelete}
                  >
                    {isDeleting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    {isDeleting ? 'Eliminando...' : 'Eliminar nivel'}
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
