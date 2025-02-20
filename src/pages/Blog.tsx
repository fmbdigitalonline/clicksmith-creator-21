
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
    if (data) setPosts(data);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Blog - Latest Updates and Insights</title>
        <meta name="description" content="Stay up to date with our latest product updates, marketing tips, and industry insights." />
        <meta name="keywords" content="blog, marketing, product updates, digital marketing, industry news" />
        <meta property="og:type" content="blog" />
        <meta property="og:title" content="Blog - Latest Updates and Insights" />
        <meta property="og:description" content="Stay up to date with our latest product updates, marketing tips, and industry insights." />
      </Helmet>

      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">Blog</h1>
        
        <BlogCategoryFilter
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {posts.map((post) => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>
        )}

        {!loading && posts.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900">No posts found</h3>
            <p className="mt-2 text-gray-500">
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
