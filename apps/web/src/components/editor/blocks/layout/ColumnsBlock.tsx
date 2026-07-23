'use client';

import { Columns3 } from 'lucide-react';
import { defineBlock } from '../types';
import type { BlockInstance } from '../types';
import { BlockCanvas } from '../../BlockCanvas';
import { BlockList } from '../BlockList';

export interface ColumnsData {
  columns: BlockInstance[][];
}

// Static classes so Tailwind keeps them in the build.
const colsClass: Record<number, string> = {
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-3',
  4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
};

export const ColumnsBlock = defineBlock<ColumnsData>({
  type: 'columns',
  label: 'Columnas',
  description: 'Layout de 2–4 columnas con bloques dentro',
  icon: Columns3,
  category: 'layout',
  keywords: ['columnas', 'columns', 'layout', 'grid', 'contenedor', 'seccion'],
  createDefault: () => ({ columns: [[], []] }),
  Editor: ({ data, onChange }) => {
    const count = data.columns.length;
    const setColumnCount = (n: number) => {
      if (n === count) return;
      let columns = [...data.columns];
      if (n > count) {
        for (let i = count; i < n; i++) columns.push([]);
      } else {
        // Merge trimmed columns' blocks into the last kept column.
        const kept = columns.slice(0, n);
        const overflow = columns.slice(n).flat();
        kept[n - 1] = [...kept[n - 1], ...overflow];
        columns = kept;
      }
      onChange({ columns });
    };
    const setColumn = (i: number, blocks: BlockInstance[]) =>
      onChange({ columns: data.columns.map((c, idx) => (idx === i ? blocks : c)) });

    return (
      <div className="rounded-2xl border border-border bg-muted/10 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-muted-foreground font-bold text-xs uppercase tracking-wide">
            <Columns3 className="w-4 h-4" /> Columnas
          </div>
          <div className="flex items-center gap-1">
            {[2, 3, 4].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setColumnCount(n)}
                className={`w-7 h-7 rounded-md text-xs font-bold transition-colors ${count === n ? 'bg-primary text-primary-foreground' : 'bg-background border border-border text-muted-foreground hover:text-foreground'}`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}>
          {data.columns.map((col, i) => (
            <div key={i} className="rounded-xl border border-dashed border-border bg-background/40 p-2 min-w-0">
              <BlockCanvas blocks={col} onChange={(b) => setColumn(i, b)} nested emptyLabel="Bloque" />
            </div>
          ))}
        </div>
      </div>
    );
  },
  Renderer: ({ data }) => (
    <div className={`my-6 grid gap-5 md:gap-6 ${colsClass[data.columns.length] ?? 'grid-cols-1 md:grid-cols-2'}`}>
      {data.columns.map((col, i) => (
        <div key={i} className="min-w-0">
          <BlockList blocks={col} />
        </div>
      ))}
    </div>
  ),
});
