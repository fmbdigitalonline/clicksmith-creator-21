import { useState } from "react";
import { BusinessIdea, TargetAudience } from "@/types/adWizard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export const useAudienceGeneration = () => {
  const [audiences, setAudiences] = useState<TargetAudience[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [regenerationCount, setRegenerationCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const generateAudiences = async (businessIdea: BusinessIdea, forceRegenerate: boolean = false) => {
    setIsGenerating(true);
    setError(null);
    
    try {
      const session = await supabase.auth.getSession();
      const authHeader = session.data.session?.access_token 
        ? `Bearer ${session.data.session.access_token}`
        : undefined;

      console.log('Calling generate-ad-content function with params:', { 
        type: 'audience',
        businessIdea, 
        regenerationCount,
        forceRegenerate,
        timestamp: new Date().getTime(),
        authHeader: authHeader ? 'Present' : 'Missing' // Log if auth header is present without exposing token
      });

      const { data, error: supabaseError } = await supabase.functions.invoke('generate-ad-content', {
        body: { 
          type: 'audience',
          businessIdea: businessIdea,
          regenerationCount: forceRegenerate ? regenerationCount + 1 : regenerationCount,
          timestamp: new Date().getTime(),
          forceRegenerate
        },
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
        }
      });

      if (supabaseError) {
        console.error('Supabase function error:', supabaseError);
        throw supabaseError;
      }

      console.log('Response from generate-ad-content:', data);

      if (!data || !Array.isArray(data.audiences)) {
        console.error('Invalid response format:', data);
        throw new Error('Invalid response format from server');
      }

      console.log('Generated audiences:', data.audiences);
      
      if (forceRegenerate) {
        setRegenerationCount(prev => prev + 1);
      }
      
      setAudiences(data.audiences);
      
      if (forceRegenerate) {
        toast({
          title: "Fresh Audiences Generated!",
          description: "New target audiences have been generated based on your business idea.",
        });
      }
    } catch (error) {
      console.error('Error generating audiences:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate audiences';
      setError(errorMessage);
      toast({
        title: "Generation Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    audiences,
    isGenerating,
    error,
    generateAudiences,
  };
};