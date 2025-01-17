import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type AuthEvent = 'SIGNED_IN' | 'SIGNED_OUT' | 'TOKEN_REFRESHED' | 'USER_UPDATED';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const handleAuthError = async (error: any, retryCount = 0) => {
    console.error("Auth error:", error);

    if (retryCount < MAX_RETRIES && error.message === "Failed to fetch") {
      console.log(`Retrying auth check... Attempt ${retryCount + 1}/${MAX_RETRIES}`);
      await sleep(RETRY_DELAY * Math.pow(2, retryCount));
      return checkSession(retryCount + 1);
    }

    setIsAuthenticated(false);
    navigate('/login', { replace: true });
    toast({
      title: "Authentication Error",
      description: "Please sign in again",
      variant: "destructive",
    });
  };

  const checkSession = async (retryCount = 0) => {
    try {
      console.log(`Checking session... Attempt ${retryCount + 1}`);
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        throw sessionError;
      }

      if (!session) {
        setIsAuthenticated(false);
        navigate('/login', { replace: true });
        return;
      }

      // Only attempt to refresh if we have a valid session
      if (session) {
        try {
          const { data: { user }, error: refreshError } = await supabase.auth.refreshSession();
          
          if (refreshError) {
            if (refreshError.message.includes('refresh_token_not_found')) {
              console.error("Invalid refresh token, redirecting to login");
              await supabase.auth.signOut();
              setIsAuthenticated(false);
              navigate('/login', { replace: true });
              toast({
                title: "Session Expired",
                description: "Please sign in again",
                variant: "destructive",
              });
              return;
            }
            throw refreshError;
          }

          // Initialize free tier usage for new users
          if (user) {
            const { data: existingUsage, error: usageError } = await supabase
              .from('free_tier_usage')
              .select('*')
              .eq('user_id', user.id)
              .single();

            if (usageError && !usageError.message.includes('Results contain 0 rows')) {
              throw usageError;
            }

            if (!existingUsage) {
              const { error: insertError } = await supabase
                .from('free_tier_usage')
                .insert([{ user_id: user.id, generations_used: 0 }]);

              if (insertError) throw insertError;
            }
            
            setIsAuthenticated(true);
          }
        } catch (error) {
          throw error;
        }
      }
    } catch (error: any) {
      await handleAuthError(error, retryCount);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Check initial session
    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event);
      
      const handleAuthEvent = (event: AuthEvent) => {
        switch (event) {
          case 'SIGNED_OUT':
            setIsAuthenticated(false);
            navigate('/login', { replace: true });
            toast({
              title: "Signed Out",
              description: "You have been signed out",
            });
            break;
          case 'SIGNED_IN':
          case 'TOKEN_REFRESHED':
            setIsAuthenticated(true);
            break;
          case 'USER_UPDATED':
            setIsAuthenticated(!!session);
            break;
        }
      };

      handleAuthEvent(event as AuthEvent);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};