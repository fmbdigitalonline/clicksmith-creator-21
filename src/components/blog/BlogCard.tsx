
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { Card } from "@/components/ui/card";

interface BlogCardProps {
  post: {
    slug: string;
    title: string;
    description: string;
    image_url?: string;
    published_at: string;
    reading_time?: number;
    blog_posts_categories?: {
      blog_categories: {
        name: string;
        slug: string;
      } | null;
    }[];
  };
  featured?: boolean;
  compact?: boolean;
}

const BlogCard = ({ post }: BlogCardProps) => {
  const categories = post.blog_posts_categories
    ?.filter(pc => pc.blog_categories !== null)
    .map(pc => pc.blog_categories) || [];

  const getImageUrl = (url: string | undefined) => {
    if (!url) return '/placeholder.svg';
    if (url.startsWith('http')) return url;
    return `${window.location.origin}/${url}`;
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <Link to={`/blog/${post.slug}`} className="flex flex-col md:flex-row">
        <div className="md:w-1/3">
          <img 
            src={getImageUrl(post.image_url)} 
            alt={post.title}
            className="h-48 md:h-full w-full object-cover"
          />
        </div>
        <div className="p-6 md:w-2/3">
          <div className="flex flex-wrap gap-2 mb-3">
            {categories.map((category) => (
              <span 
                key={category?.slug}
                className="inline-block bg-primary/10 text-primary text-xs px-2 py-1 rounded-full"
              >
                {category?.name}
              </span>
            ))}
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2 hover:text-primary transition-colors">
            {post.title}
          </h2>
          <p className="text-gray-600 mb-4 line-clamp-2">
            {post.description}
          </p>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>{formatDistanceToNow(new Date(post.published_at))} ago</span>
            {post.reading_time && (
              <>
                <span>·</span>
                <span>{post.reading_time} min read</span>
              </>
            )}
          </div>
        </div>
      </Link>
    </Card>
  );
};

export default BlogCard;
