
import { Info, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Plan {
  id: string;
  name: string;
  price: number;
  credits: number;
  description: string;
  features: string[];
  stripe_price_id: string;
}

interface PricingCardProps {
  plan: Plan;
  onSubscribe: (plan: Plan) => void;
}

export const PricingCard = ({ plan, onSubscribe }: PricingCardProps) => {
  const { toast } = useToast();

  const handleSubscribe = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to subscribe to a plan",
          variant: "destructive",
        });
        return;
      }

      if (!plan.stripe_price_id) {
        toast({
          title: "Configuration error",
          description: "This plan is not properly configured. Please try another plan or contact support.",
          variant: "destructive",
        });
        return;
      }

      console.log('Creating checkout session with price ID:', plan.stripe_price_id);

      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { 
          priceId: plan.stripe_price_id,
          mode: plan.price === 10 ? 'payment' : 'subscription'
        }
      });

      console.log('Checkout response:', data, error);

      if (error) {
        console.error('Checkout error:', error);
        throw error;
      }

      if (data?.url) {
        console.log('Redirecting to:', data.url);
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast({
        title: "Error",
        description: "Failed to start checkout process. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="flex flex-col relative overflow-hidden">
      {plan.price === 29 && (
        <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-4 py-1 rounded-bl-lg text-sm font-medium">
          Most Popular
        </div>
      )}
      <CardHeader>
        <CardTitle className="text-2xl capitalize">{plan.name}</CardTitle>
        <CardDescription>{plan.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="mb-6">
          <span className="text-4xl font-bold">${plan.price}</span>
          <span className="text-muted-foreground">/{plan.price === 10 ? 'one-time' : 'month'}</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="inline-block ml-2 h-4 w-4 text-muted-foreground hover:text-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p>{plan.price === 10 ? 'One-time payment' : 'Billed monthly. Cancel anytime.'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="space-y-4">
          <div className="font-medium text-lg flex items-center gap-2">
            {plan.credits} credits {plan.price === 10 ? '' : 'per month'}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Credits are used for generating AI content and ads</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <ul className="space-y-3">
            {plan.features.map((feature, index) => (
              <li key={index} className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
      <CardFooter className="pt-6 border-t">
        <Button 
          className="w-full"
          onClick={handleSubscribe}
          size="lg"
        >
          {plan.price === 10 ? 'Buy Now' : 'Subscribe Now'}
        </Button>
      </CardFooter>
    </Card>
  );
};
