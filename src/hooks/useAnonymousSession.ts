import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';

export const useAnonymousSession = () => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [hasUsedTrial, setHasUsedTrial] = useState(false);

  useEffect(() => {
    const initSession = async () => {
      // Try to get existing session from localStorage
      let existingSession = localStorage.getItem('anonymous_session_id');
      
      if (!existingSession) {
        existingSession = uuidv4();
        localStorage.setItem('anonymous_session_id', existingSession);
      }

      // Check if this session has already been used
      const { data } = await supabase
        .from('anonymous_usage')
        .select('used')
        .eq('session_id', existingSession)
        .single();

      setHasUsedTrial(!!data?.used);
      setSessionId(existingSession);
    };

    initSession();
  }, []);

  const markSessionAsUsed = async () => {
    if (!sessionId) return;

    await supabase
      .from('anonymous_usage')
      .upsert({ 
        session_id: sessionId,
        used: true 
      });

    setHasUsedTrial(true);
  };

  return {
    sessionId,
    hasUsedTrial,
    markSessionAsUsed
  };
};