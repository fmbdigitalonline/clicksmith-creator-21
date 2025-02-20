
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Helmet } from "react-helmet";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

const BlogPost = () => {
  const { slug } = useParams();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPost();
  }, [slug]);

  const fetchPost = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('blog_posts')
      .select(`
        *,
        blog_posts_categories(
          blog_categories(*)
        )
      `)
      .eq('slug', slug)
      .eq('published', true)
      .single();

    if (data) {
      setPost(data);
      // Increment view count
      await supabase
        .from('blog_posts')
        .update({ views: (data.views || 0) + 1 })
        .eq('id', data.id);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto space-y-6">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold">Post not found</h1>
        <p className="mt-2 text-gray-600">The post you're looking for doesn't exist or has been removed.</p>
      </div>
    );
  }

  return (
    <article className="min-h-screen bg-white">
      <Helmet>
        <title>{post.title}</title>
        <meta name="description" content={post.meta_description || post.description} />
        {post.meta_keywords && (
          <meta name="keywords" content={post.meta_keywords.join(', ')} />
        )}
        <meta property="og:type" content="article" />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.meta_description || post.description} />
        {post.image_url && <meta property="og:image" content={post.image_url} />}
        <meta property="article:published_time" content={post.published_at} />
      </Helmet>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
          
          <div className="flex items-center gap-4 text-gray-500 mb-8">
            <time dateTime={post.published_at}>
              {formatDistanceToNow(new Date(post.published_at))} ago
            </time>
            {post.reading_time && (
              <span>· {post.reading_time} min read</span>
            )}
            <span>· {post.views || 0} views</span>
          </div>

          {post.image_url && (
            <img
              src={post.image_url}
              alt={post.title}
              className="w-full rounded-lg mb-8"
            />
          )}

          <div 
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {post.blog_posts_categories && (
            <div className="mt-8 pt-8 border-t">
              <h2 className="text-lg font-semibold mb-2">Categories</h2>
              <div className="flex gap-2">
                {post.blog_posts_categories.map(({ blog_categories: category }: any) => (
                  <span
                    key={category.id}
                    className="inline-block bg-gray-100 rounded-full px-3 py-1 text-sm text-gray-700"
                  >
                    {category.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  );
};

export default BlogPost;
