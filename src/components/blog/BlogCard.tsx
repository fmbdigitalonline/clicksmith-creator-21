
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

interface BlogCardProps {
  post: {
    slug: string;
    title: string;
    description: string;
    image_url?: string;
    published_at: string;
    reading_time: number;
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

const BlogCard = ({ post, featured = false, compact = false }: BlogCardProps) => {
  const categories = post.blog_posts_categories
    ?.filter(pc => pc.blog_categories !== null)
    .map(pc => pc.blog_categories) || [];

  if (featured) {
    return (
      <article className="grid md:grid-cols-2 gap-8 bg-white rounded-lg overflow-hidden">
        <div className="aspect-[4/3] md:aspect-auto">
          <img 
            src={post.image_url || '/placeholder.svg'} 
            alt={post.title}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="p-6 flex flex-col justify-center">
          <div className="text-sm text-gray-500 mb-2">
            {new Date(post.published_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}
          </div>
          <h2 className="text-2xl font-bold mb-4 hover:text-primary transition-colors">
            <Link to={`/blog/${post.slug}`}>
              {post.title}
            </Link>
          </h2>
          <p className="text-gray-600 mb-4 line-clamp-2">{post.description}</p>
          <Link 
            to={`/blog/${post.slug}`}
            className="text-primary hover:underline text-sm font-medium"
          >
            Read article
          </Link>
        </div>
      </article>
    );
  }

  if (compact) {
    return (
      <article className="flex flex-col bg-white rounded-lg overflow-hidden h-full">
        <div className="aspect-video">
          <img 
            src={post.image_url || '/placeholder.svg'} 
            alt={post.title}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="p-4 flex flex-col flex-1">
          <div className="text-sm text-gray-500 mb-2">
            {new Date(post.published_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}
          </div>
          <h3 className="font-bold mb-2 hover:text-primary transition-colors">
            <Link to={`/blog/${post.slug}`}>
              {post.title}
            </Link>
          </h3>
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">{post.description}</p>
          <Link 
            to={`/blog/${post.slug}`}
            className="text-primary hover:underline text-sm font-medium mt-auto"
          >
            Read article
          </Link>
        </div>
      </article>
    );
  }

  return (
    <article className="flex flex-col overflow-hidden rounded-lg bg-white h-full">
      <Link to={`/blog/${post.slug}`} className="group">
        <div className="aspect-video overflow-hidden">
          <img 
            src={post.image_url || '/placeholder.svg'} 
            alt={post.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
        <div className="p-6 flex flex-col flex-1">
          {categories.length > 0 && (
            <div className="flex gap-2 mb-3">
              {categories.map((category) => (
                <span 
                  key={category.slug}
                  className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600"
                >
                  {category.name}
                </span>
              ))}
            </div>
          )}
          <h3 className="text-xl font-bold text-gray-900 group-hover:text-primary transition-colors mb-3">
            {post.title}
          </h3>
          <p className="text-gray-600 line-clamp-2 mb-4">
            {post.description}
          </p>
          <div className="flex items-center gap-2 text-sm text-gray-500 mt-auto">
            <span>{formatDistanceToNow(new Date(post.published_at))} ago</span>
            {post.reading_time && <span>·</span>}
            {post.reading_time && <span>{post.reading_time} min read</span>}
          </div>
        </div>
      </Link>
    </article>
  );
};

export default BlogCard;
