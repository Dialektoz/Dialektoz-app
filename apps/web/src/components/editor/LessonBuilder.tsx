'use client';

import { useState } from 'react';
import { BlockCanvas } from './BlockCanvas';
import { createBlock } from './blocks/registry';
import type { BlockInstance } from './blocks/types';

// Re-export the canonical instance type for consumers of the builder.
export type { BlockInstance } from './blocks/types';

interface LessonBuilderProps {
  initialBlocks?: BlockInstance[];
  onChange?: (blocks: BlockInstance[]) => void;
}

export function LessonBuilder({ initialBlocks = [], onChange }: LessonBuilderProps) {
  const [blocks, setBlocks] = useState<BlockInstance[]>(
    initialBlocks.length > 0 ? initialBlocks : [createBlock('heading')]
  );

  const commit = (next: BlockInstance[]) => {
    setBlocks(next);
    onChange?.(next);
  };

  return <BlockCanvas blocks={blocks} onChange={commit} emptyLabel="Añadir el primer bloque" />;
}
