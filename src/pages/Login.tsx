import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/');
      }
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        toast({
          title: "Welcome back!",
          description: "You have successfully logged in.",
        });
        navigate('/');
      } else if (event === 'PASSWORD_RECOVERY') {
        toast({
          title: "Password Reset Email Sent",
          description: "Please check your email for password reset instructions.",
        });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, toast]);

  const handleError = (error: Error) => {
    let errorMessage = "Something went wrong. Please try again.";
    
    if (error.message.includes("Email not confirmed")) {
      errorMessage = "Please check your email and click the confirmation link to verify your account.";
    } else if (error.message.includes("Invalid login credentials")) {
      errorMessage = "The email or password you entered is incorrect. Please try again.";
    } else if (error.message.includes("Email already registered")) {
      errorMessage = "An account with this email already exists. Please try signing in instead.";
    } else if (error.message.includes("Password")) {
      errorMessage = "Your password must be at least 6 characters long.";
    } else if (error.message.includes("rate limit")) {
      errorMessage = "Too many attempts. Please wait a moment before trying again.";
    }

    toast({
      variant: "destructive",
      title: "Unable to Sign In",
      description: errorMessage,
    });
  };

  return (
    <div className="container mx-auto flex items-center justify-center min-h-screen py-8">
      <Card className="w-full max-w-md p-8">
        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            style: {
              button: { background: 'rgb(59 130 246)', color: 'white' },
              anchor: { color: 'rgb(59 130 246)' },
              input: { background: 'white' }
            },
            className: {
              container: 'space-y-4',
              button: 'w-full',
              input: 'w-full'
            }
          }}
          providers={['google', 'github']}
          redirectTo={`${window.location.origin}/`}
          onlyThirdPartyProviders={false}
          localization={{
            variables: {
              sign_up: {
                email_label: 'Email address',
                password_label: 'Create a Password',
                email_input_placeholder: 'Your email address',
                password_input_placeholder: 'Your password',
                button_label: 'Sign up',
                loading_button_label: 'Creating account ...',
                social_provider_text: 'Sign in with {{provider}}',
                link_text: "Don't have an account? Sign up",
                confirmation_text: 'Check your email for the confirmation link'
              },
              sign_in: {
                email_label: 'Email address',
                password_label: 'Your password',
                email_input_placeholder: 'Your email address',
                password_input_placeholder: 'Your password',
                button_label: 'Sign in',
                loading_button_label: 'Signing in ...',
                social_provider_text: 'Sign in with {{provider}}',
                link_text: 'Already have an account? Sign in'
              }
            }
          }}
          onError={handleError}
        />
      </Card>
    </div>
  );
};

export default Login;