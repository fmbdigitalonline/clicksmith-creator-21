
import { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { supabase } from "@/integrations/supabase/client";
import BlogCard from "@/components/blog/BlogCard";
import BlogCategoryFilter from "@/components/blog/BlogCategoryFilter";
import { Skeleton } from "@/components/ui/skeleton";

const Blog = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
    fetchPosts();
  }, [selectedCategory]);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('blog_categories')
      .select('*')
      .order('name');
    if (data) setCategories(data);
  };

  const fetchPosts = async () => {
    setLoading(true);
    let query = supabase
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

    if (selectedCategory) {
      query = query.eq('blog_posts_categories.blog_categories.slug', selectedCategory);
    }

    const { data, error } = await query;
    console.log('Fetched blog posts:', data);
    if (error) {
      console.error('Error fetching posts:', error);
    }
    if (data) setPosts(data);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Helmet>
        <title>Blog - Latest Updates and Insights</title>
        <meta name="description" content="Stay up to date with our latest product updates, marketing tips, and industry insights." />
        <meta name="keywords" content="blog, marketing, product updates, digital marketing, industry news" />
        <meta property="og:type" content="blog" />
        <meta property="og:title" content="Blog - Latest Updates and Insights" />
        <meta property="og:description" content="Stay up to date with our latest product updates, marketing tips, and industry insights." />
      </Helmet>

      {/* Hero Section */}
      <div className="w-full bg-gradient-to-r from-blue-50 to-indigo-50 py-16 mb-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Our Blog
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Insights, updates, and stories from the world of digital marketing
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-7xl">
        {/* Category Filter */}
        <div className="mb-12">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Browse by Category</h2>
          <BlogCategoryFilter
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
        </div>

        {/* Featured Post */}
        {!loading && posts.length > 0 && (
          <div className="mb-16">
            <BlogCard post={posts[0]} featured={true} />
          </div>
        )}

        {/* Posts Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.slice(1).map((post) => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>
        )}

        {!loading && posts.length === 0 && (
          <div className="text-center py-16 bg-gray-50 rounded-lg">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No posts found</h3>
            <p className="text-gray-600">
              {selectedCategory 
                ? "No posts available in this category yet."
                : "Check back soon for new content!"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Blog;
