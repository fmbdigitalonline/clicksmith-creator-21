
import { cn } from "@/lib/utils";

interface FeaturesSectionProps {
  content?: {
    title?: string;
    description?: string;
    items?: Array<{
      title: string;
      description: string;
      icon?: string;
    }>;
  };
  className?: string;
}

const FeaturesSection = ({ content, className }: FeaturesSectionProps) => {
  // Provide default values and handle undefined cases
  const items = Array.isArray(content?.items) ? content.items : [];
  const title = String(content?.title || "Key Features");
  const description = String(content?.description || '');

  // Function to safely stringify any value
  const safeString = (value: any): string => {
    if (typeof value === 'string') return value;
    if (value === null || value === undefined) return '';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  return (
    <section className={cn("py-16 bg-background border-t border-b border-gray-100", className)}>
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">{safeString(title)}</h2>
          {description && (
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {safeString(description)}
            </p>
          )}
        </div>
        {items.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {items.map((feature, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                {feature.icon && (
                  <div className="text-2xl mb-4">{safeString(feature.icon)}</div>
                )}
                <h3 className="text-xl font-semibold mb-3">
                  {safeString(feature.title)}
                </h3>
                <p className="text-muted-foreground">
                  {safeString(feature.description)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturesSection;
