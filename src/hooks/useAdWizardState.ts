import { useState, useCallback, useEffect } from "react";
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

  useEffect(() => {
    const loadSavedProgress = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // For new projects, clear any existing progress and start from step 1
        if (projectId === 'new') {
          await clearWizardProgress(projectId, user.id);
          setBusinessIdea(null);
          setTargetAudience(null);
          setAudienceAnalysis(null);
          setSelectedHooks([]);
          setCurrentStep(1);
          return;
        }

        // Try to load from project if we have a project ID
        if (projectId) {
          const { data: project } = await supabase
            .from('projects')
            .select('*')
            .eq('id', projectId)
            .single();

          if (project) {
            // Set project data
            setBusinessIdea(project.business_idea as BusinessIdea);
            setTargetAudience(project.target_audience as TargetAudience);
            setAudienceAnalysis(project.audience_analysis as AudienceAnalysis);
            const hooks = Array.isArray(project.selected_hooks) ? project.selected_hooks : [];
            setSelectedHooks(hooks as AdHook[]);
            
            // Set appropriate step based on available data
            if (hooks.length > 0) {
              setCurrentStep(4);
            } else if (project.audience_analysis) {
              setCurrentStep(3);
            } else if (project.target_audience) {
              setCurrentStep(2);
            } else {
              setCurrentStep(1);
            }
            return;
          }
        }

        // If no project or it's invalid, load from wizard_progress
        const { data: wizardData } = await supabase
          .from('wizard_progress')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (wizardData) {
          setBusinessIdea(wizardData.business_idea as BusinessIdea);
          setTargetAudience(wizardData.target_audience as TargetAudience);
          setAudienceAnalysis(wizardData.audience_analysis as AudienceAnalysis);
          const hooks = Array.isArray(wizardData.selected_hooks) ? wizardData.selected_hooks : [];
          setSelectedHooks(hooks as AdHook[]);
          
          // Set appropriate step based on wizard progress
          if (hooks.length > 0) {
            setCurrentStep(4);
          } else if (wizardData.audience_analysis) {
            setCurrentStep(3);
          } else if (wizardData.target_audience) {
            setCurrentStep(2);
          } else {
            setCurrentStep(1);
          }
        }
      } catch (error) {
        console.error('Error loading saved progress:', error);
        // On error, start fresh from step 1
        setCurrentStep(1);
      }
    };

    loadSavedProgress();
  }, [projectId]);

  const handleIdeaSubmit = useCallback(async (idea: BusinessIdea) => {
    setBusinessIdea(idea);
    await saveWizardProgress({ business_idea: idea }, projectId);
    setCurrentStep(2);
  }, [projectId]);

  const handleAudienceSelect = useCallback(async (audience: TargetAudience) => {
    try {
      setTargetAudience(audience);
      await saveWizardProgress({ target_audience: audience }, projectId);

      console.log('Generating audience analysis for:', audience);
      
      const { data, error } = await supabase.functions.invoke('generate-ad-content', {
        body: { 
          type: 'audience_analysis',
          businessIdea,
          targetAudience: audience
        }
      });

      if (error) {
        console.error('Error generating audience analysis:', error);
        toast({
          title: "Analysis Generation Failed",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      if (!data?.analysis) {
        throw new Error('Invalid response format from audience analysis');
      }

      console.log('Generated audience analysis:', data.analysis);
      setAudienceAnalysis(data.analysis);
      await saveWizardProgress({ audience_analysis: data.analysis }, projectId);
      setCurrentStep(3);
    } catch (error) {
      console.error('Error in handleAudienceSelect:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to analyze audience",
        variant: "destructive",
      });
    }
  }, [businessIdea, projectId, toast]);

  const handleAnalysisComplete = useCallback(async (analysis: AudienceAnalysis) => {
    try {
      setAudienceAnalysis(analysis);
      await saveWizardProgress({ audience_analysis: analysis }, projectId);

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

      if (error) {
        toast({
          title: "Error generating hooks",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      if (data?.hooks && Array.isArray(data.hooks)) {
        setSelectedHooks(data.hooks);
        await saveWizardProgress({ selected_hooks: data.hooks }, projectId);
        setCurrentStep(4);
      } else {
        throw new Error('Invalid hooks data received');
      }
    } catch (error) {
      console.error('Error in handleAnalysisComplete:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate hooks",
        variant: "destructive",
      });
    }
  }, [businessIdea, targetAudience, toast, projectId]);

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
        return !!businessIdea && !!targetAudience && !!audienceAnalysis;
      default:
        return false;
    }
  }, [businessIdea, targetAudience, audienceAnalysis]);

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
