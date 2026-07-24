'use client';

import { useState, useEffect } from 'react';
import { GraduationCap, Map, Flame, Award, ArrowRight, X } from 'lucide-react';

const STORAGE_KEY = 'dialektoz:welcomed';

const SLIDES: { icon: React.ReactNode; title: string; body: string }[] = [
  {
    icon: <GraduationCap className="size-8" />,
    title: '¡Bienvenido a Dialektoz!',
    body: 'Tu ruta para aprender inglés desde cero hasta la fluidez. Te mostramos lo esencial en 20 segundos.',
  },
  {
    icon: <Map className="size-8" />,
    title: 'Aprende paso a paso',
    body: 'El contenido está organizado en niveles (A1, A2, …) y lecciones. Completa una para desbloquear la siguiente. Mira tu avance en "Mi Progreso".',
  },
  {
    icon: <Flame className="size-8" />,
    title: 'Gana XP y mantén tu racha',
    body: 'Cada lección te da puntos y suma a tu racha diaria. Estudia un poco cada día y sube en la clasificación.',
  },
  {
    icon: <Award className="size-8" />,
    title: 'Certifícate gratis',
    body: 'Al terminar un nivel presentas su examen y obtienes un certificado verificable para tu CV. ¡Empieza cuando quieras!',
  },
];

export default function WelcomeTour() {
  const [show, setShow] = useState(false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    try {
      // Reading localStorage must happen after mount to avoid a hydration
      // mismatch; this is the standard pattern for a show-once modal.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (window.localStorage.getItem(STORAGE_KEY) !== '1') setShow(true);
    } catch {
      // storage unavailable — skip the tour
    }
  }, []);

  const close = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      /* ignore */
    }
    setShow(false);
  };

  if (!show) return null;
  const slide = SLIDES[index];
  const isLast = index === SLIDES.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="relative h-1.5 bg-muted">
          <div className="absolute inset-y-0 left-0 bg-primary transition-all" style={{ width: `${((index + 1) / SLIDES.length) * 100}%` }} />
        </div>

        <div className="p-8 text-center">
          <button onClick={close} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground" aria-label="Cerrar">
            <X className="size-5" />
          </button>

          <div className="size-16 rounded-2xl bg-primary/15 text-primary flex items-center justify-center mx-auto mb-5">
            {slide.icon}
          </div>
          <h2 className="text-2xl font-bold tracking-tight mb-2">{slide.title}</h2>
          <p className="text-foreground/60 leading-relaxed mb-7">{slide.body}</p>

          <div className="flex items-center justify-center gap-1.5 mb-6">
            {SLIDES.map((_, i) => (
              <span key={i} className={`size-1.5 rounded-full transition-colors ${i === index ? 'bg-primary w-5' : 'bg-muted'}`} />
            ))}
          </div>

          <div className="flex items-center justify-between gap-3">
            <button onClick={close} className="text-sm font-semibold text-foreground/50 hover:text-foreground">
              Saltar
            </button>
            <button
              onClick={() => (isLast ? close() : setIndex((i) => i + 1))}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-bold px-6 py-2.5 rounded-xl"
            >
              {isLast ? 'Empezar' : 'Siguiente'}
              <ArrowRight className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
