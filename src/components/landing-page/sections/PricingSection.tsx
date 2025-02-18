
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface PricingProps {
  content?: {
    title?: string;
    subtitle?: string;
    plans?: Array<{
      name: string;
      price: string;
      features: string[];
    }>;
  };
  className?: string;
  layout?: string;
}

const PricingSection = ({ content, className, layout = "grid" }: PricingProps) => {
  const title = content?.title || "Pricing Plans";
  const subtitle = content?.subtitle || "Choose the plan that's right for you";
  const plans = content?.plans || [];

  return (
    <section className={cn("py-16 bg-background", className)}>
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">{title}</h2>
          <p className="text-muted-foreground">{subtitle}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <Card key={index} className={cn(
              "flex flex-col",
              index === 1 && "border-primary shadow-lg scale-105"
            )}>
              <CardHeader>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <div className="text-3xl font-bold mt-2">{plan.price}</div>
              </CardHeader>
              <CardContent className="flex-grow">
                <ul className="space-y-3">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center">
                      <svg
                        className="w-5 h-5 text-green-500 mr-2"
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
              </CardContent>
              <CardFooter>
                <Button className="w-full">Select Plan</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
