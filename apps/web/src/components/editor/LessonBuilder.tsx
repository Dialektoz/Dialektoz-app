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
  /** Restrict which block types can be added (used by the quiz tab). */
  allowedTypes?: string[];
  emptyLabel?: string;
  /** Show "Importar desde JSON" in the add-block menu; called with the index to insert at. */
  onImport?: (insertAt: number) => void;
}

export function LessonBuilder({
  initialBlocks = [],
  onChange,
  allowedTypes,
  emptyLabel = 'Añadir el primer bloque',
  onImport,
}: LessonBuilderProps) {
  const [blocks, setBlocks] = useState<BlockInstance[]>(
    initialBlocks.length > 0 ? initialBlocks : [createBlock('heading')]
  );

  const commit = (next: BlockInstance[]) => {
    setBlocks(next);
    onChange?.(next);
  };

  return (
    <BlockCanvas blocks={blocks} onChange={commit} emptyLabel={emptyLabel} allowedTypes={allowedTypes} onImport={onImport} />
  );
}
