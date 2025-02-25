
import { Editor, EditorContent } from '@tiptap/react';
import { EditorToolbar } from './EditorToolbar';

interface RichTextEditorProps {
  editor: Editor | null;
  onAddLink: () => void;
}

export function RichTextEditor({ editor, onAddLink }: RichTextEditorProps) {
  return (
    <div className="border rounded-md">
      <EditorToolbar editor={editor} onAddLink={onAddLink} />
      <div className="p-2 min-h-[200px] prose prose-sm max-w-none">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
