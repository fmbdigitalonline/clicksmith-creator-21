
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PricingHeader } from "@/components/pricing/PricingHeader";
import { PricingCard } from "@/components/pricing/PricingCard";
import { PricingFAQ } from "@/components/pricing/PricingFAQ";
import { useToast } from "@/hooks/use-toast";
import { AppLayout } from "@/components/layout/AppLayout";

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

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-pulse text-lg">Loading plans...</div>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh] text-red-500">
          Failed to load pricing plans
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
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
    </AppLayout>
  );
};

export default Pricing;
