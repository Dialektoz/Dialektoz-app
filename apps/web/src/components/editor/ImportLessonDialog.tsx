'use client';

import { useMemo, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, ClipboardCopy, FileText, Image as ImageIcon, Loader2, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { deleteUpload, useR2Upload } from '@/lib/useR2Upload';
import { SKILLS } from '@/lib/skills';
import { MEDIA_MAX_BYTES, buildBlocks, extractJson, flattenTypes, validateLesson } from '@/lib/lessonImport';
import type { BlockInstance, LessonFields, MediaKind } from '@/lib/lessonImport';

export interface ImportResult {
  /** Blocks for the Contenido tab (inserted at the "+" position). */
  content: BlockInstance[];
  /** Questions for the Evaluación tab (appended). */
  quiz: BlockInstance[];
  fields: LessonFields;
}

interface ImportLessonDialogProps {
  onClose: () => void;
  /** Insert the blocks into the lesson; returns the lesson fields that were filled in (for the summary). */
  onApply: (result: ImportResult) => string[];
}

// Match file names ignoring case and accent composition (macOS decomposes accents).
const norm = (s: string) => s.normalize('NFC').toLowerCase();
const isJsonFile = (f: File) => /\.json$/i.test(f.name);

const FIELD_LABELS: Record<string, string> = {
  title: 'título',
  description: 'descripción',
  skill_type: 'skills',
  duration_minutes: 'duración',
  author: 'autor',
};

const KIND_LABEL: Record<MediaKind, string> = { image: 'imagen', audio: 'audio', video: 'video', file: 'documento' };
const ACTIVITY_TYPES = [
  'quiz', 'multi-choice', 'true-false', 'fill-blank', 'short-answer', 'ordering', 'matching',
  'classification', 'swipe', 'essay', 'flashcards', 'image-hotspot', 'image-labeling',
];

const mb = (bytes: number) => `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

function countTypes(types: string[]): string {
  const counts = new Map<string, number>();
  for (const t of types) counts.set(t, (counts.get(t) ?? 0) + 1);
  return [...counts].map(([t, n]) => (n > 1 ? `${t} ×${n}` : t)).join(', ');
}

/** What the person should look at in the page after importing. */
function verificationNotes(types: string[], quizTypes: string[], quizCount: number): string[] {
  const has = (t: string) => types.includes(t) || quizTypes.includes(t);
  const notes: string[] = [];
  if (has('image-hotspot') || has('image-labeling')) {
    notes.push('Revisa la posición de las zonas y los puntos sobre las imágenes (hotspot / etiquetado): las coordenadas son aproximadas.');
  }
  if (has('video') || has('embed')) notes.push('Comprueba que el video o la incrustación se ven (algunos sitios bloquean ser incrustados).');
  if (has('audio')) notes.push('Reproduce el audio.');
  if (has('file')) notes.push('Abre el documento o PDF.');
  if (types.some((t) => ACTIVITY_TYPES.includes(t))) {
    notes.push('Prueba las actividades como estudiante: responde bien y mal para ver el resultado.');
    if (quizCount === 0) notes.push('Las actividades del Contenido son práctica libre y no puntúan; lo que puntúa va en Evaluación.');
  }
  if (quizCount > 0) notes.push(`Abre la pestaña Evaluación: hay ${quizCount} ${quizCount === 1 ? 'bloque' : 'bloques'} (esas preguntas puntúan y cuentan para el examen).`);
  notes.push('Mira la vista previa de la lección completa.');
  return notes;
}

export function ImportLessonDialog({ onClose, onApply }: ImportLessonDialogProps) {
  const { upload, progress: filePct, error: uploadError } = useR2Upload();
  const fileInput = useRef<HTMLInputElement>(null);

  const [jsonText, setJsonText] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number; current: string } | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [copied, setCopied] = useState(false);
  const [finished, setFinished] = useState<{ blocks: number; quiz: number; fields: string[]; notes: string[] } | null>(null);

  const fileByName = useMemo(() => {
    const m = new Map<string, File>();
    for (const f of files) if (!m.has(norm(f.name))) m.set(norm(f.name), f);
    return m;
  }, [files]);

  // Live validation doubles as the preview: errors, or a summary of what will be inserted.
  const check = useMemo(() => {
    if (!jsonText.trim()) return null;
    const parsed = extractJson(jsonText);
    if (parsed.error) return { errors: [parsed.error], fileErrors: [] as string[] };
    const lesson = validateLesson(parsed.value, { skills: SKILLS, mode: 'editor' });
    if (!lesson.fields || !lesson.content) return { errors: lesson.errors, fileErrors: [] as string[] };

    const errors: string[] = [];
    const referenced = new Map<string, MediaKind>();
    const ctx = { errors, files: referenced, resolveFile: (f: string) => f, newId: () => 'preview' };
    const content = buildBlocks(lesson.content, ctx, 'content');
    const quiz = lesson.quiz ? buildBlocks(lesson.quiz, ctx, 'quiz') : [];
    if (errors.length) return { errors, fileErrors: [] as string[] };

    const media = [...referenced].map(([name, kind]) => {
      const f = fileByName.get(norm(name));
      return { name, kind, found: !!f, tooBig: !!f && f.size > MEDIA_MAX_BYTES[kind], size: f?.size ?? 0 };
    });
    const fileErrors = [
      ...media.filter((m) => !m.found).map((m) => `Falta elegir el archivo "${m.name}" (${KIND_LABEL[m.kind]}).`),
      ...media.filter((m) => m.tooBig).map((m) => `"${m.name}" pesa ${mb(m.size)} y el máximo para ${KIND_LABEL[m.kind]} es ${mb(MEDIA_MAX_BYTES[m.kind])}.`),
    ];
    const used = new Set(media.map((m) => norm(m.name)));
    const unused = files.filter((f) => !isJsonFile(f) && !used.has(norm(f.name))).map((f) => f.name);

    return {
      errors,
      fileErrors,
      fields: lesson.fields,
      rawContent: lesson.content,
      rawQuiz: lesson.quiz,
      media,
      unused,
      types: flattenTypes(content),
      quizTypes: flattenTypes(quiz),
      quizCount: quiz.length,
    };
  }, [jsonText, fileByName, files]);

  const jsonErrors = check?.errors ?? [];
  const fileErrors = check?.fileErrors ?? [];
  const canInsert = !!check && !!check.rawContent && jsonErrors.length === 0 && fileErrors.length === 0 && !busy && !finished;

  const addFiles = async (list: FileList | File[] | null) => {
    if (!list) return;
    const picked = [...list];
    const json = picked.find(isJsonFile);
    if (json) setJsonText(await json.text());
    const media = picked.filter((f) => !isJsonFile(f));
    if (media.length) {
      setFiles((prev) => {
        const seen = new Set(prev.map((f) => `${norm(f.name)}:${f.size}`));
        return [...prev, ...media.filter((f) => !seen.has(`${norm(f.name)}:${f.size}`))];
      });
    }
    if (fileInput.current) fileInput.current.value = '';
  };

  const copyErrors = async () => {
    const lines = [
      'Corrige el JSON de la lección. El importador de Dialektoz encontró estos problemas:',
      '',
      ...jsonErrors.map((e) => `- ${e}`),
      ...fileErrors.map((e) => `- ${e}`),
      '',
      'Devuélveme el JSON COMPLETO corregido en un solo bloque de código (y avísame si cambia algún nombre de archivo).',
    ];
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard blocked: the errors are visible on screen, so they can still be copied by hand.
    }
  };

  const handleInsert = async () => {
    if (!check || !check.rawContent || !check.fields || !canInsert) return;
    setBusy(true);
    setFailure(null);

    const urlByName = new Map<string, string>();
    const uploaded: string[] = [];
    const names = (check.media ?? []).map((m) => m.name);

    for (let i = 0; i < names.length; i++) {
      setProgress({ done: i, total: names.length, current: names[i] });
      const file = fileByName.get(norm(names[i]));
      const url = file ? await upload(file, 'lessons') : null;
      if (!url) {
        await Promise.all(uploaded.map((u) => deleteUpload(u)));
        setFailure(`No se pudo subir "${names[i]}". No se insertó nada.`);
        setBusy(false);
        setProgress(null);
        return;
      }
      urlByName.set(names[i], url);
      uploaded.push(url);
    }

    const errors: string[] = [];
    const ctx = {
      errors,
      files: new Map<string, MediaKind>(),
      resolveFile: (f: string) => urlByName.get(f) ?? '',
      newId: () => crypto.randomUUID(),
    };
    const content = buildBlocks(check.rawContent, ctx, 'content');
    const quiz = check.rawQuiz ? buildBlocks(check.rawQuiz, ctx, 'quiz') : [];
    if (errors.length) {
      await Promise.all(uploaded.map((u) => deleteUpload(u)));
      setFailure(errors.join(' '));
      setBusy(false);
      setProgress(null);
      return;
    }

    const filled = onApply({ content, quiz, fields: check.fields });
    setFinished({
      blocks: content.length,
      quiz: quiz.length,
      fields: filled,
      notes: verificationNotes(flattenTypes(content), flattenTypes(quiz), quiz.length),
    });
    setBusy(false);
    setProgress(null);
  };

  const close = () => {
    if (!busy) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={close}>
      <div
        className={`bg-card border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden ${dragging ? 'border-primary' : 'border-border'}`}
        onClick={(e) => e.stopPropagation()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (!busy && !finished) addFiles(e.dataTransfer.files);
        }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2.5 font-bold">
            <div className="bg-primary/10 text-primary p-1.5 rounded-md">
              <Upload className="w-4 h-4" />
            </div>
            Importar desde JSON
          </div>
          <button type="button" onClick={close} aria-label="Cerrar" className="text-muted-foreground hover:text-foreground cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-4">
          {finished ? (
            <>
              <div className="flex items-start gap-3 rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-600">
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">
                    Listo: {finished.blocks} {finished.blocks === 1 ? 'bloque' : 'bloques'} en Contenido
                    {finished.quiz > 0 ? ` y ${finished.quiz} en Evaluación` : ''}.
                  </p>
                  <p className="mt-1">
                    {finished.fields.length
                      ? `Se completaron los campos vacíos: ${finished.fields.map((f) => FIELD_LABELS[f] ?? f).join(', ')}.`
                      : 'Ningún campo de la lección se modificó.'}
                  </p>
                  <p className="mt-1 text-foreground/60">Se guarda solo con el autoguardado. Para deshacerlo, borra los bloques.</p>
                </div>
              </div>
              <div className="rounded-xl border border-border bg-muted/20 p-4 text-sm">
                <p className="font-bold mb-2">Qué revisar ahora en la página</p>
                <ul className="space-y-1.5">
                  {finished.notes.map((n) => (
                    <li key={n} className="flex items-start gap-2 text-foreground/80">
                      <span className="mt-0.5 text-primary">☐</span>
                      {n}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Pega lo que te dio el chat (con o sin texto alrededor) y elige o arrastra aquí los archivos que usa (imágenes, audio,
                video, PDF). Los bloques se insertan en la lección que estás editando; las preguntas de <code>quiz</code> van a
                Evaluación.
              </p>

              <div className="flex flex-wrap items-center gap-2">
                <input
                  ref={fileInput}
                  type="file"
                  multiple
                  accept=".json,image/*,audio/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip"
                  className="hidden"
                  onChange={(e) => addFiles(e.target.files)}
                />
                <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => fileInput.current?.click()} disabled={busy}>
                  <FileText className="w-4 h-4" /> Elegir archivos
                </Button>
                {files.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setFiles([])}
                    disabled={busy}
                    className="text-xs text-muted-foreground hover:text-foreground underline cursor-pointer"
                  >
                    Quitar archivos ({files.length})
                  </button>
                )}
              </div>

              <textarea
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                disabled={busy}
                spellCheck={false}
                rows={9}
                placeholder="Pega aquí la respuesta del chat con el JSON de la lección…"
                className="w-full rounded-xl border border-border bg-background p-3 font-mono text-xs text-foreground outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              />

              {(jsonErrors.length > 0 || fileErrors.length > 0) && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                  <p className="flex items-center gap-2 font-bold">
                    <AlertTriangle className="w-4 h-4" /> Corrige esto antes de importar
                  </p>
                  <ul className="mt-2 list-disc pl-5 space-y-1">
                    {[...jsonErrors, ...fileErrors].map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                  <Button type="button" variant="outline" size="sm" className="mt-3 gap-2 border-destructive/40 text-destructive hover:bg-destructive/10" onClick={copyErrors}>
                    <ClipboardCopy className="w-4 h-4" />
                    {copied ? 'Copiado: pégalo en el chat' : 'Copiar errores para el chat'}
                  </Button>
                </div>
              )}

              {check && check.rawContent && jsonErrors.length === 0 && (
                <div className="rounded-xl border border-border bg-muted/20 p-4 text-sm space-y-2">
                  <p className="font-bold">
                    Contenido: {check.types?.length} {check.types?.length === 1 ? 'bloque' : 'bloques'}
                    <span className="font-normal text-muted-foreground"> ({countTypes(check.types ?? [])})</span>
                  </p>
                  {(check.quizCount ?? 0) > 0 && (
                    <p className="font-bold">
                      Evaluación: {check.quizCount} {check.quizCount === 1 ? 'bloque' : 'bloques'}
                      <span className="font-normal text-muted-foreground"> ({countTypes(check.quizTypes ?? [])})</span>
                    </p>
                  )}
                  {check.media && check.media.length > 0 && (
                    <ul className="space-y-1">
                      {check.media.map((m) => {
                        const ok = m.found && !m.tooBig;
                        return (
                          <li key={m.name} className={`flex items-center gap-2 ${ok ? 'text-foreground/80' : 'text-destructive font-semibold'}`}>
                            <ImageIcon className="w-4 h-4 shrink-0" />
                            {m.name}
                            <span className="text-xs text-muted-foreground">({KIND_LABEL[m.kind]}{m.found ? `, ${mb(m.size)}` : ''})</span>
                            {!m.found && <span className="text-xs">— falta elegir este archivo</span>}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  {check.unused && check.unused.length > 0 && (
                    <p className="text-xs text-amber-600">
                      Archivos elegidos que el JSON no usa (no se subirán): {check.unused.join(', ')}.
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Los campos de la lección (título, descripción, skills, duración, autor) solo se completan si están vacíos.
                  </p>
                </div>
              )}

              {(failure || uploadError) && !busy && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  {failure ?? uploadError}
                  {failure && uploadError ? ` (${uploadError})` : ''}
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-border">
          <span className="text-xs text-muted-foreground truncate">
            {progress ? `Subiendo ${progress.done + 1}/${progress.total}: ${progress.current} (${filePct}%)` : ''}
          </span>
          <div className="flex gap-2 shrink-0">
            <Button type="button" variant="ghost" onClick={close} disabled={busy}>
              {finished ? 'Cerrar' : 'Cancelar'}
            </Button>
            {!finished && (
              <Button type="button" onClick={handleInsert} disabled={!canInsert} className="gap-2">
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {busy ? 'Importando…' : 'Insertar en la lección'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
