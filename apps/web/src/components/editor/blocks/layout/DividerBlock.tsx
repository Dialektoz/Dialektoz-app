'use client';

import { Minus } from 'lucide-react';
import { defineBlock } from '../types';

export type DividerData = Record<string, never>;

export const DividerBlock = defineBlock<DividerData>({
  type: 'divider',
  label: 'Separador',
  description: 'Línea divisoria horizontal',
  icon: Minus,
  category: 'layout',
  keywords: ['separador', 'divider', 'linea', 'hr'],
  createDefault: () => ({}),
  Editor: () => (
    <div className="py-3">
      <div className="border-t-2 border-dashed border-border" />
    </div>
  ),
  Renderer: () => <hr className="my-8 border-border" />,
});
