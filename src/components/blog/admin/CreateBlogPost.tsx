
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { uploadMedia } from "@/utils/uploadUtils";
import { useState } from "react";
import { Loader2 } from "lucide-react";

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

  const handleMediaUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const publicUrl = await uploadMedia(file);
      
      // Insert the media URL at the cursor position in the content field
      const contentField = form.getValues('content');
      const isImage = file.type.startsWith('image/');
      const mediaTag = isImage 
        ? `\n![${file.name}](${publicUrl})\n`
        : `\n<video controls src="${publicUrl}"></video>\n`;
      
      form.setValue('content', contentField + mediaTag);
      
      toast({
        title: "Media uploaded",
        description: "You can now reference it in your content.",
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
      author_id: user.id // Add the author_id field
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
                <Textarea
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
            Upload images or videos to include in your post. They will be inserted at the end of your content.
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
                <Textarea
                  placeholder="Write your post content here. You can use Markdown!"
                  className="min-h-[200px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Use Markdown for formatting. Images and videos will be inserted as Markdown/HTML tags.
              </FormDescription>
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
