'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import type { Editor, JSONContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Bold, Italic, Strikethrough, List, ListOrdered, Heading2, Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TEXT_COLORS } from './textColor';

interface RichTextEditorProps {
  content: JSONContent | null;
  onChange: (json: JSONContent) => void;
  editable?: boolean;
}

const MenuBar = ({ editor }: { editor: Editor | null }) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2 p-2 mb-4 border rounded-md bg-muted/50">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={editor.isActive('bold') ? 'bg-muted text-primary' : ''}
      >
        <Bold className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={editor.isActive('italic') ? 'bg-muted text-primary' : ''}
      >
        <Italic className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        disabled={!editor.can().chain().focus().toggleStrike().run()}
        className={editor.isActive('strike') ? 'bg-muted text-primary' : ''}
      >
        <Strikethrough className="w-4 h-4" />
      </Button>
      <div className="w-px h-6 mx-1 bg-border self-center" />
      <Button
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={editor.isActive('heading', { level: 2 }) ? 'bg-muted text-primary' : ''}
      >
        <Heading2 className="w-4 h-4" />
      </Button>
      <div className="w-px h-6 mx-1 bg-border self-center" />
      <Button
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={editor.isActive('bulletList') ? 'bg-muted text-primary' : ''}
      >
        <List className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={editor.isActive('orderedList') ? 'bg-muted text-primary' : ''}
      >
        <ListOrdered className="w-4 h-4" />
      </Button>

      <div className="w-px h-6 mx-1 bg-border self-center" />
      <div className="flex items-center gap-1">
        {TEXT_COLORS.map((c) => (
          <button
            key={c.value}
            type="button"
            title={`Color: ${c.name}`}
            onClick={() => editor.chain().focus().setColor(c.value).run()}
            className={`w-5 h-5 rounded-full border transition-transform hover:scale-110 ${
              editor.isActive('textStyle', { color: c.value }) ? 'ring-2 ring-offset-1 ring-offset-background ring-foreground/40' : 'border-border'
            }`}
            style={{ backgroundColor: c.value }}
          />
        ))}
        <Button
          variant="ghost"
          size="icon"
          title="Quitar color"
          onClick={() => editor.chain().focus().unsetColor().run()}
        >
          <Ban className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export const RichTextEditor = ({ content, onChange, editable = true }: RichTextEditorProps) => {
  const editor = useEditor({
    extensions: [StarterKit, TextStyle, Color],
    content: content || {},
    editable,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      // Pasamos el contenido como JSON para mejor serialización en BD
      onChange(editor.getJSON());
    },
    editorProps: {
      attributes: {
        // Only `prose prose-invert` (+ size). The responsive `sm:prose`/`lg:prose-lg`
        // variants re-declared the body color inside their media queries and
        // overrode the dark-theme inversion, leaving text dark on desktop.
        class: 'prose prose-invert prose-sm max-w-none focus:outline-none min-h-[200px] p-4 w-full text-foreground',
      },
    },
  });

  return (
    <div className="w-full">
      {editable && <MenuBar editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  );
};
