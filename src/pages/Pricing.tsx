
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PricingHeader } from "@/components/pricing/PricingHeader";
import { PricingCard } from "@/components/pricing/PricingCard";
import { PricingFAQ } from "@/components/pricing/PricingFAQ";
import { useToast } from "@/hooks/use-toast";
import { AppLayout } from "@/components/layout/AppLayout";
import IndexFooter from "@/components/IndexFooter";
import { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";

interface Plan {
  id: string;
  name: string;
  price: number;
  credits: number;
  description: string;
  features: string[];
  stripe_price_id: string;
}

const Pricing = () => {
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };
    checkAuth();
  }, []);

  const { data: plans, isLoading, error } = useQuery({
    queryKey: ['plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .in('price', [10, 29, 99])
        .order('price')
        .eq('active', true)
        .limit(3);
      
      if (error) throw error;
      return data as Plan[];
    }
  });

  const handleSubscribe = async (plan: Plan) => {
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

      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId: plan.stripe_price_id }
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: "Error",
        description: "Failed to start checkout process. Please try again.",
        variant: "destructive",
      });
    }
  };

  const content = (
    <div className="container mx-auto py-6">
      <PricingHeader />

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {plans?.map((plan) => (
          <PricingCard
            key={plan.id}
            plan={plan}
            onSubscribe={handleSubscribe}
          />
        ))}
      </div>

      <PricingFAQ />
    </div>
  );

  if (isLoading) {
    return isAuthenticated ? (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-pulse text-lg">Loading plans...</div>
        </div>
      </AppLayout>
    ) : (
      <div className="flex flex-col min-h-screen">
        <Navigation />
        <div className="flex items-center justify-center min-h-[60vh] mt-16">
          <div className="animate-pulse text-lg">Loading plans...</div>
        </div>
        <IndexFooter />
      </div>
    );
  }

  if (error) {
    return isAuthenticated ? (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh] text-red-500">
          Failed to load pricing plans
        </div>
      </AppLayout>
    ) : (
      <div className="flex flex-col min-h-screen">
        <Navigation />
        <div className="flex items-center justify-center min-h-[60vh] mt-16 text-red-500">
          Failed to load pricing plans
        </div>
        <IndexFooter />
      </div>
    );
  }

  return isAuthenticated ? (
    <AppLayout>{content}</AppLayout>
  ) : (
    <div className="flex flex-col min-h-screen">
      <Navigation />
      <main className="flex-grow mt-16">
        {content}
      </main>
      <IndexFooter />
    </div>
  );
};

export default Pricing;
