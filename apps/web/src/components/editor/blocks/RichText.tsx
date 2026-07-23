import type { JSONContent } from '@tiptap/react';
import type { ReactNode } from 'react';

/**
 * Minimal TipTap-compatible JSON renderer used by content blocks in the
 * student view. Handles doc > (paragraph | heading | list) > text with marks.
 * Kept dependency-free so the read-only view never boots the TipTap engine.
 */
export function RichText({ content }: { content: JSONContent | null | undefined }) {
  if (!content || typeof content !== 'object') return null;
  return <>{renderNode(content, 0)}</>;
}

function renderNode(node: JSONContent, key: number): ReactNode {
  if (!node) return null;

  switch (node.type) {
    case 'doc':
      return <div key={key}>{(node.content || []).map(renderNode)}</div>;
    case 'paragraph':
      return (
        <p key={key} className="text-foreground/80 leading-relaxed my-3">
          {(node.content || []).map(renderNode)}
        </p>
      );
    case 'heading': {
      const level = (node.attrs?.level as number) || 2;
      const cls =
        level === 1
          ? 'text-3xl font-bold mt-6 mb-3'
          : level === 2
          ? 'text-2xl font-bold mt-5 mb-2'
          : 'text-xl font-semibold mt-4 mb-2';
      const children = (node.content || []).map(renderNode);
      if (level === 1) return <h1 key={key} className={cls}>{children}</h1>;
      if (level === 2) return <h2 key={key} className={cls}>{children}</h2>;
      return <h3 key={key} className={cls}>{children}</h3>;
    }
    case 'bulletList':
      return (
        <ul key={key} className="list-disc pl-6 my-3 space-y-1 text-foreground/80">
          {(node.content || []).map(renderNode)}
        </ul>
      );
    case 'orderedList':
      return (
        <ol key={key} className="list-decimal pl-6 my-3 space-y-1 text-foreground/80">
          {(node.content || []).map(renderNode)}
        </ol>
      );
    case 'listItem':
      return <li key={key}>{(node.content || []).map(renderNode)}</li>;
    case 'blockquote':
      return (
        <blockquote key={key} className="border-l-4 border-primary/40 pl-4 italic my-3 text-foreground/70">
          {(node.content || []).map(renderNode)}
        </blockquote>
      );
    case 'text': {
      let el: ReactNode = node.text;
      for (const mark of node.marks || []) {
        if (mark.type === 'bold') el = <strong key={key}>{el}</strong>;
        else if (mark.type === 'italic') el = <em key={key}>{el}</em>;
        else if (mark.type === 'underline') el = <u key={key}>{el}</u>;
        else if (mark.type === 'strike') el = <s key={key}>{el}</s>;
        else if (mark.type === 'code') el = <code key={key} className="bg-muted px-1.5 py-0.5 rounded text-sm">{el}</code>;
        else if (mark.type === 'link')
          el = (
            <a
              key={key}
              href={typeof mark.attrs?.href === 'string' ? mark.attrs.href : undefined}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              {el}
            </a>
          );
      }
      return <span key={key}>{el}</span>;
    }
    case 'hardBreak':
      return <br key={key} />;
    default:
      // Unknown node: attempt to render children so we never lose content.
      return node.content ? <span key={key}>{node.content.map(renderNode)}</span> : null;
  }
}
