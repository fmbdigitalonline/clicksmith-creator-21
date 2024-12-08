import { Auth } from "@supabase/auth-ui-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Card } from "@/components/ui/card";

const Login = () => {
  const navigate = useNavigate();

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
            theme: 'light',
            className: {
              container: 'space-y-4',
              button: 'w-full',
              input: 'w-full'
            }
          }}
        />
      </Card>
    </div>
  );
};

export default Login;