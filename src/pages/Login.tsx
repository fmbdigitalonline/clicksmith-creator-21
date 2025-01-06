import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Create free tier usage record for new users
        const { data: existingUsage } = await supabase
          .from('free_tier_usage')
          .select('*')
          .eq('user_id', session.user.id)
          .single();

        if (!existingUsage) {
          await supabase
            .from('free_tier_usage')
            .insert([
              { 
                user_id: session.user.id,
                generations_used: 1 // Start with 1 used (from trial)
              }
            ]);

          toast({
            title: "Welcome to ProfitPilot!",
            description: "You have 11 free credits to start with.",
          });
        }

        navigate("/");
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        checkUser();
      }
    });

    checkUser();

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Welcome to ProfitPilot</h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign up now and get 11 free credits to create amazing ads
          </p>
        </div>
        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#2563eb',
                  brandAccent: '#1d4ed8',
                }
              }
            }
          }}
          providers={[]}
        />
      </div>
    </div>
  );
};

export default Login;