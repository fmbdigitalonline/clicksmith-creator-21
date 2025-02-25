import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { uploadMedia } from "@/utils/uploadUtils";
import { useState } from "react";
import { Loader2, Bold, Italic, List, ListOrdered, Heading1, Heading2, Heading3, Link2 } from "lucide-react";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';

const blogPostSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().min(1, "Description is required"),
  content: z.string().min(1, "Content is required"),
  meta_description: z.string().optional(),
  published: z.boolean().default(false),
  image_url: z.string().optional(),
  meta_keywords: z.array(z.string()).optional(),
  featured: z.boolean().default(false),
  canonical_url: z.string().optional()
});

type BlogPostFormValues = z.infer<typeof blogPostSchema>;

interface CreateBlogPostProps {
  editMode?: boolean;
  initialData?: BlogPostFormValues & { id: string };
  onSuccess?: () => void;
}

export function CreateBlogPost({ editMode, initialData, onSuccess }: CreateBlogPostProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);

  const form = useForm<BlogPostFormValues>({
    resolver: zodResolver(blogPostSchema),
    defaultValues: initialData || {
      published: false,
      featured: false,
      meta_keywords: [],
      image_url: "",
      canonical_url: "",
    },
  });

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image
    ],
    content: initialData?.content || '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      form.setValue('content', html);
    },
  });

  const addLink = () => {
    const url = window.prompt('Enter URL:');
    if (url && editor) {
      // Check if there's text selected
      if (editor.state.selection.empty) {
        // If no text is selected, use the URL as the text
        editor.chain().focus().insertContent(`<a href="${url}">${url}</a>`).run();
      } else {
        // If text is selected, turn it into a link
        editor.chain().focus().setLink({ href: url }).run();
      }
    }
  };

  const handleMediaUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const publicUrl = await uploadMedia(file);
      
      if (editor) {
        const isImage = file.type.startsWith('image/');
        if (isImage) {
          editor.chain().focus().insertContent(`<img src="${publicUrl}" alt="Uploaded image" />`).run();
        } else {
          editor.commands.insertContent(`<video controls src="${publicUrl}"></video>`);
        }
      }
      
      toast({
        title: "Media uploaded",
        description: "Media has been inserted into your content.",
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (data: BlogPostFormValues) => {
    const canonical_url = data.canonical_url || `${window.location.origin}/blog/${data.slug}`;
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to create or edit posts.",
        variant: "destructive",
      });
      return;
    }

    const postData = {
      title: data.title,
      slug: data.slug,
      description: data.description,
      content: data.content,
      meta_description: data.meta_description,
      published: data.published,
      image_url: data.image_url || null,
      meta_keywords: data.meta_keywords || [],
      featured: data.featured,
      canonical_url,
      author_id: user.id
    };

    if (editMode && initialData) {
      const { error } = await supabase
        .from("blog_posts")
        .update({
          ...postData,
          updated_at: new Date().toISOString(),
        })
        .eq("id", initialData.id);

      if (error) {
        toast({
          title: "Error updating post",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Post updated",
        description: "Your blog post has been successfully updated.",
      });
    } else {
      const { error } = await supabase
        .from("blog_posts")
        .insert({
          ...postData,
          published_at: data.published ? new Date().toISOString() : null,
        });

      if (error) {
        toast({
          title: "Error creating post",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Post created",
        description: "Your blog post has been successfully created.",
      });

      form.reset();
      if (editor) {
        editor.commands.setContent('');
      }
    }

    queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
    
    if (onSuccess) {
      onSuccess();
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter post title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Slug</FormLabel>
              <FormControl>
                <Input placeholder="enter-post-slug" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Input
                  placeholder="Brief description of the post"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div>
          <FormLabel>Media Upload</FormLabel>
          <Input
            type="file"
            accept="image/*,video/*"
            onChange={handleMediaUpload}
            disabled={isUploading}
            className="mb-2"
          />
          <FormDescription>
            Upload images or videos to include in your post.
          </FormDescription>
          {isUploading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Uploading media...
            </div>
          )}
        </div>

        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Content</FormLabel>
              <FormControl>
                <div className="border rounded-md">
                  <div className="border-b bg-muted p-2 flex gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => editor?.chain().focus().toggleBold().run()}
                      className={editor?.isActive('bold') ? 'bg-accent' : ''}
                    >
                      <Bold className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => editor?.chain().focus().toggleItalic().run()}
                      className={editor?.isActive('italic') ? 'bg-accent' : ''}
                    >
                      <Italic className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
                      className={editor?.isActive('heading', { level: 1 }) ? 'bg-accent' : ''}
                    >
                      <Heading1 className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                      className={editor?.isActive('heading', { level: 2 }) ? 'bg-accent' : ''}
                    >
                      <Heading2 className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
                      className={editor?.isActive('heading', { level: 3 }) ? 'bg-accent' : ''}
                    >
                      <Heading3 className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => editor?.chain().focus().toggleBulletList().run()}
                      className={editor?.isActive('bulletList') ? 'bg-accent' : ''}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                      className={editor?.isActive('orderedList') ? 'bg-accent' : ''}
                    >
                      <ListOrdered className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={addLink}
                      className={editor?.isActive('link') ? 'bg-accent' : ''}
                    >
                      <Link2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="p-2 min-h-[200px] prose prose-sm max-w-none">
                    <EditorContent editor={editor} />
                  </div>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="meta_description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Meta Description (SEO)</FormLabel>
              <FormControl>
                <Input placeholder="Meta description for SEO" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="canonical_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Canonical URL (Optional)</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Leave empty to auto-generate from slug" 
                  {...field} 
                />
              </FormControl>
              <div className="text-sm text-muted-foreground">
                If this is the original source, leave empty. Only set if this content exists elsewhere.
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="image_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Featured Image URL</FormLabel>
              <FormControl>
                <Input placeholder="Featured image URL for the blog post" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-4">
          <FormField
            control={form.control}
            name="published"
            render={({ field }) => (
              <FormItem className="flex-1 flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Published</FormLabel>
                  <div className="text-sm text-muted-foreground">
                    Make this post publicly visible
                  </div>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="featured"
            render={({ field }) => (
              <FormItem className="flex-1 flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Featured</FormLabel>
                  <div className="text-sm text-muted-foreground">
                    Show this post in featured sections
                  </div>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" className="w-full">
          {editMode ? "Update Post" : "Create Post"}
        </Button>
      </form>
    </Form>
  );
}
