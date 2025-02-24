
import { Check } from "lucide-react";

interface BulletPointsListProps {
  points: string[];
}

export const BulletPointsList = ({ points }: BulletPointsListProps) => {
  if (!points?.length) return null;

  return (
    <div className="space-y-4">
      {points.map((point, index) => (
        <div 
          key={index}
          className="flex items-start gap-3 animate-fade-in"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <Check className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
          <p className="text-gray-600 dark:text-gray-300">{point}</p>
        </div>
      ))}
    </div>
  );
};
