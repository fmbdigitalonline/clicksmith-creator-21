
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface PricingItem {
  name: string;
  price: string;
  features: string[];
}

interface PricingSectionProps {
  content?: {
    title?: string;
    description?: string;
    items?: PricingItem[];
  };
  className?: string;
}

const PricingSection = ({ content, className }: PricingSectionProps) => {
  const title = content?.title || "Simple, Transparent Pricing";
  const description = content?.description || "Choose the plan that's right for you";
  const items = content?.items || [];

  return (
    <section className={cn("py-24 bg-gray-50", className)}>
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-6">{title}</h2>
          <p className="text-xl text-gray-600">{description}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {items.map((plan, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100"
            >
              <h3 className="text-2xl font-bold mb-4">{plan.name}</h3>
              <div className="text-4xl font-bold mb-8">{plan.price}</div>
              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center text-gray-600">
                    <svg
                      className="w-5 h-5 text-primary mr-2 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              <Button className="w-full bg-primary hover:bg-primary/90">
                Choose {plan.name}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
