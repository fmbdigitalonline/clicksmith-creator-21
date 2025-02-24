
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeSettings } from "@/types/landingPage";

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
  theme?: ThemeSettings;
}

export const FeatureGrid = ({ items, layout, theme }: FeatureGridProps) => {
  if (!items?.length) return null;

  const getHeadingClasses = () => {
    return cn(
      "text-xl font-bold",
      theme?.typography?.scale?.h3,
      theme?.colorScheme?.text && `text-${theme.colorScheme.text}`
    );
  };

  const getDescriptionClasses = () => {
    return cn(
      "text-gray-600 dark:text-gray-300",
      theme?.typography?.scale?.body,
      theme?.colorScheme?.muted && `text-${theme.colorScheme.muted}`
    );
  };

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
          className={cn(
            "rounded-xl p-6 transition-all duration-200 transform hover:scale-105 animate-fade-in",
            theme?.style?.shadowStrength === 'strong' && "shadow-2xl",
            theme?.style?.shadowStrength === 'medium' && "shadow-xl",
            theme?.style?.shadowStrength === 'light' && "shadow-md",
            theme?.colorScheme?.background ? `bg-${theme.colorScheme.background}` : "bg-white dark:bg-gray-800"
          )}
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <h3 className={getHeadingClasses()}>{item.title}</h3>
          <p className={getDescriptionClasses()}>{item.description}</p>
          {item.details && (
            <div className="mt-4 space-y-2">
              {item.details.map((detail, dIndex) => (
                <p key={dIndex} className={cn(
                  "text-sm flex items-center",
                  theme?.colorScheme?.muted ? `text-${theme.colorScheme.muted}` : "text-gray-500 dark:text-gray-400"
                )}>
                  <Check className={cn(
                    "h-4 w-4 mr-2",
                    theme?.colorScheme?.primary ? `text-${theme.colorScheme.primary}` : "text-primary"
                  )} />
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
                  className={cn(
                    "inline-block px-3 py-1 rounded-full text-sm",
                    theme?.colorScheme?.primary 
                      ? `bg-${theme.colorScheme.primary}/10 text-${theme.colorScheme.primary}`
                      : "bg-primary/10 text-primary"
                  )}
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

