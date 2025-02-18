
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface PricingSectionProps {
  content?: {
    title?: string;
    description?: string;
    items?: Array<{
      title: string;
      price: string;
      description: string;
      features: string[];
    }>;
  };
  className?: string;
}

const PricingSection = ({ content, className }: PricingSectionProps) => {
  const items = content?.items || [];
  const title = content?.title || "Simple Pricing";
  const description = content?.description || "Choose the plan that works for you";

  return (
    <section className={cn("py-16 bg-background border-t border-b border-gray-100", className)}>
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">{title}</h2>
          {description && (
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {description}
            </p>
          )}
        </div>
        {items.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {items.map((plan, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <h3 className="text-xl font-semibold mb-3">{plan.title}</h3>
                <div className="text-3xl font-bold mb-4">{plan.price}</div>
                <p className="text-muted-foreground mb-6">{plan.description}</p>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <span className="mr-2">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button className="w-full">Get Started</Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-muted-foreground">
            Pricing plans coming soon...
          </div>
        )}
      </div>
    </section>
  );
};

export default PricingSection;
