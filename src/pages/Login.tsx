
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BadgeCheck, Mail, Lock, Loader2 } from "lucide-react";
import LandingNav from "@/components/LandingNav";
import IndexFooter from "@/components/IndexFooter";
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";

type FormData = {
  email: string;
  password: string;
  rememberMe?: boolean;
};

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);

  const form = useForm<FormData>({
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false
    }
  });

  const handlePasswordReset = async (email: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast({
        title: "Password Reset Email Sent",
        description: "Check your email for the password reset link.",
      });
      setIsResetMode(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      if (isResetMode) {
        await handlePasswordReset(data.email);
        return;
      }

      if (isSignUp) {
        const { data: signUpData, error } = await supabase.auth.signUp({
          email: data.email,
          password: data.password
        });
        
        if (error) throw error;
        
        if (signUpData.user) {
          toast({
            title: "Welcome!",
            description: "Your account has been created successfully.",
          });
          navigate('/dashboard');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });
        
        if (error) throw error;
        
        toast({
          title: "Welcome back!",
          description: "You have successfully logged in.",
        });
        navigate('/dashboard');
      }
    } catch (error: any) {
      toast({
        title: "Authentication error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <LandingNav />
      <div className="min-h-screen flex flex-col">
        <div className="flex-grow container mx-auto flex items-center justify-center py-8">
          <Card className="w-full max-w-md p-8 space-y-6">
            <div className="space-y-2 text-center">
              <h1 className="text-2xl font-semibold tracking-tight">
                {isResetMode ? "Reset Password" : (isSignUp ? "Create an account" : "Welcome back")}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isResetMode 
                  ? "Enter your email to reset your password"
                  : (isSignUp 
                    ? "Enter your email to create your account" 
                    : "Enter your email to sign in to your account"
                  )
                }
              </p>
            </div>

            <div className="flex items-center gap-2 justify-center text-primary">
              <BadgeCheck className="h-6 w-6" />
              <span className="font-semibold">Free Credits Included!</span>
            </div>
            
            <Alert className="bg-primary/5 border-primary/10">
              <AlertDescription className="text-sm text-center">
                Start validating your ideas today with free credits. No credit card required.
              </AlertDescription>
            </Alert>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input 
                            placeholder="name@example.com" 
                            {...field}
                            className="pl-10"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {!isResetMode && (
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input 
                              type="password" 
                              placeholder="Enter your password"
                              {...field}
                              className="pl-10"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {!isResetMode && (
                  <div className="flex items-center justify-between">
                    <FormField
                      control={form.control}
                      name="rememberMe"
                      render={({ field }) => (
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="rememberMe"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                          <label
                            htmlFor="rememberMe"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Remember me
                          </label>
                        </div>
                      )}
                    />
                    
                    <button
                      type="button"
                      onClick={() => setIsResetMode(true)}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isResetMode 
                        ? "Sending reset link..." 
                        : (isSignUp ? "Creating account..." : "Signing in...")}
                    </>
                  ) : (
                    <>{isResetMode 
                      ? "Send Reset Link" 
                      : (isSignUp ? "Create account" : "Sign in")}</>
                  )}
                </Button>
              </form>
            </Form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="text-center space-y-2">
              {isResetMode ? (
                <Button
                  variant="outline"
                  type="button"
                  className="w-full"
                  onClick={() => setIsResetMode(false)}
                >
                  Back to sign in
                </Button>
              ) : (
                <Button
                  variant="outline"
                  type="button"
                  className="w-full"
                  onClick={() => setIsSignUp(!isSignUp)}
                >
                  {isSignUp 
                    ? "Already have an account? Sign in" 
                    : "Don't have an account? Sign up"}
                </Button>
              )}
            </div>

            <Alert className="bg-accent/5 border-accent/10">
              <AlertDescription className="text-[11px] text-center text-muted-foreground leading-relaxed">
                By signing up, you agree to our <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link> and{' '}
                <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>. We'll send you product updates and announcements. You can unsubscribe at any time.
              </AlertDescription>
            </Alert>
          </Card>
        </div>
        <IndexFooter />
      </div>
    </>
  );
};

export default Login;
