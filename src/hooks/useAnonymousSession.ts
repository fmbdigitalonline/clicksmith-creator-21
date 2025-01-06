import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

export const useAnonymousSession = () => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [hasUsedTrial, setHasUsedTrial] = useState(false);

  useEffect(() => {
    const initSession = async () => {
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        return;
      }

      // Get or create session ID from localStorage
      let storedSessionId = localStorage.getItem('anonymous_session_id');
      if (!storedSessionId) {
        storedSessionId = uuidv4();
        localStorage.setItem('anonymous_session_id', storedSessionId);
      }
      setSessionId(storedSessionId);

      // Check if session has been used
      const { data: sessionData } = await supabase
        .from('anonymous_usage')
        .select('used')
        .eq('session_id', storedSessionId)
        .maybeSingle();

      if (!sessionData) {
        // Create new session record
        await supabase
          .from('anonymous_usage')
          .insert([{ session_id: storedSessionId, used: false }]);
        setHasUsedTrial(false);
      } else {
        setHasUsedTrial(sessionData.used);
      }
    };

    initSession();
  }, []);

  const markSessionAsUsed = async () => {
    if (!sessionId) return;

    console.log('Marking anonymous session as used:', sessionId);
    
    try {
      const { error } = await supabase
        .from('anonymous_usage')
        .update({ used: true })
        .eq('session_id', sessionId);

      if (error) throw error;
      
      setHasUsedTrial(true);
    } catch (error) {
      console.error('Error marking session as used:', error);
    }
  };

  return {
    sessionId,
    hasUsedTrial,
    markSessionAsUsed,
  };
};