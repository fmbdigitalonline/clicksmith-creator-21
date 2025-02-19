
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
  const items = content?.items || [];
  const title = content?.title || "Key Features";
  const description = content?.description;

  return (
    <section className={cn("py-24 bg-gray-50", className)}>
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-6">{title}</h2>
          {description && (
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {description}
            </p>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {items.map((feature, index) => (
            <div 
              key={index} 
              className="bg-white p-8 rounded-xl shadow-sm hover:shadow-lg transition-shadow duration-300"
            >
              {feature.icon && (
                <div className="text-3xl mb-6 text-primary">{feature.icon}</div>
              )}
              <h3 className="text-2xl font-semibold mb-4">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
