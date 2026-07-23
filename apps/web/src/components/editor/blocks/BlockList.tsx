'use client';

import { getBlock, normalizeBlocks } from './registry';

/**
 * Renders a list of blocks (student view). Accepts raw stored blocks and
 * normalizes them, so it works for top-level lesson content and for the
 * children of container blocks (columns, sections).
 */
export function BlockList({ blocks }: { blocks: unknown }) {
  const instances = normalizeBlocks(blocks);
  return (
    <>
      {instances.map((block) => {
        const def = getBlock(block.type);
        if (!def) return null;
        const Renderer = def.Renderer;
        return <Renderer key={block.id} data={block.data} blockId={block.id} />;
      })}
    </>
  );
}
