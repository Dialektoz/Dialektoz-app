'use client';

import { useMemo, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, FileText, Image as ImageIcon, Loader2, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { deleteUpload, useR2Upload } from '@/lib/useR2Upload';
import { SKILLS } from '@/lib/skills';
import { buildBlocks, validateLesson } from '@/lib/lessonImport';
import type { BlockInstance, LessonFields } from '@/lib/lessonImport';

export interface ImportResult {
  blocks: BlockInstance[];
  fields: LessonFields;
}

interface ImportLessonDialogProps {
  onClose: () => void;
  /** Insert the blocks into the lesson; returns the lesson fields that were filled in (for the summary). */
  onApply: (result: ImportResult) => string[];
}

// Match file names ignoring case and accent composition (macOS decomposes accents).
const norm = (s: string) => s.normalize('NFC').toLowerCase();

const FIELD_LABELS: Record<string, string> = {
  title: 'título',
  description: 'descripción',
  skill_type: 'skills',
  duration_minutes: 'duración',
  author: 'autor',
};

export function ImportLessonDialog({ onClose, onApply }: ImportLessonDialogProps) {
  const { upload, error: uploadError } = useR2Upload();
  const fileInput = useRef<HTMLInputElement>(null);

  const [jsonText, setJsonText] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [filled, setFilled] = useState<{ blocks: number; fields: string[] } | null>(null);

  const fileByName = useMemo(() => {
    const m = new Map<string, File>();
    for (const f of images) if (!m.has(norm(f.name))) m.set(norm(f.name), f);
    return m;
  }, [images]);

  // Live validation doubles as the preview: errors, or a summary of what will be inserted.
  const check = useMemo(() => {
    if (!jsonText.trim()) return null;
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonText);
    } catch (e) {
      return { errors: [`JSON no válido: ${(e as Error).message}`] };
    }
    const lesson = validateLesson(parsed, { skills: SKILLS, mode: 'editor' });
    if (!lesson.fields || !lesson.content) return { errors: lesson.errors };

    const errors: string[] = [];
    const referenced = new Set<string>();
    const blocks = buildBlocks(lesson.content, {
      errors,
      images: referenced,
      resolveImage: (f) => f,
      newId: () => 'preview',
    });
    if (errors.length) return { errors };

    const names = [...referenced];
    return {
      errors,
      fields: lesson.fields,
      content: lesson.content,
      blockTypes: blocks.map((b) => b.type),
      images: names.map((name) => ({ name, found: fileByName.has(norm(name)) })),
    };
  }, [jsonText, fileByName]);

  const missing = check?.images?.filter((i) => !i.found) ?? [];
  const canInsert = !!check && check.errors.length === 0 && missing.length === 0 && !busy && !filled;

  const handlePick = async (list: FileList | null) => {
    if (!list) return;
    const files = [...list];
    const json = files.find((f) => /\.json$/i.test(f.name));
    if (json) setJsonText(await json.text());
    const imgs = files.filter((f) => !/\.json$/i.test(f.name));
    if (imgs.length) setImages((prev) => [...prev, ...imgs]);
    if (fileInput.current) fileInput.current.value = '';
  };

  const handleInsert = async () => {
    if (!check || !check.content || !check.fields || !canInsert) return;
    setBusy(true);
    setFailure(null);

    const urlByName = new Map<string, string>();
    const uploaded: string[] = [];
    const names = (check.images ?? []).map((i) => i.name);
    setProgress({ done: 0, total: names.length });

    for (const name of names) {
      const file = fileByName.get(norm(name));
      const url = file ? await upload(file, 'lessons') : null;
      if (!url) {
        await Promise.all(uploaded.map((u) => deleteUpload(u)));
        setFailure(`No se pudo subir "${name}". No se insertó nada.`);
        setBusy(false);
        setProgress(null);
        return;
      }
      urlByName.set(name, url);
      uploaded.push(url);
      setProgress({ done: uploaded.length, total: names.length });
    }

    const errors: string[] = [];
    const blocks = buildBlocks(check.content, {
      errors,
      images: new Set<string>(),
      resolveImage: (f) => urlByName.get(f) ?? '',
      newId: () => crypto.randomUUID(),
    });
    if (errors.length) {
      await Promise.all(uploaded.map((u) => deleteUpload(u)));
      setFailure(errors.join(' '));
      setBusy(false);
      setProgress(null);
      return;
    }

    const fields = onApply({ blocks, fields: check.fields });
    setFilled({ blocks: blocks.length, fields });
    setBusy(false);
    setProgress(null);
  };

  const close = () => {
    if (!busy) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={close}>
      <div
        className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[88vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
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
          {filled ? (
            <div className="flex items-start gap-3 rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-600">
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">
                  Listo: {filled.blocks} {filled.blocks === 1 ? 'bloque insertado' : 'bloques insertados'}.
                </p>
                <p className="mt-1">
                  {filled.fields.length
                    ? `Se completaron los campos vacíos: ${filled.fields.map((f) => FIELD_LABELS[f] ?? f).join(', ')}.`
                    : 'Ningún campo de la lección se modificó.'}
                </p>
                <p className="mt-1 text-foreground/60">Se guardará solo con el autoguardado. Para deshacerlo, borra los bloques.</p>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Pega un <code>lesson.json</code> (o solo una lista de bloques) y elige las imágenes que usa. Los bloques se
                insertan en la lección que estás editando. Detalles del formato en <code>scripts/import-lesson/README.md</code>.
              </p>

              <div className="flex flex-wrap items-center gap-2">
                <input
                  ref={fileInput}
                  type="file"
                  multiple
                  accept=".json,image/png,image/jpeg,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => handlePick(e.target.files)}
                />
                <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => fileInput.current?.click()} disabled={busy}>
                  <FileText className="w-4 h-4" /> Elegir archivos (JSON e imágenes)
                </Button>
                {images.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setImages([])}
                    disabled={busy}
                    className="text-xs text-muted-foreground hover:text-foreground underline cursor-pointer"
                  >
                    Quitar imágenes ({images.length})
                  </button>
                )}
              </div>

              <textarea
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                disabled={busy}
                spellCheck={false}
                rows={10}
                placeholder='{ "title": "…", "content": [ { "type": "heading", "text": "…" } ] }'
                className="w-full rounded-xl border border-border bg-background p-3 font-mono text-xs text-foreground outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              />

              {check && check.errors.length > 0 && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                  <p className="flex items-center gap-2 font-bold">
                    <AlertTriangle className="w-4 h-4" /> Corrige esto antes de importar
                  </p>
                  <ul className="mt-2 list-disc pl-5 space-y-1">
                    {check.errors.map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                </div>
              )}

              {check && check.errors.length === 0 && (
                <div className="rounded-xl border border-border bg-muted/20 p-4 text-sm space-y-2">
                  <p className="font-bold">
                    {check.blockTypes?.length} {check.blockTypes?.length === 1 ? 'bloque' : 'bloques'}:{' '}
                    <span className="font-normal text-muted-foreground">{check.blockTypes?.join(', ')}</span>
                  </p>
                  {check.images && check.images.length > 0 && (
                    <ul className="space-y-1">
                      {check.images.map((img) => (
                        <li key={img.name} className={`flex items-center gap-2 ${img.found ? 'text-foreground/80' : 'text-destructive font-semibold'}`}>
                          <ImageIcon className="w-4 h-4 shrink-0" />
                          {img.name}
                          {!img.found && <span className="text-xs">— falta elegir este archivo</span>}
                        </li>
                      ))}
                    </ul>
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
          <span className="text-xs text-muted-foreground">
            {progress ? `Subiendo imágenes… ${progress.done}/${progress.total}` : ''}
          </span>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={close} disabled={busy}>
              {filled ? 'Cerrar' : 'Cancelar'}
            </Button>
            {!filled && (
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
