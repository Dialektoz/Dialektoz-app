'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { UploadDropzone } from '@/components/editor/UploadDropzone';
import { Loader2, Check, AlertCircle, KeyRound, Trophy, Globe } from 'lucide-react';

export interface ProfileValues {
  first_name: string;
  last_name: string;
  phone: string;
  display_name: string;
  avatar_url: string | null;
  timezone: string;
  leaderboard_opt_in: boolean;
}

/** Curated list — covers the Spanish-speaking audience without a 400-entry dropdown. */
const TIMEZONES = [
  'America/Bogota',
  'America/Mexico_City',
  'America/Lima',
  'America/Santiago',
  'America/Argentina/Buenos_Aires',
  'America/Caracas',
  'America/Guayaquil',
  'America/La_Paz',
  'America/Montevideo',
  'America/Asuncion',
  'America/Panama',
  'America/Costa_Rica',
  'America/Santo_Domingo',
  'America/New_York',
  'America/Los_Angeles',
  'Europe/Madrid',
  'UTC',
];

export default function SettingsForm({ initial }: { initial: ProfileValues }) {
  const router = useRouter();
  const [form, setForm] = useState<ProfileValues>(initial);
  const [saving, setSaving] = useState(false);
  const [state, setState] = useState<'idle' | 'saved' | 'error'>('idle');
  const [message, setMessage] = useState('');

  // Offer the browser-detected zone even if it is not in the curated list.
  const detected = typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : '';
  const zones = Array.from(new Set([form.timezone, detected, ...TIMEZONES].filter(Boolean)));

  const set = <K extends keyof ProfileValues>(key: K, value: ProfileValues[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const save = async () => {
    setSaving(true);
    setState('idle');
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      setState('error');
      setMessage('Sesión expirada. Vuelve a iniciar sesión.');
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        first_name: form.first_name.trim() || null,
        last_name: form.last_name.trim() || null,
        phone: form.phone.trim() || null,
        display_name: form.display_name.trim() || null,
        avatar_url: form.avatar_url,
        timezone: form.timezone,
        leaderboard_opt_in: form.leaderboard_opt_in,
      })
      .eq('id', user.id);

    setSaving(false);
    if (error) {
      setState('error');
      setMessage(error.message);
      return;
    }
    setState('saved');
    setMessage('Cambios guardados');
    router.refresh();
  };

  return (
    <div className="space-y-5">
      {/* Avatar + identity */}
      <section className="rounded-2xl border border-border bg-card p-5 md:p-6">
        <h2 className="font-bold text-lg mb-1">Tu perfil</h2>
        <p className="text-sm text-foreground/50 mb-5">Cómo te ven en la plataforma.</p>

        <div className="flex flex-col sm:flex-row gap-5">
          <div className="shrink-0 flex flex-col items-center gap-3">
            <div className="size-24 rounded-full overflow-hidden bg-gradient-to-br from-[#dfc8b0] to-[#c79a6d] flex items-center justify-center ring-2 ring-border">
              {form.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-bold text-secondary-foreground/70">
                  {(form.display_name || form.first_name || '?').charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            {form.avatar_url && (
              <button type="button" onClick={() => set('avatar_url', null)} className="text-xs text-muted-foreground hover:text-destructive">
                Quitar foto
              </button>
            )}
          </div>

          <div className="flex-1 min-w-0 space-y-3">
            <UploadDropzone
              accept="image/*"
              folder="avatars"
              label="Sube tu foto de perfil"
              onUploaded={(url) => set('avatar_url', url)}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Nombre">
                <input value={form.first_name} onChange={(e) => set('first_name', e.target.value)} className={inputClass} placeholder="Tu nombre" />
              </Field>
              <Field label="Apellido">
                <input value={form.last_name} onChange={(e) => set('last_name', e.target.value)} className={inputClass} placeholder="Tu apellido" />
              </Field>
            </div>
            <Field label="Teléfono">
              <input value={form.phone} onChange={(e) => set('phone', e.target.value)} className={inputClass} placeholder="Opcional" />
            </Field>
          </div>
        </div>
      </section>

      {/* Public presence */}
      <section className="rounded-2xl border border-border bg-card p-5 md:p-6 space-y-4">
        <div>
          <h2 className="font-bold text-lg mb-1">Clasificación y privacidad</h2>
          <p className="text-sm text-foreground/50">Controla cómo apareces ante otros estudiantes.</p>
        </div>

        <Field label="Nombre visible" hint="Es el nombre que ven los demás en la tabla de clasificación.">
          <input value={form.display_name} onChange={(e) => set('display_name', e.target.value)} className={inputClass} placeholder="Ej: Ferney B." />
        </Field>

        <label className="flex items-start gap-3 rounded-xl border border-border bg-background p-4 cursor-pointer">
          <input
            type="checkbox"
            checked={form.leaderboard_opt_in}
            onChange={(e) => set('leaderboard_opt_in', e.target.checked)}
            className="mt-0.5 size-4 accent-primary"
          />
          <span className="min-w-0">
            <span className="flex items-center gap-2 font-semibold text-sm text-foreground">
              <Trophy className="size-4 text-primary" /> Aparecer en la clasificación
            </span>
            <span className="block text-xs text-foreground/50 mt-0.5">
              Si lo desactivas, tu nombre y tus puntos no se muestran a otros estudiantes. Tu progreso se sigue guardando.
            </span>
          </span>
        </label>
      </section>

      {/* Preferences */}
      <section className="rounded-2xl border border-border bg-card p-5 md:p-6">
        <h2 className="font-bold text-lg mb-1">Preferencias</h2>
        <p className="text-sm text-foreground/50 mb-4">Tu zona horaria define a qué hora cambia el día para tu racha.</p>
        <Field label="Zona horaria">
          <div className="relative">
            <Globe className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select value={form.timezone} onChange={(e) => set('timezone', e.target.value)} className={`${inputClass} pl-9`}>
              {zones.map((z) => (
                <option key={z} value={z}>{z.replace(/_/g, ' ')}{z === detected ? ' (detectada)' : ''}</option>
              ))}
            </select>
          </div>
        </Field>
      </section>

      {/* Security */}
      <section className="rounded-2xl border border-border bg-card p-5 md:p-6">
        <h2 className="font-bold text-lg mb-1">Seguridad</h2>
        <p className="text-sm text-foreground/50 mb-4">Tu correo y tu rol solo pueden cambiarlos los administradores.</p>
        <Link
          href="/change-password"
          className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold hover:bg-muted transition-colors"
        >
          <KeyRound className="size-4" /> Cambiar contraseña
        </Link>
      </section>

      {/* Save bar — sits at the end of the form, not pinned to the viewport */}
      <div className="flex flex-wrap items-center gap-3 pt-2 pb-4">
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-bold px-6 py-2.5 rounded-lg disabled:opacity-50 min-w-[160px] justify-center"
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : null}
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </button>
        {state === 'saved' && (
          <span className="text-sm text-green-600 font-semibold flex items-center gap-1.5"><Check className="size-4" /> {message}</span>
        )}
        {state === 'error' && (
          <span className="text-sm text-destructive font-semibold flex items-center gap-1.5"><AlertCircle className="size-4" /> {message}</span>
        )}
      </div>
    </div>
  );
}

const inputClass =
  'w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors';

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-xs text-foreground/40 mt-1">{hint}</p>}
    </div>
  );
}
