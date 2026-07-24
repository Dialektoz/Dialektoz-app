'use client';

import { useState } from 'react';
import {
  HelpCircle, X, Plus, GripVertical, BookOpen, ClipboardCheck,
  Eye, Save, Palette,
} from 'lucide-react';

const TIPS: { icon: React.ReactNode; title: string; body: string }[] = [
  {
    icon: <Plus className="size-4" />,
    title: 'Todo son bloques',
    body: 'Pasa el cursor entre bloques y pulsa + para insertar uno nuevo. Hay texto, imágenes, video, tablas, actividades y más. Usa el buscador del menú para encontrarlos rápido.',
  },
  {
    icon: <GripVertical className="size-4" />,
    title: 'Reordenar y duplicar',
    body: 'Cada bloque tiene controles al pasar el cursor: arrástralo desde el asa, súbelo/bájalo con las flechas, o usa el menú (⋮) para duplicar o eliminar.',
  },
  {
    icon: <BookOpen className="size-4" />,
    title: 'Pestaña "Contenido"',
    body: 'Es lo que el estudiante estudia. Puedes incluir actividades de práctica libre: sirven para aprender, pero no cuentan para la nota.',
  },
  {
    icon: <ClipboardCheck className="size-4" />,
    title: 'Pestaña "Evaluación"',
    body: 'Aquí van las preguntas que sí califican. El estudiante debe responderlas todas para completar la lección, y estas mismas preguntas alimentan el examen de certificación del nivel.',
  },
  {
    icon: <Palette className="size-4" />,
    title: 'Formato de texto',
    body: 'En los bloques de texto tienes negrita, cursiva, listas, enlaces y una paleta de colores. Úsalos con moderación para no saturar la lectura.',
  },
  {
    icon: <Eye className="size-4" />,
    title: 'Vista previa',
    body: 'El botón "Vista previa" muestra la lección tal cual la verá el estudiante, con las actividades funcionando. Vuelve a editar con el mismo botón.',
  },
  {
    icon: <Save className="size-4" />,
    title: 'Autoguardado y publicar',
    body: 'Tus cambios se guardan solos mientras editas. La lección permanece en borrador hasta que activas "Publicada" en la cabecera; solo entonces aparece en /learn.',
  },
];

export default function EditorGuide() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Guía del editor"
        className="inline-flex items-center justify-center size-9 rounded-lg border border-border text-foreground/60 hover:text-foreground hover:bg-muted transition-colors"
      >
        <HelpCircle className="size-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setOpen(false)}>
          <div
            className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <HelpCircle className="size-5 text-primary" /> Guía rápida del editor
              </h2>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="size-5" />
              </button>
            </div>

            <div className="overflow-y-auto custom-scrollbar p-6 space-y-4">
              {TIPS.map((tip, i) => (
                <div key={i} className="flex gap-3">
                  <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    {tip.icon}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm text-foreground">{tip.title}</h3>
                    <p className="text-sm text-foreground/60 leading-relaxed">{tip.body}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="px-6 py-3 border-t border-border shrink-0 text-right">
              <button
                onClick={() => setOpen(false)}
                className="bg-primary text-primary-foreground font-bold text-sm px-5 py-2 rounded-lg"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
