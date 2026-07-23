import type { ComponentType } from 'react';
import type { LucideIcon } from 'lucide-react';

/**
 * ─────────────────────────────────────────────────────────────
 *  Block architecture — common interface
 * ─────────────────────────────────────────────────────────────
 *  Every block is a self-contained module that exports a single
 *  `BlockDefinition`. The host editor/renderer never import a
 *  concrete block: they resolve everything through the registry.
 *  Adding a new block = create one file + register it. No changes
 *  to the core are required.
 */

/** High-level grouping used by the "add block" menu. */
export type BlockCategory = 'text' | 'media' | 'layout' | 'interactive' | 'advanced';

export const CATEGORY_LABELS: Record<BlockCategory, string> = {
  text: 'Texto',
  media: 'Multimedia',
  layout: 'Estructura',
  interactive: 'Actividades',
  advanced: 'Avanzado',
};

export const CATEGORY_ORDER: BlockCategory[] = ['text', 'media', 'layout', 'interactive', 'advanced'];

/** A single block instance as stored in `lessons.content` (a JSON array). */
export interface BlockInstance<TData = unknown> {
  id: string;
  type: string;
  data: TData;
}

/** Props every block's editor component receives inside the builder. */
export interface BlockEditorProps<TData = unknown> {
  data: TData;
  onChange: (data: TData) => void;
  /** True while the block is the active/selected one in the builder. */
  selected?: boolean;
}

/** Props every block's renderer component receives in the student view. */
export interface BlockRendererProps<TData = unknown> {
  data: TData;
  /** Unique instance id; gradable blocks use it to report their score. */
  blockId?: string;
}

/**
 * Optional grading contract for interactive blocks. Blocks that are
 * activities implement `isGradable: true` and provide a `getScore`
 * so the lesson can compute progress/scores generically.
 */
export interface GradingResult {
  earned: number;
  possible: number;
}

/** The contract a block module exports. `TData` is the block's own shape. */
export interface BlockDefinition<TData = unknown> {
  /** Stable, unique identifier persisted in the DB. Never change once shipped. */
  type: string;
  /** Human label shown in the add-menu. */
  label: string;
  /** Short helper text shown under the label in the add-menu. */
  description?: string;
  icon: LucideIcon;
  category: BlockCategory;
  /** Extra search terms for the add-menu filter. */
  keywords?: string[];
  /** Factory for a fresh block's data. Must be pure. */
  createDefault: () => TData;
  /** Admin-facing editing UI. */
  Editor: ComponentType<BlockEditorProps<TData>>;
  /** Student-facing render. */
  Renderer: ComponentType<BlockRendererProps<TData>>;
  /** Marks the block as a gradable activity. */
  isGradable?: boolean;
}

/** Helper to declare a block definition with full type inference. */
export function defineBlock<TData>(def: BlockDefinition<TData>): BlockDefinition<TData> {
  return def;
}
