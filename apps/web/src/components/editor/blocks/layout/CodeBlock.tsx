'use client';

import { Code2 } from 'lucide-react';
import { defineBlock } from '../types';

export interface CodeData {
  code: string;
  language: string;
}

export const CodeBlock = defineBlock<CodeData>({
  type: 'code',
  label: 'Código',
  description: 'Bloque de código monoespaciado',
  icon: Code2,
  category: 'layout',
  keywords: ['codigo', 'code', 'snippet', 'programacion'],
  createDefault: () => ({ code: '', language: 'text' }),
  Editor: ({ data, onChange }) => (
    <div className="rounded-xl border border-border bg-[#0d1117] overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/50">
        <input
          type="text"
          value={data.language}
          onChange={(e) => onChange({ ...data, language: e.target.value })}
          placeholder="lenguaje"
          className="bg-transparent text-xs text-muted-foreground outline-none w-28"
        />
        <Code2 className="w-4 h-4 text-muted-foreground" />
      </div>
      <textarea
        rows={5}
        value={data.code}
        onChange={(e) => onChange({ ...data, code: e.target.value })}
        placeholder="// Escribe el código aquí"
        spellCheck={false}
        className="w-full bg-transparent text-sm font-mono text-gray-100 p-3 outline-none resize-y"
      />
    </div>
  ),
  Renderer: ({ data }) => (
    <pre className="my-6 rounded-xl border border-border bg-[#0d1117] p-4 overflow-x-auto">
      <code className="text-sm font-mono text-gray-100 whitespace-pre">{data.code}</code>
    </pre>
  ),
});
