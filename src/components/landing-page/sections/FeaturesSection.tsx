
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
    <section className={cn("py-16 bg-muted/50", className)}>
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">{title}</h2>
          {description && (
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {description}
            </p>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {items.map((feature, index) => (
            <div key={index} className="p-6">
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
