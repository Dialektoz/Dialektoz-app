import Link from "next/link";
import { ArrowRight, Clock, BookOpen, Sparkles, Trophy } from "lucide-react";
import type { CurrentCourse, ReviewItem } from "@/lib/dashboard";

interface CourseProgressProps {
  currentCourse: CurrentCourse | null;
  review: ReviewItem[];
  firstName: string;
}

export default function CourseProgress({ currentCourse, review, firstName }: CourseProgressProps) {
  return (
    <div className="flex flex-col gap-6 lg:gap-10 max-w-[900px] mx-auto py-2 px-1">
      {/* Current Course Card */}
      <section className="bg-card rounded-2xl p-6 md:p-8 border border-border relative overflow-hidden flex flex-col justify-between min-h-[240px] shadow-sm">
        {currentCourse ? (
          <div className="relative z-10 w-full md:w-[70%] flex flex-col h-full justify-between">
            <div>
              <p className="text-primary text-[10px] font-bold tracking-widest uppercase mb-2">CURSO ACTUAL</p>
              <h2 className="text-3xl md:text-4xl font-extrabold mb-2 tracking-tight">{currentCourse.title}</h2>
              <p className="text-foreground/50 text-sm font-medium mb-6">
                {currentCourse.code} · {currentCourse.levelLabel} · {currentCourse.completed}/{currentCourse.total} lecciones
              </p>
            </div>

            <div className="mb-8">
              <div className="flex justify-between text-xs mb-2 font-semibold">
                <span className="text-foreground/80">Progreso del curso</span>
                <span className="text-primary">{currentCourse.percent}%</span>
              </div>
              <div className="w-full h-2 bg-background rounded-full overflow-hidden border border-border/50">
                <div className="h-full bg-primary rounded-full relative" style={{ width: `${currentCourse.percent}%` }}>
                  <div className="absolute inset-0 bg-white/20 w-1/2 rounded-full"></div>
                </div>
              </div>
            </div>

            <Link
              href={
                currentCourse.nextLessonId
                  ? `/learn/${currentCourse.code.toLowerCase()}/${currentCourse.nextLessonId}`
                  : `/learn/${currentCourse.code.toLowerCase()}`
              }
              className="bg-primary text-primary-foreground font-bold text-sm py-3 px-6 rounded-md flex items-center gap-2 hover:bg-accent hover:text-accent-foreground transition-all w-fit shadow-md"
            >
              {currentCourse.percent === 0 ? "Empezar" : currentCourse.percent === 100 ? "Repasar nivel" : "Continuar"}
              <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <div className="relative z-10 flex flex-col items-start gap-4">
            <p className="text-primary text-[10px] font-bold tracking-widest uppercase">BIENVENIDO{firstName ? `, ${firstName.toUpperCase()}` : ""}</p>
            <h2 className="text-3xl font-extrabold tracking-tight">Empieza tu ruta de aprendizaje</h2>
            <p className="text-foreground/60 text-sm max-w-md">Aún no hay cursos disponibles. Explora los niveles cuando estén publicados.</p>
            <Link href="/learn" className="bg-primary text-primary-foreground font-bold text-sm py-3 px-6 rounded-md flex items-center gap-2 hover:bg-accent transition-all w-fit shadow-md">
              Explorar niveles <ArrowRight size={16} />
            </Link>
          </div>
        )}

        <div className="hidden sm:flex absolute right-[2%] top-[10%] opacity-5 pointer-events-none text-foreground items-center justify-center h-full">
          <Sparkles size={220} strokeWidth={1} />
        </div>
      </section>

      {/* Review Section */}
      <section>
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2 tracking-tight">
          <Clock size={20} className="text-primary" /> Repasar
        </h3>
        {review.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {review.map((item) => (
              <Link
                key={item.lessonId}
                href={`/learn/${item.levelCode.toLowerCase()}/${item.lessonId}`}
                className="bg-card rounded-xl p-5 border border-border flex items-center gap-4 hover:border-primary/40 transition-colors group shadow-sm"
              >
                <div className="w-12 h-12 bg-background rounded-lg flex items-center justify-center border border-border/50 text-primary">
                  <BookOpen size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-[14px] group-hover:text-primary transition-colors truncate">{item.title}</h4>
                  <p className="text-[11px] text-foreground/60 mt-0.5">
                    {item.score != null ? `Puntuación: ${item.score}%` : "Completada"}
                  </p>
                </div>
                <ArrowRight size={16} className="text-foreground/40 group-hover:text-primary transition-colors shrink-0" />
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-card rounded-xl p-6 border border-dashed border-border text-center text-sm text-foreground/50">
            Completa lecciones para tener contenido que repasar aquí.
          </div>
        )}
      </section>

      {/* Enrolled Path */}
      {currentCourse && (
        <section>
          <h3 className="text-xl font-bold mb-4 tracking-tight">Trayecto Inscrito</h3>
          <div className="bg-card rounded-2xl border border-border flex flex-col md:flex-row overflow-hidden min-h-[180px]">
            <div className="w-full h-28 md:w-[30%] md:h-auto bg-gradient-to-br from-primary/20 to-transparent flex items-center justify-center relative">
              <span className="text-5xl font-black text-primary/40">{currentCourse.code}</span>
            </div>
            <div className="w-full md:w-[70%] p-6 md:p-8 flex flex-col justify-center z-10">
              <div className="flex justify-between items-start mb-1">
                <h4 className="text-2xl font-bold tracking-tight">{currentCourse.title}</h4>
                <span className="bg-accent/15 border border-accent/30 text-accent text-[10px] font-bold px-3 py-1 rounded-md uppercase tracking-widest mt-1 whitespace-nowrap">
                  {currentCourse.percent === 100 ? "COMPLETADO" : "EN CURSO"}
                </span>
              </div>
              {currentCourse.nextLessonTitle && (
                <p className="text-foreground/70 text-sm mb-4 font-medium">Próxima lección: {currentCourse.nextLessonTitle}</p>
              )}
              <p className="text-[13px] mb-4 leading-relaxed text-foreground/80">{currentCourse.description || "Sigue avanzando en tu ruta de aprendizaje."}</p>
              <div className="flex items-center gap-2 text-xs font-bold text-foreground/50">
                <Trophy size={14} className="text-primary" />
                <span>{currentCourse.completed} de {currentCourse.total} lecciones completadas</span>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
