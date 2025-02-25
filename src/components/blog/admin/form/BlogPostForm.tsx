
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { RichTextEditor } from "../editor/RichTextEditor";
import { Editor } from '@tiptap/react';

interface BlogPostFormValues {
  title: string;
  slug: string;
  description: string;
  content: string;
  meta_description?: string;
  published: boolean;
  image_url?: string;
  meta_keywords?: string[];
  featured: boolean;
  canonical_url?: string;
}

interface BlogPostFormProps {
  form: UseFormReturn<BlogPostFormValues>;
  onSubmit: (data: BlogPostFormValues) => Promise<void>;
  editor: Editor | null;
  onAddLink: () => void;
  isUploading: boolean;
  handleMediaUpload: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  editMode?: boolean;
}

export function BlogPostForm({ 
  form, 
  onSubmit, 
  editor, 
  onAddLink,
  isUploading,
  handleMediaUpload,
  editMode 
}: BlogPostFormProps) {
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
                <RichTextEditor editor={editor} onAddLink={onAddLink} />
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
