
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
  };
}

const BlogCard = ({ post }: BlogCardProps) => {
  return (
    <article className="flex flex-col overflow-hidden rounded-lg border bg-white shadow-sm transition-all hover:shadow-md">
      {post.image_url && (
        <div className="aspect-video w-full overflow-hidden">
          <img 
            src={post.image_url} 
            alt={post.title}
            className="h-full w-full object-cover"
          />
        </div>
      )}
      <div className="flex flex-col space-y-3 p-6">
        <h3 className="text-xl font-semibold tracking-tight">
          <Link to={`/blog/${post.slug}`} className="hover:underline">
            {post.title}
          </Link>
        </h3>
        <p className="text-sm text-gray-500">
          {formatDistanceToNow(new Date(post.published_at))} ago
          {post.reading_time && ` · ${post.reading_time} min read`}
        </p>
        <p className="text-gray-600">
          {post.description}
        </p>
        <Link 
          to={`/blog/${post.slug}`}
          className="text-sm font-medium text-primary hover:underline"
        >
          Read more →
        </Link>
      </div>
    </article>
  );
};

export default BlogCard;
