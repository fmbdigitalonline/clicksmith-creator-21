
import { Button } from "@/components/ui/button";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface BlogCategoryFilterProps {
  categories: Category[];
  selectedCategory: string | null;
  onSelectCategory: (slug: string | null) => void;
}

const BlogCategoryFilter = ({ 
  categories, 
  selectedCategory, 
  onSelectCategory 
}: BlogCategoryFilterProps) => {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant={selectedCategory === null ? "default" : "outline"}
        onClick={() => onSelectCategory(null)}
        className="rounded-full"
      >
        All Posts
      </Button>
      {categories.map((category) => (
        <Button
          key={category.id}
          variant={selectedCategory === category.slug ? "default" : "outline"}
          onClick={() => onSelectCategory(category.slug)}
          className="rounded-full"
        >
          {category.name}
        </Button>
      ))}
    </div>
  );
};

export default BlogCategoryFilter;
