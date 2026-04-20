'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';

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
    const { error } = await supabase
      .from('levels')
      .delete()
      .eq('id', levelId);

    if (error) {
      alert("Error al eliminar el nivel. Asegúrate de tener permisos de DELETE.");
      setIsDeleting(false);
    } else {
      router.push('/admin/content');
      router.refresh();
    }
  };

  return (
    <>
      <Button 
        variant="ghost" 
        onClick={() => setIsOpen(true)}
        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors gap-2"
      >
        <Trash2 className="w-4 h-4" />
        Eliminar Nivel
      </Button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isDeleting && setIsOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            {/* Modal */}
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center gap-3 text-destructive mb-4">
                <div className="bg-destructive/10 p-2 rounded-lg">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold">¡Acción Destructiva!</h3>
              </div>

              <p className="text-muted-foreground text-sm mb-6">
                Esta acción eliminará el nivel <strong className="text-foreground">"{levelTitle}"</strong> y todas sus lecciones de forma permanente. Esta acción no se puede deshacer.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
                    Escribe "<span className="text-foreground">{levelTitle}</span>" para confirmar:
                  </label>
                  <input 
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    className="w-full bg-background border border-border p-3 rounded-xl outline-none focus:border-destructive focus:ring-1 focus:ring-destructive/50 text-foreground"
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
                    {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    {isDeleting ? 'Eliminando...' : 'Eliminar Nivel'}
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
