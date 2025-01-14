import { Check } from "lucide-react";

export const PricingHeader = () => {
  return (
    <div className="text-center mb-12">
      <h1 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h1>
      <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
        Choose the perfect plan for your business needs. Get started with our free trial or upgrade for more features.
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Check className="h-4 w-4 text-green-500" />
          No hidden fees
        </div>
        <div className="flex items-center gap-2">
          <Check className="h-4 w-4 text-green-500" />
          Cancel anytime
        </div>
        <div className="flex items-center gap-2">
          <Check className="h-4 w-4 text-green-500" />
          Secure payment
        </div>
      </div>
    </div>
  );
};