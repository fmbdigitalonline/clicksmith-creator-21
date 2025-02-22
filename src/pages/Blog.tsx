
import { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { supabase } from "@/integrations/supabase/client";
import BlogCard from "@/components/blog/BlogCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Search, ChevronLeft, ChevronRight, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigation";
import IndexFooter from "@/components/IndexFooter";

const Blog = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const postsPerPage = 6;

  useEffect(() => {
    fetchPosts();
    fetchCategories();
  }, [currentPage]);

  const fetchPosts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('blog_posts')
      .select(`
        *,
        blog_posts_categories(
          category_id,
          blog_categories(*)
        )
      `)
      .eq('published', true)
      .order('published_at', { ascending: false });

    if (error) {
      console.error('Error fetching posts:', error);
    }
    if (data) setPosts(data);
    setLoading(false);
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('blog_categories')
      .select('*');

    if (error) {
      console.error('Error fetching categories:', error);
    }
    if (data) setCategories(data);
  };

  const handleSubscribe = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const email = (e.currentTarget.elements.namedItem('email') as HTMLInputElement).value;
    
    toast({
      title: "Subscribed!",
      description: "Thank you for subscribing to our newsletter.",
    });
    (e.target as HTMLFormElement).reset();
  };

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pageCount = Math.ceil(filteredPosts.length / postsPerPage);
  const currentPosts = filteredPosts.slice(
    (currentPage - 1) * postsPerPage,
    currentPage * postsPerPage
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>Our Blog - Latest Updates and Insights</title>
        <meta name="description" content="Stay up to date with our latest product updates, marketing tips, and industry insights." />
      </Helmet>

      <Navigation />

      <main className="flex-grow container mx-auto px-4 py-8 mt-16">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Main Content */}
          <div className="md:w-2/3">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900">Latest Articles</h1>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="search"
                  placeholder="Search articles..."
                  className="pl-10 w-[200px] md:w-[300px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            {loading ? (
              <div className="grid gap-8">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-[300px]" />
                ))}
              </div>
            ) : (
              <>
                <div className="grid gap-8">
                  {currentPosts.map((post) => (
                    <BlogCard key={post.id} post={post} />
                  ))}
                </div>

                {/* Pagination */}
                {pageCount > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-8">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-gray-600">
                      Page {currentPage} of {pageCount}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentPage(p => Math.min(pageCount, p + 1))}
                      disabled={currentPage === pageCount}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Sidebar */}
          <div className="md:w-1/3 space-y-8">
            {/* Newsletter Subscription */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Subscribe to Our Newsletter</h2>
              <form onSubmit={handleSubscribe} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    type="email"
                    name="email"
                    placeholder="Enter your email"
                    className="pl-10"
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  Subscribe
                </Button>
              </form>
            </Card>

            {/* Categories */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Categories</h2>
              <div className="space-y-2">
                {categories.map((category) => (
                  <Link
                    key={category.id}
                    to={`/blog/category/${category.slug}`}
                    className="block text-gray-600 hover:text-primary"
                  >
                    {category.name}
                  </Link>
                ))}
              </div>
            </Card>

            {/* Recent Posts */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Recent Posts</h2>
              <div className="space-y-4">
                {posts.slice(0, 5).map((post) => (
                  <Link
                    key={post.id}
                    to={`/blog/${post.slug}`}
                    className="block hover:bg-gray-50 p-2 -mx-2 rounded-lg transition-colors"
                  >
                    <h3 className="font-medium text-gray-900 line-clamp-2">{post.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(post.published_at).toLocaleDateString()}
                    </p>
                  </Link>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </main>

      <IndexFooter />
    </div>
  );
};

export default Blog;
