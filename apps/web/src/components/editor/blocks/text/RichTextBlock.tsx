'use client';

import type { JSONContent } from '@tiptap/react';
import { FileText } from 'lucide-react';
import { defineBlock } from '../types';
import { RichTextEditor } from '../../RichTextEditor';
import { RichText } from '../RichText';

export interface RichTextData {
  doc: JSONContent;
}

const emptyDoc = (): JSONContent => ({ type: 'doc', content: [{ type: 'paragraph' }] });

export const RichTextBlock = defineBlock<RichTextData>({
  type: 'text',
  label: 'Texto',
  description: 'Párrafo con formato enriquecido',
  icon: FileText,
  category: 'text',
  keywords: ['texto', 'parrafo', 'rich text', 'negrita', 'lista'],
  createDefault: () => ({ doc: emptyDoc() }),
  Editor: ({ data, onChange }) => (
    <div className="min-h-[100px]">
      <RichTextEditor content={data.doc ?? emptyDoc()} onChange={(doc) => onChange({ doc })} />
    </div>
  ),
  Renderer: ({ data }) => (
    <div className="max-w-none">
      <RichText content={data.doc} />
    </div>
  ),
});
