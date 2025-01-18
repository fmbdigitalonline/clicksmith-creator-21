import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AnonymousSessionManagerProps {
  sessionId: string;
}

export const AnonymousSessionManager = ({ sessionId }: AnonymousSessionManagerProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const initializeAnonymousSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Only proceed for anonymous users
      if (!user) {
        localStorage.setItem('anonymous_session_id', sessionId);
        
        try {
          const { data: existingSession } = await supabase
            .from('anonymous_usage')
            .select('*')
            .eq('session_id', sessionId)
            .single();

          if (!existingSession) {
            // Create new anonymous session
            await supabase
              .from('anonymous_usage')
              .insert([{ 
                session_id: sessionId,
                used: false,
                completed: false
              }]);
          } else if (existingSession.completed) {
            // Redirect to signup if they've already completed a session
            toast({
              title: "Trial completed",
              description: "Please sign up to continue using our service.",
              variant: "default",
            });
            navigate('/login');
          }
        } catch (error) {
          console.error('Error managing anonymous session:', error);
        }
      }
    };

    initializeAnonymousSession();
  }, [sessionId, navigate, toast]);

  return null;
};