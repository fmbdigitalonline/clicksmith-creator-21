
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
      };
    }[];
  };
  featured?: boolean;
}

const BlogCard = ({ post, featured = false }: BlogCardProps) => {
  const categories = post.blog_posts_categories?.map(pc => pc.blog_categories) || [];

  if (featured) {
    return (
      <article className="relative overflow-hidden rounded-xl shadow-lg transition-all hover:shadow-xl">
        <Link to={`/blog/${post.slug}`} className="block">
          <div className="relative aspect-[21/9] w-full">
            <img 
              src={post.image_url || '/placeholder.svg'} 
              alt={post.title}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
              <div className="mb-4 flex gap-2">
                {categories.map((category) => (
                  <span 
                    key={category.slug}
                    className="rounded-full bg-white/20 px-3 py-1 text-sm backdrop-blur-sm"
                  >
                    {category.name}
                  </span>
                ))}
              </div>
              <h2 className="text-3xl font-bold mb-2">{post.title}</h2>
              <p className="text-lg text-white/90 mb-4">{post.description}</p>
              <div className="flex items-center gap-4 text-sm">
                <span>{formatDistanceToNow(new Date(post.published_at))} ago</span>
                {post.reading_time && <span>·</span>}
                {post.reading_time && <span>{post.reading_time} min read</span>}
              </div>
            </div>
          </div>
        </Link>
      </article>
    );
  }

  return (
    <article className="flex flex-col overflow-hidden rounded-xl border bg-white shadow-sm transition-all hover:shadow-md">
      <Link to={`/blog/${post.slug}`} className="group">
        <div className="aspect-[16/9] w-full overflow-hidden">
          <img 
            src={post.image_url || '/placeholder.svg'} 
            alt={post.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
        <div className="flex flex-col space-y-3 p-6">
          <div className="flex gap-2">
            {categories.map((category) => (
              <span 
                key={category.slug}
                className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600"
              >
                {category.name}
              </span>
            ))}
          </div>
          <h3 className="text-xl font-bold text-gray-900 group-hover:text-primary transition-colors">
            {post.title}
          </h3>
          <p className="text-gray-600 line-clamp-2">
            {post.description}
          </p>
          <div className="flex items-center gap-2 text-sm text-gray-500">
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
