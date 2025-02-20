
import { Check } from "lucide-react";

interface BulletPointsListProps {
  points: string[];
}

export const BulletPointsList = ({ points }: BulletPointsListProps) => {
  if (!points?.length) return null;

  return (
    <div className="max-w-3xl mx-auto">
      <ul className="space-y-4 list-none">
        {points.map((point, index) => (
          <li 
            key={index} 
            className="flex items-start space-x-3 animate-fade-in"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <Check className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
            <span className="text-lg text-gray-600 dark:text-gray-300">{point}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};
