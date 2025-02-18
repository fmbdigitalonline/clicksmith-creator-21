
import React from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface PricingTier {
  title: string;
  price: string;
  description: string;
  features: string[];
  cta: string;
}

interface PricingContent {
  title?: string;
  description?: string;
  items?: PricingTier[];
}

interface PricingSectionProps {
  content: PricingContent;
  layout?: string;
}

const PricingSection: React.FC<PricingSectionProps> = ({ content, layout = "grid" }) => {
  if (!content.items || content.items.length === 0) {
    return null;
  }

  return (
    <section className="py-16 px-4 bg-gray-50">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">{content.title || "Pricing Plans"}</h2>
          {content.description && (
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {content.description}
            </p>
          )}
        </div>

        <div className={`grid ${layout === "grid" ? "md:grid-cols-3" : ""} gap-8 max-w-6xl mx-auto`}>
          {content.items.map((tier, index) => (
            <Card key={index} className="relative">
              <CardHeader>
                <h3 className="text-xl font-bold mb-2">{tier.title}</h3>
                <div className="text-3xl font-bold mb-2">{tier.price}</div>
                <p className="text-gray-600">{tier.description}</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {tier.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <svg
                        className="w-5 h-5 text-green-500 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
                <button className="w-full py-2 px-4 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors">
                  {tier.cta}
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
