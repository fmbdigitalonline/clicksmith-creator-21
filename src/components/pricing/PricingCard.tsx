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

      onSubscribe(plan);
    } catch (error: any) {
      console.error('Subscription error:', error);
      toast({
        title: "Error",
        description: "Failed to process subscription. Please try again.",
        variant: "destructive",
      });
    }
  };

  const isFreePlan = plan.name === 'Free Trial';
  const isPopular = plan.name === 'Starter';

  return (
    <Card className="flex flex-col relative overflow-hidden">
      {isPopular && (
        <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-4 py-1 rounded-bl-lg text-sm font-medium">
          Most Popular
        </div>
      )}
      <CardHeader>
        <CardTitle className="text-2xl">{plan.name}</CardTitle>
        <CardDescription>{plan.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="mb-6">
          <span className="text-4xl font-bold">${plan.price}</span>
          {!isFreePlan && <span className="text-muted-foreground">/month</span>}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="inline-block ml-2 h-4 w-4 text-muted-foreground hover:text-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p>{isFreePlan ? 'No credit card required' : 'Billed monthly. Cancel anytime.'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="space-y-4">
          <div className="font-medium text-lg flex items-center gap-2">
            {plan.credits} credits {!isFreePlan && 'per month'}
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
          variant={isFreePlan ? "outline" : "default"}
        >
          {isFreePlan ? 'Start Free Trial' : 'Subscribe Now'}
        </Button>
      </CardFooter>
    </Card>
  );
};