
import { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { supabase } from "@/integrations/supabase/client";
import BlogCard from "@/components/blog/BlogCard";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const Blog = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('blog_posts')
      .select(`
        *,
        blog_posts_categories!inner(
          category_id,
          blog_categories(*)
        )
      `)
      .eq('published', true)
      .order('published_at', { ascending: false });

    console.log('Fetched blog posts:', data);
    if (error) {
      console.error('Error fetching posts:', error);
    }
    if (data) setPosts(data);
    setLoading(false);
  };

  const scrollContainer = (containerId: string, direction: 'left' | 'right') => {
    const container = document.getElementById(containerId);
    if (container) {
      const scrollAmount = 400;
      const targetScroll = container.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
      container.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>Our Blogs - Latest Updates and Insights</title>
        <meta name="description" content="Stay up to date with our latest product updates, marketing tips, and industry insights." />
      </Helmet>

      {/* Hero Section */}
      <div className="w-full bg-[url('/lovable-uploads/04be54da-e368-4cf6-bda0-6011079a95f2.png')] bg-cover bg-center py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Our Blogs
          </h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-7xl">
        {/* Featured Post */}
        {!loading && posts.length > 0 && (
          <section className="mb-16">
            <h2 className="text-xl font-semibold mb-6">Read our latest blog</h2>
            <BlogCard post={posts[0]} featured={true} />
          </section>
        )}

        {/* Trending Posts */}
        {!loading && posts.length > 1 && (
          <section className="mb-16">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Trending</h2>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => scrollContainer('trending-container', 'left')}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => scrollContainer('trending-container', 'right')}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div 
              id="trending-container"
              className="flex gap-6 overflow-x-auto no-scrollbar"
              style={{ 
                scrollBehavior: 'smooth',
                msOverflowStyle: 'none',
                scrollbarWidth: 'none'
              }}
            >
              {posts.slice(1, 4).map((post) => (
                <div key={post.id} className="min-w-[350px] max-w-[350px] flex-shrink-0">
                  <BlogCard post={post} compact={true} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Popular Posts */}
        {!loading && posts.length > 4 && (
          <section>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Popular</h2>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => scrollContainer('popular-container', 'left')}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => scrollContainer('popular-container', 'right')}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div 
              id="popular-container"
              className="flex gap-6 overflow-x-auto no-scrollbar"
              style={{ 
                scrollBehavior: 'smooth',
                msOverflowStyle: 'none',
                scrollbarWidth: 'none'
              }}
            >
              {posts.slice(4).map((post) => (
                <div key={post.id} className="min-w-[350px] max-w-[350px] flex-shrink-0">
                  <BlogCard post={post} compact={true} />
                </div>
              ))}
            </div>
          </section>
        )}

        {loading && (
          <div className="space-y-8">
            <Skeleton className="h-[400px] w-full" />
            <div className="flex gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-[350px]">
                  <Skeleton className="h-[250px]" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>
        {`
          .no-scrollbar::-webkit-scrollbar {
            display: none;
          }
          .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}
      </style>
    </div>
  );
};

export default Blog;
