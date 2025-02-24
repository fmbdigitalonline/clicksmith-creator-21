
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeSettings } from "@/types/landingPage";

interface BulletPointsListProps {
  points: string[];
  theme?: ThemeSettings;
}

export const BulletPointsList = ({ points, theme }: BulletPointsListProps) => {
  if (!points?.length) return null;

  const getTextClasses = () => {
    return cn(
      "text-gray-600 dark:text-gray-300",
      theme?.typography?.scale?.body,
      theme?.colorScheme?.text && `text-${theme.colorScheme.text}`
    );
  };

  return (
    <div className="space-y-4">
      {points.map((point, index) => (
        <div 
          key={index}
          className="flex items-start gap-3 animate-fade-in"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <Check className={cn(
            "h-5 w-5 mt-1 flex-shrink-0",
            theme?.colorScheme?.primary ? `text-${theme.colorScheme.primary}` : "text-primary"
          )} />
          <p className={getTextClasses()}>{point}</p>
        </div>
      ))}
    </div>
  );
};

