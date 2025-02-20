
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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

// Updated schema to match database requirements
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

  const onSubmit = async (data: BlogPostFormValues) => {
    // Generate the canonical URL if not provided
    const canonical_url = data.canonical_url || `${window.location.origin}/blog/${data.slug}`;

    if (editMode && initialData) {
      const { error } = await supabase
        .from("blog_posts")
        .update({
          ...data,
          canonical_url,
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
          ...data,
          canonical_url,
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

    // Invalidate the posts query to refresh the list
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

        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Content</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Write your post content here"
                  className="min-h-[200px]"
                  {...field}
                />
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
              <FormLabel>Image URL</FormLabel>
              <FormControl>
                <Input placeholder="Image URL for the blog post" {...field} />
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
