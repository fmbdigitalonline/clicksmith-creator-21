import { useEffect, useState } from "react";
import { Navigate, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type AuthEvent = 'SIGNED_IN' | 'SIGNED_OUT' | 'TOKEN_REFRESHED' | 'USER_UPDATED';

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const location = useLocation();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Session error:", sessionError);
          setIsAuthenticated(false);
          navigate('/login', { replace: true });
          return;
        }

        if (!session) {
          setIsAuthenticated(false);
          navigate('/login', { replace: true });
          return;
        }

        // Only attempt to refresh if we have a valid session
        if (session) {
          try {
            // Detect if we're in an OAuth flow by checking URL parameters
            const searchParams = new URLSearchParams(location.search);
            const isInOAuthFlow = (
              searchParams.has('code') && 
              searchParams.has('connection') && 
              !searchParams.has('error')
            );
            
            // Add OAuth state parameter detection
            const hasOAuthState = searchParams.has('state');
            const isValidOAuthState = hasOAuthState && validateOAuthState(searchParams.get('state'));
            
            // Skip token refresh during OAuth flow to prevent interruptions
            if (isInOAuthFlow && (isValidOAuthState || !hasOAuthState)) {
              console.log("Detected valid OAuth flow, skipping token refresh");
              setIsAuthenticated(true);
              setIsLoading(false);
              return;
            }
            
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
                .maybeSingle();

              if (usageError && !usageError.message.includes('PGRST116')) {
                console.error("Error checking free tier usage:", usageError);
                throw usageError;
              }

              if (!existingUsage) {
                const { error: insertError } = await supabase
                  .from('free_tier_usage')
                  .insert([{ user_id: user.id, generations_used: 0 }]);

                if (insertError) {
                  console.error("Error initializing free tier usage:", insertError);
                  throw insertError;
                }
              }
              
              setIsAuthenticated(true);
            }
          } catch (error) {
            // Special handling for errors during OAuth flow
            const searchParams = new URLSearchParams(location.search);
            const isInOAuthFlow = searchParams.has('code') && searchParams.has('connection');
            
            if (isInOAuthFlow) {
              console.log("Auth error during OAuth flow, but continuing to allow completion:", error);
              setIsAuthenticated(true);
            } else {
              console.error("Token refresh error:", error);
              setIsAuthenticated(false);
              navigate('/login', { replace: true });
              toast({
                title: "Authentication Error",
                description: "Please sign in again",
                variant: "destructive",
              });
            }
          }
        }
      } catch (error) {
        console.error("Auth error:", error);
        setIsAuthenticated(false);
        navigate('/login', { replace: true });
      } finally {
        setIsLoading(false);
      }
    };

    // Helper function to validate OAuth state
    function validateOAuthState(stateParam: string | null): boolean {
      if (!stateParam) return false;
      
      try {
        const parsedState = JSON.parse(decodeURIComponent(stateParam));
        
        // Basic validation - must have timestamp and nonce
        if (!parsedState.timestamp || !parsedState.nonce) {
          return false;
        }
        
        // Check if state is expired (older than 1 hour)
        const stateTime = new Date(parsedState.timestamp);
        const currentTime = new Date();
        const hourInMs = 60 * 60 * 1000;
        
        if (currentTime.getTime() - stateTime.getTime() > hourInMs) {
          return false;
        }
        
        return true;
      } catch (error) {
        console.error("Error validating OAuth state:", error);
        return false;
      }
    }

    // Check initial session
    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event);
      
      // Skip handling auth events during OAuth flow
      const searchParams = new URLSearchParams(location.search);
      const isInOAuthFlow = searchParams.has('code') && searchParams.has('connection');
      
      if (isInOAuthFlow) {
        console.log("Skipping auth event handling during OAuth flow");
        return;
      }
      
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
  }, [navigate, toast, location.search]);

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
