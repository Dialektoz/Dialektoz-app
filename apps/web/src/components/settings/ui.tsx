// Shared look of the settings page (cards, labeled fields, inputs).

export const inputClass =
  'w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors';

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-xs text-foreground/40 mt-1">{hint}</p>}
    </div>
  );
}

export function Card({
  title,
  subtitle,
  danger = false,
  children,
}: {
  title: string;
  subtitle?: string;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`rounded-2xl border p-5 md:p-6 ${danger ? 'border-destructive/40 bg-destructive/5' : 'border-border bg-card'}`}
    >
      <h2 className={`font-bold text-lg mb-1 ${danger ? 'text-destructive' : ''}`}>{title}</h2>
      {subtitle && <p className="text-sm text-foreground/50 mb-4">{subtitle}</p>}
      {children}
    </section>
  );
}
