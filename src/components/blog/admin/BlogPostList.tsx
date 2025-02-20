
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import { CreateBlogPost } from "./CreateBlogPost";

type BlogPost = {
  id: string;
  title: string;
  slug: string;
  description: string;
  content: string;
  meta_description?: string;
  published: boolean;
  created_at: string;
  image_url?: string;
  meta_keywords?: string[];
  featured?: boolean;
  canonical_url?: string;
};

export function BlogPostList() {
  const { toast } = useToast();
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);

  const { data: posts, isLoading } = useQuery({
    queryKey: ["blog-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        toast({
          title: "Error fetching posts",
          description: error.message,
          variant: "destructive",
        });
        return [];
      }

      return data as BlogPost[];
    },
  });

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("blog_posts").delete().eq("id", id);

    if (error) {
      toast({
        title: "Error deleting post",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Post deleted",
      description: "The blog post has been successfully deleted.",
    });
  };

  if (isLoading) {
    return <div>Loading posts...</div>;
  }

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {posts?.map((post) => (
            <TableRow key={post.id}>
              <TableCell>{post.title}</TableCell>
              <TableCell>
                <span
                  className={`px-2 py-1 rounded-full text-xs ${
                    post.published
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {post.published ? "Published" : "Draft"}
                </span>
              </TableCell>
              <TableCell>
                {format(new Date(post.created_at), "MMM d, yyyy")}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  className="mr-2"
                  onClick={() => setEditingPost(post)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(post.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={!!editingPost} onOpenChange={() => setEditingPost(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit Blog Post</DialogTitle>
          </DialogHeader>
          {editingPost && (
            <CreateBlogPost
              editMode
              initialData={editingPost}
              onSuccess={() => setEditingPost(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
