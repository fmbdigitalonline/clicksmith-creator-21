
import { useState, useCallback } from "react";
import {
  BusinessIdea,
  TargetAudience,
  AudienceAnalysis,
  AdHook
} from "@/types/adWizard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useParams } from "react-router-dom";
import { saveWizardProgress, clearWizardProgress } from "@/utils/wizardProgress";

export const useAdWizardState = () => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [businessIdea, setBusinessIdea] = useState<BusinessIdea | null>(null);
  const [targetAudience, setTargetAudience] = useState<TargetAudience | null>(null);
  const [audienceAnalysis, setAudienceAnalysis] = useState<AudienceAnalysis | null>(null);
  const [selectedHooks, setSelectedHooks] = useState<AdHook[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { projectId } = useParams();

  const handleIdeaSubmit = useCallback(async (idea: BusinessIdea) => {
    setBusinessIdea(idea);
    await saveWizardProgress({ business_idea: idea, current_step: 2 }, projectId);
    setCurrentStep(2);
  }, [projectId]);

  const handleAudienceSelect = useCallback(async (audience: TargetAudience) => {
    setTargetAudience(audience);
    await saveWizardProgress({ target_audience: audience }, projectId);
    setCurrentStep(3);
  }, [projectId]);

  const generateHooks = async (businessIdea: BusinessIdea, targetAudience: TargetAudience, analysis: AudienceAnalysis) => {
    const maxRetries = 3;
    let retryCount = 0;
    
    while (retryCount < maxRetries) {
      try {
        const { data, error } = await supabase.functions.invoke('generate-ad-content', {
          body: { 
            type: 'hooks',
            businessIdea,
            targetAudience: {
              ...targetAudience,
              audienceAnalysis: analysis
            }
          }
        });

        if (error) throw error;
        if (!data?.hooks || !Array.isArray(data.hooks)) {
          throw new Error('Invalid hooks data received');
        }

        return data.hooks;
      } catch (error) {
        retryCount++;
        if (retryCount === maxRetries) throw error;
        
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
      }
    }
  };

  const handleAnalysisComplete = useCallback(async (analysis: AudienceAnalysis) => {
    if (isLoading || !businessIdea || !targetAudience) {
      console.log('Skipping: already processing or missing required data');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // First save the analysis
      setAudienceAnalysis(analysis);
      await saveWizardProgress({ audience_analysis: analysis }, projectId);

      // Then generate hooks with retry mechanism
      const hooks = await generateHooks(businessIdea, targetAudience, analysis);
      
      // Save hooks and update state
      await saveWizardProgress({ selected_hooks: hooks }, projectId);
      setSelectedHooks(hooks);
      
      // Only advance step after everything is successful
      setCurrentStep(4);
    } catch (error) {
      console.error('Error in handleAnalysisComplete:', error);
      
      let errorMessage = "Failed to generate hooks";
      if (error instanceof Error) {
        if (error.message.includes('Extension context invalidated')) {
          errorMessage = "Connection error. Please try again.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [businessIdea, targetAudience, toast, projectId, isLoading]);

  const handleBack = useCallback(() => {
    setCurrentStep(prev => Math.max(1, prev - 1));
  }, []);

  const handleStartOver = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const success = await clearWizardProgress(projectId, user.id);
      
      if (success) {
        setBusinessIdea(null);
        setTargetAudience(null);
        setAudienceAnalysis(null);
        setSelectedHooks([]);
        setCurrentStep(1);

        toast({
          title: "Progress Reset",
          description: "Your progress has been cleared successfully.",
        });
      }
    } catch (error) {
      console.error('Error in handleStartOver:', error);
      toast({
        title: "Error",
        description: "Failed to clear progress",
        variant: "destructive",
      });
    }
  }, [projectId, toast]);

  const canNavigateToStep = useCallback((step: number): boolean => {
    switch (step) {
      case 1:
        return true;
      case 2:
        return !!businessIdea;
      case 3:
        return !!businessIdea && !!targetAudience;
      case 4:
        return !!businessIdea && !!targetAudience && !!audienceAnalysis && selectedHooks.length > 0;
      default:
        return false;
    }
  }, [businessIdea, targetAudience, audienceAnalysis, selectedHooks]);

  return {
    currentStep,
    businessIdea,
    targetAudience,
    audienceAnalysis,
    selectedHooks,
    handleIdeaSubmit,
    handleAudienceSelect,
    handleAnalysisComplete,
    handleBack,
    handleStartOver,
    canNavigateToStep,
    setCurrentStep,
    setBusinessIdea,
    isLoading,
  };
};

export default useAdWizardState;
