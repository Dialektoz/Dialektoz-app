'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import type { PublicQuestion, PublicContext, AnswerValue } from '@/lib/exam/grading';
import { getBlock } from '@/components/editor/blocks/registry';
import {
  Clock, Loader2, ArrowLeft, ArrowRight, AlertCircle, Award,
  CheckCircle2, XCircle, FileQuestion, ShieldCheck, ArrowLeftRight, ChevronUp, ChevronDown,
} from 'lucide-react';

interface StartResponse {
  attemptId: string;
  timeLimitMinutes: number;
  passingScore: number;
  attemptsLeft: number;
  questions: PublicQuestion[];
}

interface Result {
  score: number;
  correct: number;
  total: number;
  passed: boolean;
  passingScore: number;
  serial: string | null;
}

type Phase = 'intro' | 'running' | 'result';

export default function ExamRunner({
  levelCode,
  levelTitle,
  questionCount,
  passingScore,
  timeLimitMinutes,
  attemptsLeft,
}: {
  levelCode: string;
  levelTitle: string;
  questionCount: number;
  passingScore: number;
  timeLimitMinutes: number;
  attemptsLeft: number;
}) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exam, setExam] = useState<StartResponse | null>(null);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [index, setIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const submittingRef = useRef(false);

  const start = async () => {
    setLoading(true);
    setError(null);
    const res = await fetch('/api/exam/start', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ levelCode }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? 'No se pudo iniciar el examen');
      return;
    }
    setExam(data);
    setSecondsLeft(data.timeLimitMinutes * 60);
    setPhase('running');
  };

  const submit = useCallback(async () => {
    if (!exam || submittingRef.current) return;
    submittingRef.current = true;
    setLoading(true);
    const res = await fetch('/api/exam/submit', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ attemptId: exam.attemptId, answers }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? 'No se pudo enviar el examen');
      submittingRef.current = false;
      return;
    }
    setResult(data);
    setPhase('result');
  }, [exam, answers]);

  // Countdown; auto-submits when time runs out.
  useEffect(() => {
    if (phase !== 'running') return;
    const id = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(id);
          void submit();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [phase, submit]);

  /* ── Intro ─────────────────────────────────────────── */
  if (phase === 'intro') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
          <div className="size-14 rounded-2xl bg-primary/15 text-primary flex items-center justify-center mb-5">
            <ShieldCheck className="size-7" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">
            Examen de certificación {levelCode}
          </h1>
          <p className="text-foreground/60 mb-6">{levelTitle}</p>

          <ul className="space-y-3 mb-7">
            <Rule icon={<FileQuestion className="size-4" />} text={`${questionCount} preguntas tomadas de las evaluaciones del nivel`} />
            <Rule icon={<Clock className="size-4" />} text={`${timeLimitMinutes} minutos — el examen se envía solo al terminar el tiempo`} />
            <Rule icon={<CheckCircle2 className="size-4" />} text={`Necesitas ${passingScore}% para aprobar`} />
            <Rule icon={<AlertCircle className="size-4" />} text={`Te quedan ${attemptsLeft} ${attemptsLeft === 1 ? 'intento' : 'intentos'}`} />
          </ul>

          {error && (
            <p className="mb-4 text-sm text-destructive flex items-center gap-2">
              <AlertCircle className="size-4" /> {error}
            </p>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={start}
              disabled={loading}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-bold px-6 py-3 rounded-xl disabled:opacity-50"
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : null}
              Comenzar examen
            </button>
            <Link href="/certification" className="text-sm font-semibold text-foreground/60 hover:text-foreground">
              Cancelar
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ── Result ────────────────────────────────────────── */
  if (phase === 'result' && result) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className={`rounded-2xl border p-6 md:p-8 text-center ${result.passed ? 'border-green-500/40 bg-green-500/[0.04]' : 'border-border bg-card'}`}>
          <div className={`size-16 rounded-2xl mx-auto flex items-center justify-center mb-5 ${result.passed ? 'bg-green-500/15 text-green-600' : 'bg-destructive/10 text-destructive'}`}>
            {result.passed ? <Award className="size-8" /> : <XCircle className="size-8" />}
          </div>

          <h1 className="text-3xl font-bold tracking-tight mb-1">
            {result.passed ? '¡Aprobaste!' : 'No alcanzaste el mínimo'}
          </h1>
          <p className="text-foreground/60 mb-6">
            {result.correct} de {result.total} correctas · mínimo {result.passingScore}%
          </p>

          <p className={`text-6xl font-black tabular-nums mb-6 ${result.passed ? 'text-green-600' : 'text-foreground/70'}`}>
            {result.score}%
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {result.passed && result.serial ? (
              <Link href={`/certificate/${result.serial}`} className="inline-flex items-center gap-2 bg-green-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-green-700">
                <Award className="size-4" /> Ver mi certificado
              </Link>
            ) : null}
            <Link href="/certification" className="inline-flex items-center gap-2 border border-border font-bold px-6 py-3 rounded-xl hover:bg-muted">
              Volver a certificación
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ── Running ───────────────────────────────────────── */
  if (!exam) return null;
  const question = exam.questions[index];
  const answered = Object.keys(answers).filter((k) => answers[k] !== null && answers[k] !== undefined).length;
  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const lowTime = secondsLeft <= 60;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header: progress + timer */}
      <div className="flex items-center justify-between gap-4 mb-3">
        <span className="text-sm font-bold text-foreground/60 tabular-nums">
          Pregunta {index + 1} de {exam.questions.length}
        </span>
        <span className={`inline-flex items-center gap-1.5 text-sm font-bold tabular-nums px-3 py-1 rounded-lg ${lowTime ? 'bg-destructive/10 text-destructive' : 'bg-muted text-foreground/70'}`}>
          <Clock className="size-4" /> {mins}:{String(secs).padStart(2, '0')}
        </span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-6">
        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${((index + 1) / exam.questions.length) * 100}%` }} />
      </div>

      {/* Question */}
      <div className="rounded-2xl border border-border bg-card p-5 md:p-7 mb-5 min-h-[220px]">
        {question.context && question.context.length > 0 && <QuestionContext items={question.context} />}
        <QuestionInput
          question={question}
          value={answers[question.id] ?? null}
          onChange={(v) => setAnswers((a) => ({ ...a, [question.id]: v }))}
        />
      </div>

      {error && (
        <p className="mb-4 text-sm text-destructive flex items-center gap-2">
          <AlertCircle className="size-4" /> {error}
        </p>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
          className="inline-flex items-center gap-2 border border-border font-semibold px-4 py-2.5 rounded-lg disabled:opacity-40 hover:bg-muted"
        >
          <ArrowLeft className="size-4" /> Anterior
        </button>

        <span className="text-xs text-foreground/50 tabular-nums">{answered}/{exam.questions.length} respondidas</span>

        {index < exam.questions.length - 1 ? (
          <button
            onClick={() => setIndex((i) => Math.min(exam.questions.length - 1, i + 1))}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-bold px-4 py-2.5 rounded-lg"
          >
            Siguiente <ArrowRight className="size-4" />
          </button>
        ) : (
          <button
            onClick={submit}
            disabled={loading}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-bold px-5 py-2.5 rounded-lg disabled:opacity-50"
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : null}
            Enviar examen
          </button>
        )}
      </div>
    </div>
  );
}

function Rule({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <li className="flex items-start gap-3 text-sm text-foreground/80">
      <span className="text-primary mt-0.5 shrink-0">{icon}</span>
      {text}
    </li>
  );
}

/* ── Answer inputs, one per supported question type ─── */

function QuestionInput({
  question,
  value,
  onChange,
}: {
  question: PublicQuestion;
  value: AnswerValue;
  onChange: (value: AnswerValue) => void;
}) {
  const prompt = <p className="text-lg font-semibold text-foreground mb-5">{question.prompt}</p>;

  switch (question.type) {
    case 'quiz':
      return (
        <>
          {prompt}
          <div className="space-y-2">
            {(question.options ?? []).map((opt, i) => (
              <button
                key={i}
                onClick={() => onChange(i)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
                  value === i ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50 bg-background/40'
                }`}
              >
                <span className={`size-5 rounded-full border-2 flex items-center justify-center shrink-0 ${value === i ? 'border-primary' : 'border-border'}`}>
                  {value === i && <span className="size-2 bg-primary rounded-full" />}
                </span>
                <span className="text-sm">{opt}</span>
              </button>
            ))}
          </div>
        </>
      );

    case 'multi-choice': {
      const selected = Array.isArray(value) ? (value as number[]) : [];
      return (
        <>
          {prompt}
          <p className="text-xs text-foreground/50 -mt-4 mb-4">Selecciona todas las que apliquen</p>
          <div className="space-y-2">
            {(question.options ?? []).map((opt, i) => {
              const on = selected.includes(i);
              return (
                <button
                  key={i}
                  onClick={() => onChange(on ? selected.filter((x) => x !== i) : [...selected, i])}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
                    on ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50 bg-background/40'
                  }`}
                >
                  <span className={`size-5 rounded border-2 flex items-center justify-center shrink-0 ${on ? 'border-primary bg-primary' : 'border-border'}`}>
                    {on && <CheckCircle2 className="size-3 text-primary-foreground" />}
                  </span>
                  <span className="text-sm">{opt}</span>
                </button>
              );
            })}
          </div>
        </>
      );
    }

    case 'true-false':
      return (
        <>
          {prompt}
          <div className="flex gap-3">
            {[true, false].map((v) => (
              <button
                key={String(v)}
                onClick={() => onChange(v)}
                className={`flex-1 py-3 rounded-lg font-semibold border-2 transition-colors ${
                  value === v ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/50'
                }`}
              >
                {v ? 'Verdadero' : 'Falso'}
              </button>
            ))}
          </div>
        </>
      );

    case 'fill-blank': {
      const values = Array.isArray(value) ? (value as string[]) : [];
      let blankIndex = -1;
      return (
        <>
          {prompt}
          <div className="flex flex-wrap items-center gap-2 text-lg text-foreground">
            {(question.segments ?? []).map((seg, i) => {
              if (seg !== '') return <span key={i}>{seg}</span>;
              blankIndex++;
              const idx = blankIndex;
              return (
                <input
                  key={i}
                  value={values[idx] ?? ''}
                  onChange={(e) => {
                    const next = [...values];
                    next[idx] = e.target.value;
                    onChange(next);
                  }}
                  className="inline-block min-w-[110px] px-3 py-1 border-b-2 border-primary bg-background/50 rounded-sm text-center outline-none text-primary"
                />
              );
            })}
          </div>
        </>
      );
    }

    case 'short-answer':
      return (
        <>
          {prompt}
          <input
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Tu respuesta…"
            className="w-full bg-background border-2 border-border rounded-xl px-4 py-3 outline-none focus:border-primary"
          />
        </>
      );

    case 'matching':
      return (
        <>
          {prompt}
          <MatchingInput question={question} value={value} onChange={onChange} />
        </>
      );

    case 'ordering':
      return (
        <>
          {prompt}
          <OrderingInput question={question} value={value} onChange={onChange} />
        </>
      );

    case 'classification':
      return (
        <>
          {prompt}
          <ClassificationInput question={question} value={value} onChange={onChange} />
        </>
      );

    case 'image-labeling':
      return (
        <>
          {prompt}
          <ImageLabelingInput question={question} value={value} onChange={onChange} />
        </>
      );

    case 'image-hotspot':
      return (
        <>
          {prompt}
          <ImageHotspotInput question={question} value={value} onChange={onChange} />
        </>
      );

    default:
      return prompt;
  }
}

/* ── Inputs for the activity-style questions (no feedback, answers by content) ─── */

const selectClass = 'flex-1 min-w-0 p-3 rounded-lg border border-border bg-background text-sm outline-none focus:border-primary';

/** Display blocks (image, audio, callout…) that belong to the question, shown above it. */
function QuestionContext({ items }: { items: PublicContext[] }) {
  return (
    <div className="mb-4">
      {items.map((c) => {
        const def = getBlock(c.type);
        if (!def) return null;
        const Renderer = def.Renderer;
        return <Renderer key={c.id} data={c.data} />;
      })}
    </div>
  );
}

function MatchingInput({ question, value, onChange }: { question: PublicQuestion; value: AnswerValue; onChange: (v: AnswerValue) => void }) {
  const lefts = question.lefts ?? [];
  const picks = Array.isArray(value) ? (value as string[]) : [];
  return (
    <div className="space-y-2">
      {lefts.map((left, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="flex-1 p-3 rounded-lg border border-border bg-background/60 text-sm font-medium">{left}</div>
          <ArrowLeftRight className="size-4 text-foreground/40 shrink-0" />
          <select
            value={picks[i] ?? ''}
            onChange={(e) => onChange(lefts.map((_, j) => (j === i ? e.target.value : (picks[j] ?? ''))))}
            className={selectClass}
          >
            <option value="" disabled>Selecciona…</option>
            {(question.options ?? []).map((o, idx) => <option key={idx} value={o}>{o}</option>)}
          </select>
        </div>
      ))}
    </div>
  );
}

function OrderingInput({ question, value, onChange }: { question: PublicQuestion; value: AnswerValue; onChange: (v: AnswerValue) => void }) {
  // Untouched = null: the starting order is never the solution, so it counts as unanswered either way.
  const order = Array.isArray(value) ? (value as string[]) : (question.options ?? []);
  const move = (from: number, to: number) => {
    if (to < 0 || to >= order.length) return;
    const next = [...order];
    const [m] = next.splice(from, 1);
    next.splice(to, 0, m);
    onChange(next);
  };
  return (
    <>
      <p className="text-xs text-foreground/50 -mt-4 mb-4">Usa las flechas para ordenar</p>
      <div className="space-y-2">
        {order.map((item, i) => (
          <div key={`${item}-${i}`} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background/60">
            <span className="text-xs font-bold text-foreground/50 w-5 text-center shrink-0">{i + 1}</span>
            <span className="flex-1 text-sm">{item}</span>
            <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label="Subir" className="p-1 rounded-md text-foreground/60 hover:bg-muted disabled:opacity-30">
              <ChevronUp className="size-4" />
            </button>
            <button type="button" onClick={() => move(i, i + 1)} disabled={i === order.length - 1} aria-label="Bajar" className="p-1 rounded-md text-foreground/60 hover:bg-muted disabled:opacity-30">
              <ChevronDown className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </>
  );
}

function ClassificationInput({ question, value, onChange }: { question: PublicQuestion; value: AnswerValue; onChange: (v: AnswerValue) => void }) {
  const categories = question.categories ?? [];
  const placed: string[][] =
    Array.isArray(value) && (value as unknown[]).every(Array.isArray)
      ? (value as string[][])
      : categories.map(() => []);
  // Items still in the pool: every option minus one occurrence per placed item.
  const pool = [...(question.options ?? [])];
  for (const label of placed.flat()) {
    const at = pool.indexOf(label);
    if (at >= 0) pool.splice(at, 1);
  }
  // Tap an item, then tap the category (or the pool to take it back).
  const [sel, setSel] = useState<{ label: string; from: number } | null>(null);

  const moveTo = (to: number) => {
    if (!sel) return;
    const next = placed.map((l) => [...l]);
    if (sel.from >= 0) {
      const at = next[sel.from].indexOf(sel.label);
      if (at >= 0) next[sel.from].splice(at, 1);
    }
    if (to >= 0) next[to].push(sel.label);
    setSel(null);
    onChange(next);
  };

  const chip = (label: string, from: number, key: string) => {
    const on = sel?.label === label && sel.from === from;
    return (
      <button
        key={key}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setSel(on ? null : { label, from });
        }}
        className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${on ? 'border-primary bg-primary/15 text-primary ring-2 ring-primary/40' : 'border-border bg-background hover:border-primary/50'}`}
      >
        {label}
      </button>
    );
  };

  return (
    <>
      <p className="text-xs text-foreground/50 -mt-4 mb-4">
        {sel ? 'Ahora toca la categoría donde va este elemento.' : 'Toca un elemento y luego su categoría.'}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        {categories.map((name, ci) => (
          <div
            key={ci}
            onClick={() => moveTo(ci)}
            className={`rounded-xl border-2 border-dashed p-3 min-h-[90px] transition-colors ${sel ? 'border-primary/60 bg-primary/5 cursor-pointer' : 'border-border bg-background/40'}`}
          >
            <p className="text-xs font-bold uppercase tracking-wider text-foreground/50 mb-2">{name}</p>
            <div className="flex flex-wrap gap-2">{placed[ci]?.map((label, k) => chip(label, ci, `${ci}-${k}-${label}`))}</div>
          </div>
        ))}
      </div>
      <div onClick={() => moveTo(-1)} className={`rounded-xl border p-3 min-h-[56px] ${sel ? 'border-primary/40 cursor-pointer' : 'border-border bg-muted/20'}`}>
        <p className="text-[10px] font-bold uppercase tracking-wider text-foreground/50 mb-2">Elementos por clasificar</p>
        <div className="flex flex-wrap gap-2">
          {pool.map((label, k) => chip(label, -1, `pool-${k}-${label}`))}
          {pool.length === 0 && <span className="text-xs text-foreground/40 italic">Todo clasificado</span>}
        </div>
      </div>
    </>
  );
}

function PinnedImage({ question, selected, onPick }: { question: PublicQuestion; selected?: number | null; onPick?: (i: number) => void }) {
  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-border mb-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={question.imageUrl} alt="" className="w-full block" />
      {(question.points ?? []).map((p, i) => {
        const className = `absolute -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full text-sm font-bold flex items-center justify-center border-2 border-background shadow-lg transition-transform ${
          selected === i ? 'bg-primary text-primary-foreground ring-4 ring-primary/40 scale-110' : 'bg-primary/80 text-primary-foreground'
        } ${onPick ? 'hover:scale-110 cursor-pointer' : ''}`;
        const style = { left: `${p.x}%`, top: `${p.y}%` };
        return onPick ? (
          <button key={i} type="button" aria-label={`Punto ${i + 1}`} onClick={() => onPick(i)} style={style} className={className}>{i + 1}</button>
        ) : (
          <span key={i} style={style} className={className}>{i + 1}</span>
        );
      })}
    </div>
  );
}

function ImageLabelingInput({ question, value, onChange }: { question: PublicQuestion; value: AnswerValue; onChange: (v: AnswerValue) => void }) {
  const points = question.points ?? [];
  const picks = Array.isArray(value) ? (value as string[]) : [];
  if (!question.imageUrl) return null;
  return (
    <>
      <PinnedImage question={question} />
      <div className="space-y-2">
        {points.map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="size-7 shrink-0 rounded-full bg-primary/15 text-primary text-sm font-bold flex items-center justify-center">{i + 1}</span>
            <select
              value={picks[i] ?? ''}
              onChange={(e) => onChange(points.map((__, j) => (j === i ? e.target.value : (picks[j] ?? ''))))}
              className={selectClass}
            >
              <option value="" disabled>Selecciona la etiqueta…</option>
              {(question.options ?? []).map((o, idx) => <option key={idx} value={o}>{o}</option>)}
            </select>
          </div>
        ))}
      </div>
    </>
  );
}

function ImageHotspotInput({ question, value, onChange }: { question: PublicQuestion; value: AnswerValue; onChange: (v: AnswerValue) => void }) {
  if (!question.imageUrl) return null;
  return (
    <>
      <PinnedImage question={question} selected={typeof value === 'number' ? value : null} onPick={(i) => onChange(i)} />
      <p className="text-xs text-foreground/50">Toca el punto que corresponde.</p>
    </>
  );
}
