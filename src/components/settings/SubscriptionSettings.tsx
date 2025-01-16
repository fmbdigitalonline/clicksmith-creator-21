import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Subscription {
  id: string;
  plan_id: string;
  credits_remaining: number;
  active: boolean;
  current_period_end: string;
  plan: {
    name: string;
    price: number;
    credits: number;
  };
}

interface SubscriptionSettingsProps {
  subscription: Subscription | undefined;
  isLoadingSubscription: boolean;
}

export const SubscriptionSettings = ({ subscription, isLoadingSubscription }: SubscriptionSettingsProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleManageSubscription = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to manage your subscription",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('create-portal-session', {
        body: { returnUrl: window.location.href }
      });

      if (error) {
        console.error('Portal session error:', error);
        throw error;
      }

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No portal URL received');
      }
    } catch (error: any) {
      console.error('Portal session error:', error);
      toast({
        title: "Error",
        description: "Failed to open subscription management portal. Please try again later.",
        variant: "destructive",
      });
    }
  };

  const handleUpgrade = () => {
    navigate('/pricing');
  };

  if (isLoadingSubscription) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            <CardTitle>Subscription</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div>Loading subscription details...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          <CardTitle>Subscription</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {subscription ? (
          <>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium">Current Plan</span>
                <span className="text-lg font-semibold">{subscription.plan?.name || 'Free Plan'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Credits Remaining</span>
                <span className="text-lg font-semibold">{subscription.credits_remaining}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Renewal Date</span>
                <span>{new Date(subscription.current_period_end).toLocaleDateString()}</span>
              </div>
            </div>
            <Button onClick={handleManageSubscription} className="w-full">
              Manage Subscription
            </Button>
          </>
        ) : (
          <div className="space-y-4">
            <p>You don't have an active subscription.</p>
            <Button onClick={handleUpgrade} className="w-full">
              Upgrade Now
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};