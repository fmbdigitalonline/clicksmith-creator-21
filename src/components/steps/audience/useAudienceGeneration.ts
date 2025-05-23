
import { useState } from "react";
import { BusinessIdea, TargetAudience } from "@/types/adWizard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useTranslation } from "react-i18next";

export const useAudienceGeneration = () => {
  const [audiences, setAudiences] = useState<TargetAudience[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [regenerationCount, setRegenerationCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { i18n, t } = useTranslation();

  const generateAudiences = async (businessIdea: BusinessIdea, forceRegenerate: boolean = false) => {
    setIsGenerating(true);
    setError(null);
    
    try {
      const requestBody = {
        type: 'audience',
        businessIdea,
        regenerationCount: forceRegenerate ? regenerationCount + 1 : regenerationCount,
        timestamp: new Date().getTime(),
        forceRegenerate,
        language: i18n.language // Pass the current language
      };

      console.log('Generating audiences with params:', requestBody);

      const { data, error: supabaseError } = await supabase.functions.invoke('generate-ad-content', {
        body: requestBody
      });

      if (supabaseError) {
        console.error('Supabase function error:', supabaseError);
        throw supabaseError;
      }

      console.log('Response from generate-ad-content:', data);

      if (!data || !Array.isArray(data.audiences)) {
        console.error('Invalid response format:', data);
        throw new Error(t('errors.invalid_response', 'Invalid response format from server'));
      }

      if (forceRegenerate) {
        setRegenerationCount(prev => prev + 1);
      }
      
      setAudiences(data.audiences);
      
      if (forceRegenerate) {
        toast({
          title: t('audiences.fresh_generated', "Fresh Audiences Generated!"),
          description: t('audiences.new_generated', "New target audiences have been generated based on your business idea."),
        });
      }
    } catch (error) {
      console.error('Error generating audiences:', error);
      const errorMessage = error instanceof Error ? error.message : t('errors.failed_generate', 'Failed to generate audiences');
      setError(errorMessage);
      toast({
        title: t('errors.generation_failed', "Generation Failed"),
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
