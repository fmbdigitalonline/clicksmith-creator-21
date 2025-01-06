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
  const { toast } = useToast();
  const { projectId } = useParams();

  const handleIdeaSubmit = useCallback(async (idea: BusinessIdea) => {
    try {
      setBusinessIdea(idea);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        await saveWizardProgress({ business_idea: idea }, projectId);
      }
      
      setCurrentStep(2);
    } catch (error) {
      console.error('Error in handleIdeaSubmit:', error);
      // Don't show error toast for anonymous users
      if (error.message !== "User not authenticated") {
        toast({
          title: "Error saving progress",
          description: error instanceof Error ? error.message : "Failed to save progress",
          variant: "destructive",
        });
      }
    }
  }, [projectId, toast]);

  const handleAudienceSelect = useCallback(async (audience: TargetAudience) => {
    try {
      setTargetAudience(audience);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        await saveWizardProgress({ target_audience: audience }, projectId);
      }
      
      setCurrentStep(3);
    } catch (error) {
      console.error('Error in handleAudienceSelect:', error);
      if (error.message !== "User not authenticated") {
        toast({
          title: "Error saving audience",
          description: error instanceof Error ? error.message : "Failed to save audience",
          variant: "destructive",
        });
      }
    }
  }, [projectId, toast]);

  const handleAnalysisComplete = useCallback(async (analysis: AudienceAnalysis) => {
    try {
      setAudienceAnalysis(analysis);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        await saveWizardProgress({ audience_analysis: analysis }, projectId);
      }

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

      if (data?.hooks && Array.isArray(data.hooks)) {
        setSelectedHooks(data.hooks);
        if (user) {
          await saveWizardProgress({ selected_hooks: data.hooks }, projectId);
        }
        setCurrentStep(4);
      } else {
        throw new Error('Invalid hooks data received');
      }
    } catch (error) {
      console.error('Error in handleAnalysisComplete:', error);
      toast({
        title: "Error generating hooks",
        description: error instanceof Error ? error.message : "Failed to generate hooks",
        variant: "destructive",
      });
    }
  }, [businessIdea, targetAudience, projectId, toast]);

  const handleBack = useCallback(() => {
    setCurrentStep(prev => Math.max(1, prev - 1));
  }, []);

  const handleStartOver = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const success = await clearWizardProgress(projectId, user.id);
        if (success) {
          toast({
            title: "Progress Reset",
            description: "Your progress has been cleared successfully.",
          });
        }
      }
      
      setBusinessIdea(null);
      setTargetAudience(null);
      setAudienceAnalysis(null);
      setSelectedHooks([]);
      setCurrentStep(1);
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
  };
};

export default useAdWizardState;