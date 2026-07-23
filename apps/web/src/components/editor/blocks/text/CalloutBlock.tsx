'use client';

import { Info, AlertTriangle, CheckCircle2, XCircle, Lightbulb } from 'lucide-react';
import { defineBlock } from '../types';

type CalloutVariant = 'info' | 'warning' | 'success' | 'danger' | 'tip';

export interface CalloutData {
  text: string;
  variant: CalloutVariant;
}

const variants: Record<CalloutVariant, { icon: typeof Info; box: string; accent: string; label: string }> = {
  info: { icon: Info, box: 'border-blue-500/30 bg-blue-500/5', accent: 'text-blue-500', label: 'Info' },
  warning: { icon: AlertTriangle, box: 'border-amber-500/30 bg-amber-500/5', accent: 'text-amber-500', label: 'Aviso' },
  success: { icon: CheckCircle2, box: 'border-green-500/30 bg-green-500/5', accent: 'text-green-500', label: 'Éxito' },
  danger: { icon: XCircle, box: 'border-red-500/30 bg-red-500/5', accent: 'text-red-500', label: 'Importante' },
  tip: { icon: Lightbulb, box: 'border-primary/30 bg-primary/5', accent: 'text-primary', label: 'Tip' },
};

export const CalloutBlock = defineBlock<CalloutData>({
  type: 'callout',
  label: 'Llamado de atención',
  description: 'Caja destacada (info, aviso, tip…)',
  icon: Lightbulb,
  category: 'text',
  keywords: ['callout', 'nota', 'aviso', 'destacado', 'alerta'],
  createDefault: () => ({ text: '', variant: 'info' }),
  Editor: ({ data, onChange }) => {
    const v = variants[data.variant];
    const Icon = v.icon;
    return (
      <div className={`rounded-xl border p-4 ${v.box}`}>
        <div className="flex items-center gap-2 mb-3">
          <Icon className={`w-4 h-4 ${v.accent}`} />
          <div className="flex gap-1">
            {(Object.keys(variants) as CalloutVariant[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => onChange({ ...data, variant: key })}
                className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full transition-colors ${
                  data.variant === key ? `${variants[key].accent} bg-background` : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {variants[key].label}
              </button>
            ))}
          </div>
        </div>
        <textarea
          rows={2}
          value={data.text}
          onChange={(e) => onChange({ ...data, text: e.target.value })}
          placeholder="Escribe el mensaje destacado…"
          className="w-full bg-transparent outline-none resize-none text-foreground placeholder:text-muted-foreground/50"
        />
      </div>
    );
  },
  Renderer: ({ data }) => {
    const v = variants[data.variant];
    const Icon = v.icon;
    return (
      <div className={`my-6 rounded-xl border p-4 flex gap-3 ${v.box}`}>
        <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${v.accent}`} />
        <p className="text-foreground/90 leading-relaxed whitespace-pre-wrap">{data.text}</p>
      </div>
    );
  },
});
