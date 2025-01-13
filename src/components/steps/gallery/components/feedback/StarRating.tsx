import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  onRate: (stars: number) => void;
}

export const StarRating = ({ rating, onRate }: StarRatingProps) => {
  return (
    <div className="flex space-x-1">
      {[1, 2, 3, 4, 5].map((stars) => (
        <Button
          key={stars}
          variant="ghost"
          size="sm"
          className={cn(
            "p-0 h-8 w-8",
            rating >= stars && "text-yellow-400"
          )}
          onClick={() => onRate(stars)}
        >
          <Star className="h-4 w-4" fill={rating >= stars ? "currentColor" : "none"} />
        </Button>
      ))}
    </div>
  );
};