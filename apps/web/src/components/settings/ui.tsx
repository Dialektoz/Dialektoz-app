// Shared look of the settings page (cards, collapsible cards, labeled fields, inputs).
import { ChevronDown } from 'lucide-react';

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
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 md:p-6">
      <h2 className="font-bold text-lg mb-1">{title}</h2>
      {subtitle && <p className="text-sm text-foreground/50 mb-4">{subtitle}</p>}
      {children}
    </section>
  );
}

/**
 * A card that opens and closes. Native <details>: keyboard/screen-reader friendly, no JS, and the
 * content stays mounted while closed, so half-typed forms aren't lost. `summary` is the one-liner
 * shown under the title while it's closed. `danger` only colors the title and border (the strong
 * red is kept for the confirmation modal).
 */
export function Collapsible({
  title,
  summary,
  defaultOpen = false,
  danger = false,
  children,
}: {
  title: string;
  summary?: string;
  defaultOpen?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details
      open={defaultOpen}
      className={`group rounded-2xl border bg-card ${danger ? 'border-destructive/30' : 'border-border'}`}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-5 md:p-6 [&::-webkit-details-marker]:hidden">
        <div className="min-w-0">
          <h2 className={`font-bold text-lg ${danger ? 'text-destructive' : ''}`}>{title}</h2>
          {summary && <p className="text-sm text-foreground/50 truncate">{summary}</p>}
        </div>
        <ChevronDown
          className={`size-5 shrink-0 transition-transform group-open:rotate-180 ${danger ? 'text-destructive' : 'text-foreground/50'}`}
        />
      </summary>
      <div className="px-5 pb-5 md:px-6 md:pb-6">{children}</div>
    </details>
  );
}
