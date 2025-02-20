
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, Link } from "react-router-dom";
import { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BadgeCheck } from "lucide-react";
import LandingNav from "@/components/LandingNav";

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/dashboard');
      }
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        toast({
          title: "Welcome!",
          description: "You have successfully logged in. Enjoy your free credits!",
        });
        navigate('/dashboard');
      } else if (event === 'SIGNED_OUT') {
        toast({
          title: "Signed out",
          description: "You have been signed out successfully.",
        });
      } else if (event === 'USER_UPDATED') {
        toast({
          title: "Profile updated",
          description: "Your profile has been updated successfully.",
        });
      } else if (event === 'PASSWORD_RECOVERY') {
        toast({
          title: "Password Reset Email Sent",
          description: "Please check your email for password reset instructions.",
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, toast]);

  return (
    <>
      <LandingNav />
      <div className="container mx-auto flex items-center justify-center min-h-screen py-8">
        <Card className="w-full max-w-md p-8">
          <div className="mb-6 space-y-4">
            <div className="flex items-center gap-2 justify-center text-primary">
              <BadgeCheck className="h-6 w-6" />
              <span className="font-semibold">Free Credits Included!</span>
            </div>
            <Alert className="bg-primary/5 border-primary/10">
              <AlertDescription className="text-sm text-center">
                Start validating your ideas today with free credits. No credit card required.
              </AlertDescription>
            </Alert>
          </div>
          
          <Auth
            supabaseClient={supabase}
            view="sign_in"
            appearance={{
              theme: ThemeSupa,
              style: {
                button: { background: 'rgb(59 130 246)', color: 'white' },
                anchor: { color: 'rgb(59 130 246)' },
                input: { background: 'white' },
                message: { color: 'rgb(239 68 68)' },
              },
              className: {
                container: 'space-y-4',
                button: 'w-full',
                input: 'w-full',
                message: 'text-sm font-medium text-destructive',
              }
            }}
            redirectTo={`${window.location.origin}/dashboard`}
            onlyThirdPartyProviders={false}
            providers={[]}
            magicLink={false}
            showLinks={true}
            localization={{
              variables: {
                sign_in: {
                  email_label: 'Email address',
                  password_label: 'Your password',
                  email_input_placeholder: 'Your email address',
                  password_input_placeholder: 'Password (minimum 6 characters)',
                  button_label: 'Sign in',
                  loading_button_label: 'Signing in ...',
                  link_text: "Don't have an account? Sign up and get free credits"
                },
                sign_up: {
                  email_label: 'Email address',
                  password_label: 'Create a Password',
                  email_input_placeholder: 'Your email address',
                  password_input_placeholder: 'Password (minimum 6 characters)',
                  button_label: 'Sign up and get free credits',
                  loading_button_label: 'Creating account ...',
                  link_text: "Already have an account? Sign in",
                  confirmation_text: 'Check your email for the confirmation link'
                }
              }
            }}
          />
          
          <div className="mt-6">
            <Alert className="bg-accent/5 border-accent/10">
              <AlertDescription className="text-[11px] text-center text-muted-foreground leading-relaxed">
                By signing up, you agree to our <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link> and{' '}
                <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>. We'll send you product updates and announcements. You can unsubscribe at any time.
              </AlertDescription>
            </Alert>
          </div>
        </Card>
      </div>
    </>
  );
};

export default Login;
