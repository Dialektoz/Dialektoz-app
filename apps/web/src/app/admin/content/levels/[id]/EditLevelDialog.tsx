'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';
import { UploadDropzone } from '@/components/editor/UploadDropzone';
import { deleteUpload } from '@/lib/useR2Upload';
import { Pencil, Loader2, X } from 'lucide-react';

interface EditLevelDialogProps {
  level: {
    id: string;
    code: string;
    title: string;
    description: string | null;
    order_index: number | null;
    icon_url: string | null;
  };
}

const CODES = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export default function EditLevelDialog({ level }: EditLevelDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isCustom, setIsCustom] = useState(!CODES.includes(level.code));
  const [form, setForm] = useState({
    code: level.code,
    title: level.title,
    description: level.description ?? '',
    order_index: level.order_index ?? 0,
    icon_url: level.icon_url ?? '',
  });

  const save = async () => {
    if (!form.title.trim()) {
      alert('El título es obligatorio.');
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from('levels')
      .update({
        code: form.code.toUpperCase().trim(),
        title: form.title.trim(),
        description: form.description.trim() || null,
        order_index: Number(form.order_index) || 0,
        icon_url: form.icon_url || null,
      })
      .eq('id', level.id);
    setSaving(false);

    if (error) {
      if (error.code === '23505') alert(`Ya existe un nivel con el código "${form.code}".`);
      else alert('Error al guardar: ' + error.message);
      return;
    }
    // Cleanup: if the cover was removed or replaced, delete the old one from R2.
    if (level.icon_url && level.icon_url !== form.icon_url) {
      void deleteUpload(level.icon_url);
    }
    setOpen(false);
    // URL is the level UUID (stable), so a code change needs no redirect.
    router.refresh();
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="gap-1.5">
        <Pencil className="w-3.5 h-3.5" /> Editar
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setOpen(false)}>
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold">Editar Nivel</h2>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Código</label>
                  <select
                    value={isCustom ? '__custom__' : form.code}
                    onChange={(e) => {
                      if (e.target.value === '__custom__') { setIsCustom(true); setForm({ ...form, code: '' }); }
                      else { setIsCustom(false); setForm({ ...form, code: e.target.value }); }
                    }}
                    className="w-full bg-background border border-border p-2.5 rounded-lg outline-none focus:border-primary font-bold text-lg cursor-pointer"
                  >
                    {CODES.map((c) => <option key={c} value={c}>{c}</option>)}
                    <option value="__custom__">Otro…</option>
                  </select>
                  {isCustom && (
                    <input
                      value={form.code}
                      onChange={(e) => setForm({ ...form, code: e.target.value })}
                      placeholder="Personalizado"
                      maxLength={12}
                      className="w-full mt-2 bg-background border border-border p-2.5 rounded-lg outline-none focus:border-primary font-bold uppercase"
                    />
                  )}
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Título</label>
                  <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full bg-background border border-border p-2.5 rounded-lg outline-none focus:border-primary font-semibold" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Descripción</label>
                <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full bg-background border border-border p-3 rounded-lg outline-none focus:border-primary resize-none" />
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Portada / Ícono</label>
                {form.icon_url ? (
                  <div className="flex items-center gap-4 rounded-xl border border-border bg-muted/10 p-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={form.icon_url} alt="Portada" className="w-20 h-20 rounded-lg object-cover border border-border" />
                    <button type="button" onClick={() => setForm({ ...form, icon_url: '' })} className="text-sm text-muted-foreground hover:text-destructive">
                      Quitar imagen
                    </button>
                  </div>
                ) : (
                  <UploadDropzone accept="image/*" folder="levels" label="Sube una portada" onUploaded={(url) => setForm((f) => ({ ...f, icon_url: url }))} />
                )}
              </div>

              <div className="w-32">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Orden</label>
                <input type="number" value={form.order_index} onChange={(e) => setForm({ ...form, order_index: Number(e.target.value) })} className="w-full bg-background border border-border p-2.5 rounded-lg outline-none focus:border-primary" />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-border/50">
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={save} disabled={saving} className="gap-2 min-w-[120px]">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {saving ? 'Guardando…' : 'Guardar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
