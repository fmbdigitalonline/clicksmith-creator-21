
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
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation(['auth', 'common']);

  const form = useForm<FormData>({
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false
    }
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      if (isSignUp) {
        const { data: signUpData, error } = await supabase.auth.signUp({
          email: data.email,
          password: data.password
        });
        
        if (error) throw error;
        
        if (signUpData.user) {
          toast({
            title: t('register.success', 'Welcome!'),
            description: t('register.success_description', 'Your account has been created successfully.'),
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
          title: t('login.success', 'Welcome back!'),
          description: t('login.success_description', 'You have successfully logged in.'),
        });
        navigate('/dashboard');
      }
    } catch (error: any) {
      toast({
        title: t('errors.auth', 'Authentication error'),
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
                {isSignUp ? t('register.title', 'Create an account') : t('login.title', 'Welcome back')}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isSignUp 
                  ? t('register.subtitle', 'Enter your email to create your account') 
                  : t('login.subtitle', 'Enter your email to sign in to your account')
                }
              </p>
            </div>

            <div className="flex items-center gap-2 justify-center text-primary">
              <BadgeCheck className="h-6 w-6" />
              <span className="font-semibold">{t('credits_included', 'Free Credits Included!', { ns: 'common' })}</span>
            </div>
            
            <Alert className="bg-primary/5 border-primary/10">
              <AlertDescription className="text-sm text-center">
                {t('start_validating', 'Start validating your ideas today with free credits. No credit card required.', { ns: 'common' })}
              </AlertDescription>
            </Alert>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('login.email', 'Email')}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input 
                            placeholder={t('email_placeholder', 'name@example.com', { ns: 'common' })} 
                            {...field}
                            className="pl-10"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('login.password', 'Password')}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input 
                            type="password" 
                            placeholder={t('password_placeholder', 'Enter your password', { ns: 'common' })}
                            {...field}
                            className="pl-10"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                          {t('remember_me', 'Remember me', { ns: 'auth' })}
                        </label>
                      </div>
                    )}
                  />
                  
                  {!isSignUp && (
                    <Link
                      to="/reset-password"
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      {t('login.forgot_password', 'Forgot password?')}
                    </Link>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isSignUp ? t('register.loading', 'Creating account...') : t('login.loading', 'Signing in...')}
                    </>
                  ) : (
                    <>{isSignUp ? t('register.button', 'Create account') : t('login.button', 'Sign in')}</>
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
                  {t('continue_with', 'Or continue with', { ns: 'common' })}
                </span>
              </div>
            </div>

            <div className="text-center">
              <Button
                variant="outline"
                type="button"
                className="w-full"
                onClick={() => setIsSignUp(!isSignUp)}
              >
                {isSignUp 
                  ? t('register.has_account', 'Already have an account? Sign in') 
                  : t('login.no_account', "Don't have an account? Sign up")}
              </Button>
            </div>

            <Alert className="bg-accent/5 border-accent/10">
              <AlertDescription className="text-[11px] text-center text-muted-foreground leading-relaxed">
                {t('terms_agreement', 'By signing up, you agree to our', { ns: 'common' })} <Link to="/terms" className="text-primary hover:underline">{t('terms', 'Terms of Service', { ns: 'common' })}</Link> {t('and', 'and', { ns: 'common' })}{' '}
                <Link to="/privacy" className="text-primary hover:underline">{t('privacy', 'Privacy Policy', { ns: 'common' })}</Link>. {t('notifications_info', "We'll send you product updates and announcements. You can unsubscribe at any time.", { ns: 'common' })}
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
