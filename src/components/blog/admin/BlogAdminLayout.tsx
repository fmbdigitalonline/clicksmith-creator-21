
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BlogPostList } from "./BlogPostList";
import { CreateBlogPost } from "./CreateBlogPost";

export function BlogAdminLayout() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Blog Administration</h1>
        <p className="text-muted-foreground">Manage your blog posts and categories</p>
      </div>
      
      <Card className="p-6">
        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="create">Create New Post</TabsTrigger>
          </TabsList>
          <TabsContent value="posts">
            <BlogPostList />
          </TabsContent>
          <TabsContent value="create">
            <CreateBlogPost />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
