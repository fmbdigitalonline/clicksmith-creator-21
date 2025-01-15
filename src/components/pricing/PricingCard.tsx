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
  console.log('Rendering pricing card for plan:', plan);

  const handleSubscribe = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Sign in required",
          description: "Please sign in to your account first to subscribe to this plan.",
          variant: "destructive",
        });
        return;
      }

      console.log('Creating checkout session for plan:', plan);
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { 
          priceId: plan.stripe_price_id,
          mode: plan.name.toLowerCase().includes('bundle') ? 'payment' : 'subscription'
        }
      });

      console.log('Checkout response:', data, error);

      if (error) {
        console.error('Checkout error:', error);
        let friendlyMessage = "We're having trouble setting up your payment. Please try again in a few moments.";
        
        // Customize messages based on common error scenarios
        if (error.message?.includes('payment method type')) {
          friendlyMessage = "This payment method isn't available in your region yet. Please try using a credit card instead.";
        } else if (error.message?.includes('stripe_price_id')) {
          friendlyMessage = "There seems to be an issue with this plan. Our team has been notified and we're working on fixing it.";
        }

        toast({
          title: "Oops! Something went wrong",
          description: friendlyMessage,
          variant: "destructive",
        });
        return;
      }

      if (data?.url) {
        console.log('Redirecting to:', data.url);
        window.location.href = data.url;
      } else {
        toast({
          title: "Something's not quite right",
          description: "We couldn't set up your payment page. Please try again or contact our support if this keeps happening.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast({
        title: "Unable to process your request",
        description: "We're experiencing some technical difficulties. Please try again in a few moments or contact our support team if the issue persists.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="flex flex-col relative overflow-hidden">
      {plan.name === 'Pro Package' && (
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
          <span className="text-muted-foreground">/month</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="inline-block ml-2 h-4 w-4 text-muted-foreground hover:text-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Monthly subscription. Cancel anytime.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="space-y-4">
          <div className="font-medium text-lg flex items-center gap-2">
            {plan.credits.toLocaleString()} credits per month
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
          Subscribe Now
        </Button>
      </CardFooter>
    </Card>
  );
};