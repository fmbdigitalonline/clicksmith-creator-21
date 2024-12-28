import { useQuery } from "@tanstack/react-query";
import { Coins } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const CreditDisplay = () => {
  const navigate = useNavigate();
  
  const { data: subscription } = useQuery({
    queryKey: ['subscription'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          credits_remaining,
          plan:plans(name)
        `)
        .eq('user_id', user.id)
        .eq('active', true)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: freeUsage } = useQuery({
    queryKey: ['free-tier-usage'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('free_tier_usage')
        .select('generations_used')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
  });

  const getCreditsDisplay = () => {
    if (subscription?.credits_remaining !== undefined) {
      return subscription.credits_remaining === 0 
        ? "No credits remaining" 
        : `${subscription.credits_remaining} credits`;
    }
    
    const freeUsed = freeUsage?.generations_used || 0;
    const freeRemaining = 60 - freeUsed;
    return freeRemaining <= 0 
      ? "Free tier depleted" 
      : `${freeRemaining}/60 free generations`;
  };

  const handleUpgrade = () => {
    navigate('/pricing');
  };

  const isOutOfCredits = subscription?.credits_remaining === 0 || 
    ((freeUsage?.generations_used || 0) >= 60 && !subscription);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 text-sm bg-accent rounded-md">
              <Coins className="h-4 w-4" />
              <span>{getCreditsDisplay()}</span>
            </div>
            {isOutOfCredits && (
              <Button 
                variant="default" 
                size="sm" 
                onClick={handleUpgrade}
                className="bg-facebook hover:bg-facebook/90"
              >
                Upgrade
              </Button>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {subscription?.plan?.name 
              ? `${subscription.plan.name} Plan`
              : "Free Plan"}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default CreditDisplay;