import { useQuery } from "@tanstack/react-query";
import { Coins } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const CreditDisplay = () => {
  const { data: subscription } = useQuery({
    queryKey: ['subscription'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Check if user is admin
      if (user.email === 'info@fmbonline.nl') {
        return {
          credits_remaining: -1,
          plan: { name: 'Admin' }
        };
      }

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

      // Admin doesn't need free tier usage
      if (user.email === 'info@fmbonline.nl') {
        return null;
      }

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
    if (subscription?.credits_remaining === -1) {
      return 'Unlimited credits';
    }
    
    if (subscription?.credits_remaining !== undefined) {
      return `${subscription.credits_remaining} credits`;
    }
    
    const freeUsed = freeUsage?.generations_used || 0;
    const freeRemaining = 30 - freeUsed;
    return `${freeRemaining}/30 free generations`;
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 px-3 py-1.5 text-sm bg-accent rounded-md">
            <Coins className="h-4 w-4" />
            <span>{getCreditsDisplay()}</span>
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