
import { useEditor as useTiptapEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { useToast } from '@/hooks/use-toast';

interface UseEditorProps {
  initialContent: string;
  onUpdate: (html: string) => void;
}

export function useCustomEditor({ initialContent, onUpdate }: UseEditorProps) {
  const { toast } = useToast();

  const editor = useTiptapEditor({
    extensions: [
      StarterKit,
      Image,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline',
        },
      })
    ],
    content: initialContent,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onUpdate(html);
    },
  });

  const addLink = () => {
    const selectedText = editor?.state.selection.empty 
      ? '' 
      : editor?.state.doc.textBetween(
          editor.state.selection.from,
          editor.state.selection.to,
        );

    const linkType = window.prompt(
      'Choose link type (1: Internal, 2: External, 3: Hyperlink):',
      '1'
    );

    if (!linkType || !editor) return;

    let url = '';
    let text = selectedText || '';

    switch (linkType) {
      case '1': // Internal link
        const path = window.prompt('Enter internal path (e.g., /blog/post-1):', '/');
        if (!path) return;
        url = `${window.location.origin}${path}`;
        if (!selectedText) {
          text = window.prompt('Enter link text:', path) || path;
        }
        break;

      case '2': // External link
        url = window.prompt('Enter external URL:', 'https://') || '';
        if (!url) return;
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          url = `https://${url}`;
        }
        if (!selectedText) {
          text = window.prompt('Enter link text:', url) || url;
        }
        break;

      case '3': // Hyperlink (mailto, tel, etc.)
        const protocol = window.prompt('Enter protocol (mailto:, tel:, etc.):', 'mailto:');
        if (!protocol) return;
        const value = window.prompt('Enter value (email, phone, etc.):');
        if (!value) return;
        url = `${protocol}${value}`;
        if (!selectedText) {
          text = window.prompt('Enter link text:', value) || value;
        }
        break;

      default:
        return;
    }

    if (!url) return;

    if (editor.state.selection.empty) {
      editor.chain().focus().insertContent(`<a href="${url}">${text}</a>`).run();
    } else {
      editor.commands.setLink({ href: url });
    }

    toast({
      title: "Link added",
      description: "The link has been inserted into your content.",
    });
  };

  return { editor, addLink };
}
