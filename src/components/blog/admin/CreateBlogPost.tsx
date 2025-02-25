import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { uploadMedia } from "@/utils/uploadUtils";
import { useState } from "react";
import { useCustomEditor } from "./editor/useEditor";
import { BlogPostForm } from "./form/BlogPostForm";

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
    defaultValues: {
      title: initialData?.title || "",
      slug: initialData?.slug || "",
      description: initialData?.description || "",
      content: initialData?.content || "",
      meta_description: initialData?.meta_description || "",
      published: initialData?.published || false,
      image_url: initialData?.image_url || "",
      meta_keywords: initialData?.meta_keywords || [],
      featured: initialData?.featured || false,
      canonical_url: initialData?.canonical_url || "",
    },
  });

  const { editor, addLink } = useCustomEditor({
    initialContent: initialData?.content || '',
    onUpdate: (html) => form.setValue('content', html),
  });

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
    <BlogPostForm
      form={form}
      onSubmit={onSubmit}
      editor={editor}
      onAddLink={addLink}
      isUploading={isUploading}
      handleMediaUpload={handleMediaUpload}
      editMode={editMode}
    />
  );
}
