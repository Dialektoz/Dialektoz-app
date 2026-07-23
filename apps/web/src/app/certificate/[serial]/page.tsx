import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { cefrLabel } from '@/lib/learning';
import { Award, ShieldCheck, Clock, CheckCircle2, ArrowLeft } from 'lucide-react';

interface CertificateRow {
  serial: string;
  holder_name: string | null;
  level_code: string;
  level_title: string;
  description: string | null;
  hours: number;
  score: number;
  issued_at: string;
}

export async function generateMetadata({ params }: { params: Promise<{ serial: string }> }) {
  const { serial } = await params;
  return {
    title: `Certificado ${serial.toUpperCase()} | Dialektoz`,
    description: 'Certificado de nivel de inglés verificado por Dialektoz',
  };
}

/**
 * Public certificate page — no session required. Reads through the
 * verify_certificate() function so the certificates table stays closed.
 */
export default async function CertificatePage({ params }: { params: Promise<{ serial: string }> }) {
  const { serial } = await params;
  const supabase = await createClient();

  const { data } = await supabase.rpc('verify_certificate', { p_serial: serial });
  const rows = (data as CertificateRow[] | null) ?? [];
  const cert = rows[0];
  if (!cert) notFound();

  const issued = new Date(cert.issued_at).toLocaleDateString('es', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="min-h-[100dvh] bg-background py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <Link href="/certification" className="inline-flex items-center gap-2 text-sm font-semibold text-foreground/60 hover:text-foreground mb-6">
          <ArrowLeft className="size-4" /> Volver
        </Link>

        {/* Certificate */}
        <article className="relative rounded-3xl border-2 border-primary/30 bg-card overflow-hidden shadow-2xl">
          <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-primary via-accent to-primary" />

          <div className="p-8 md:p-12 text-center">
            <div className="size-16 rounded-2xl bg-primary/15 text-primary flex items-center justify-center mx-auto mb-6">
              <Award className="size-8" />
            </div>

            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-foreground/50 mb-2">
              Certificado de nivel
            </p>
            <h1 className="text-4xl md:text-5xl font-black text-primary mb-1">{cert.level_code}</h1>
            <p className="text-lg font-semibold text-foreground mb-8">{cefrLabel(cert.level_code)}</p>

            <p className="text-sm text-foreground/50 mb-1">Otorgado a</p>
            <p className="text-2xl md:text-3xl font-bold text-foreground mb-8">
              {cert.holder_name || 'Estudiante'}
            </p>

            <p className="text-base font-semibold text-foreground mb-2">{cert.level_title}</p>
            {cert.description && (
              <p className="text-sm text-foreground/60 max-w-xl mx-auto mb-8 leading-relaxed">{cert.description}</p>
            )}

            <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto mb-8">
              <Fact icon={<Clock className="size-4" />} label="Horas" value={`${cert.hours}`} />
              <Fact icon={<CheckCircle2 className="size-4" />} label="Nota" value={`${cert.score}%`} />
              <Fact icon={<ShieldCheck className="size-4" />} label="Emitido" value={issued} />
            </div>

            <div className="pt-6 border-t border-border/60">
              <p className="text-[11px] uppercase tracking-wider text-foreground/40 mb-1">Código de verificación</p>
              <p className="font-mono font-bold text-lg text-foreground tracking-wider">{cert.serial}</p>
            </div>
          </div>
        </article>

        <p className="text-center text-sm text-foreground/50 mt-6 flex items-center justify-center gap-2">
          <ShieldCheck className="size-4 text-green-600" />
          Certificado verificado — esta página es la prueba pública de autenticidad.
        </p>
      </div>
    </div>
  );
}

function Fact({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-background p-3">
      <span className="flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-foreground/50 mb-1">
        {icon} {label}
      </span>
      <span className="block text-sm font-bold text-foreground">{value}</span>
    </div>
  );
}
