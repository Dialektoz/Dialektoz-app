import type { BlockDefinition, BlockInstance, BlockCategory } from './types';
import { CATEGORY_ORDER } from './types';

// ── Text ─────────────────────────────────────────────
import { HeadingBlock } from './text/HeadingBlock';
import { RichTextBlock } from './text/RichTextBlock';
import { CalloutBlock } from './text/CalloutBlock';
import { QuoteBlock } from './text/QuoteBlock';
// ── Media ────────────────────────────────────────────
import { ImageBlock } from './media/ImageBlock';
import { VideoBlock } from './media/VideoBlock';
import { AudioBlock } from './media/AudioBlock';
import { EmbedBlock } from './media/EmbedBlock';
import { FileBlock } from './media/FileBlock';
import { GalleryBlock } from './media/GalleryBlock';
import { ButtonBlock } from './media/ButtonBlock';
// ── Layout ───────────────────────────────────────────
import { DividerBlock } from './layout/DividerBlock';
import { CodeBlock } from './layout/CodeBlock';
import { TableBlock } from './layout/TableBlock';
import { AccordionBlock } from './layout/AccordionBlock';
import { TabsBlock } from './layout/TabsBlock';
import { TimelineBlock } from './layout/TimelineBlock';
import { ColumnsBlock } from './layout/ColumnsBlock';
import { ContainerBlock } from './layout/ContainerBlock';
// ── Interactive ──────────────────────────────────────
import { QuizBlock } from './interactive/QuizBlock';
import { MultiChoiceBlock } from './interactive/MultiChoiceBlock';
import { TrueFalseBlock } from './interactive/TrueFalseBlock';
import { FillBlankBlock } from './interactive/FillBlankBlock';
import { ShortAnswerBlock } from './interactive/ShortAnswerBlock';
import { FlashcardsBlock } from './interactive/FlashcardsBlock';
import { OrderingBlock } from './interactive/OrderingBlock';
import { MatchingBlock } from './interactive/MatchingBlock';
import { ClassificationBlock } from './interactive/ClassificationBlock';
import { EssayBlock } from './interactive/EssayBlock';
import { ImageHotspotBlock } from './interactive/ImageHotspotBlock';
import { ImageLabelingBlock } from './interactive/ImageLabelingBlock';

/**
 * The ordered list of every registered block. To add a new block:
 *   1. create its module under blocks/<category>/
 *   2. add one import + one entry here.
 * Nothing else in the editor/renderer needs to change.
 */
export const BLOCKS: BlockDefinition[] = [
  HeadingBlock,
  RichTextBlock,
  CalloutBlock,
  QuoteBlock,
  ImageBlock,
  VideoBlock,
  AudioBlock,
  EmbedBlock,
  FileBlock,
  GalleryBlock,
  ButtonBlock,
  DividerBlock,
  CodeBlock,
  TableBlock,
  AccordionBlock,
  TabsBlock,
  TimelineBlock,
  ColumnsBlock,
  ContainerBlock,
  QuizBlock,
  MultiChoiceBlock,
  TrueFalseBlock,
  FillBlankBlock,
  ShortAnswerBlock,
  FlashcardsBlock,
  OrderingBlock,
  MatchingBlock,
  ClassificationBlock,
  EssayBlock,
  ImageHotspotBlock,
  ImageLabelingBlock,
] as BlockDefinition[];

const REGISTRY = new Map<string, BlockDefinition>(BLOCKS.map((b) => [b.type, b]));

export function getBlock(type: string): BlockDefinition | undefined {
  return REGISTRY.get(type);
}

export function blocksByCategory(): { category: BlockCategory; blocks: BlockDefinition[] }[] {
  return CATEGORY_ORDER.map((category) => ({
    category,
    blocks: BLOCKS.filter((b) => b.category === category),
  })).filter((g) => g.blocks.length > 0);
}

/** Create a fresh block instance for a given type. */
export function createBlock(type: string): BlockInstance {
  const def = getBlock(type);
  return {
    id: crypto.randomUUID(),
    type,
    data: def ? def.createDefault() : {},
  };
}

/**
 * Normalize raw stored blocks to the `{ id, type, data }` shape.
 * Supports the legacy `{ id, type, content }` format so existing
 * lessons keep working after the architecture change.
 */
export function normalizeBlocks(raw: unknown): BlockInstance[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((b) => normalizeBlock(b)).filter((b): b is BlockInstance => b !== null);
}

function normalizeBlock(raw: unknown): BlockInstance | null {
  if (!raw || typeof raw !== 'object') return null;
  const b = raw as Record<string, unknown>;
  const id = typeof b.id === 'string' ? b.id : crypto.randomUUID();
  const type = typeof b.type === 'string' ? b.type : '';
  if (!type) return null;

  // Already new format.
  if ('data' in b) return { id, type, data: b.data };

  // Legacy `content` → `data` conversion.
  const content = b.content;
  switch (type) {
    case 'heading':
      return { id, type, data: { text: typeof content === 'string' ? content : '', level: 2 } };
    case 'text':
      return { id, type, data: { doc: content && typeof content === 'object' ? content : { type: 'doc', content: [{ type: 'paragraph' }] } } };
    case 'image':
      return { id, type, data: { url: typeof content === 'string' ? content : '', alt: '', caption: '' } };
    case 'fill-blank':
      return { id, type, data: { text: typeof content === 'string' ? content : '' } };
    case 'quiz': {
      const q = (content && typeof content === 'object' ? content : {}) as Record<string, unknown>;
      return { id, type, data: { question: (q.question as string) ?? '', options: (q.options as string[]) ?? ['', ''], correctIndex: (q.correctIndex as number) ?? 0 } };
    }
    default:
      // Unknown/legacy type (e.g. old 'grid'): keep content under data.
      return { id, type, data: content ?? {} };
  }
}
