import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md p-6 space-y-4">
        <h1 className="text-2xl font-bold text-center mb-6">Welcome to Ad Creator</h1>
        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            className: {
              container: 'space-y-4',
              button: 'w-full',
              input: 'w-full'
            },
            style: {
              button: { background: 'rgb(59 130 246)', color: 'white' },
              anchor: { color: 'rgb(59 130 246)' },
            }
          }}
          providers={['google', 'github']}
          localization={{
            variables: {
              sign_up: {
                password_label: 'Password (minimum 6 characters)',
                password_input_placeholder: 'Your password (min. 6 characters)'
              },
              sign_in: {
                password_label: 'Your password',
                password_input_placeholder: 'Your password'
              }
            }
          }}
          onError={(error) => {
            toast({
              title: "Error",
              description: error.message,
              variant: "destructive"
            });
          }}
        />
      </Card>
    </div>
  );
};

export default Login;