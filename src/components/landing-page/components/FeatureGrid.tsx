
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeatureItem {
  title: string;
  description: string;
  details?: string[];
  highlights?: string[];
}

interface FeatureGridProps {
  items: FeatureItem[];
  layout: {
    style?: 'grid' | 'columns';
  };
}

export const FeatureGrid = ({ items, layout }: FeatureGridProps) => {
  if (!items?.length) return null;

  return (
    <div className={cn(
      "grid gap-8",
      layout?.style === 'grid' && "grid-cols-1 md:grid-cols-3",
      layout?.style === 'columns' && "grid-cols-1 md:grid-cols-2",
      "max-w-7xl mx-auto"
    )}>
      {items.map((item, index) => (
        <div 
          key={index} 
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-105 animate-fade-in"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{item.title}</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">{item.description}</p>
          {item.details && (
            <div className="mt-4 space-y-2">
              {item.details.map((detail, dIndex) => (
                <p key={dIndex} className="text-gray-500 dark:text-gray-400 text-sm flex items-center">
                  <Check className="h-4 w-4 text-primary mr-2" />
                  {detail}
                </p>
              ))}
            </div>
          )}
          {item.highlights && (
            <div className="mt-4 flex flex-wrap gap-2">
              {item.highlights.map((highlight, hIndex) => (
                <span 
                  key={hIndex} 
                  className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full text-sm"
                >
                  {highlight}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
