import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { User } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";

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

const Settings = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    
    getUser();
  }, []);

  const { data: subscription, isLoading: isLoadingSubscription } = useQuery({
    queryKey: ['subscription'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          *,
          plan:plans(
            name,
            price,
            credits
          )
        `)
        .eq('user_id', user?.id)
        .eq('active', true)
        .single();

      if (error) throw error;
      return data as Subscription;
    },
    enabled: !!user,
  });

  const handleManageSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('create-portal-session', {
        body: { returnUrl: window.location.href }
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Portal session error:', error);
      toast({
        title: "Error",
        description: "Failed to open subscription management portal.",
        variant: "destructive",
      });
    }
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleUpgrade = () => {
    navigate('/pricing');
  };

  return (
    <div className="container mx-auto py-6">
      <h2 className="text-3xl font-bold tracking-tight mb-6">Settings</h2>
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={user?.email || ""}
                disabled
              />
            </div>
            <Button variant="destructive" onClick={handleSignOut}>
              Sign Out
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subscription</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoadingSubscription ? (
              <div>Loading subscription details...</div>
            ) : subscription ? (
              <>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Current Plan</span>
                    <span className="text-lg font-semibold">{subscription.plan.name}</span>
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
      </div>
    </div>
  );
};

export default Settings;