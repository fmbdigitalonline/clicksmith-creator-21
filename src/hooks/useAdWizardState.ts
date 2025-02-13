
import { useState, useCallback, useEffect } from "react";
import {
  BusinessIdea,
  TargetAudience,
  AudienceAnalysis,
  AdHook
} from "@/types/adWizard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useParams } from "react-router-dom";
import { saveWizardProgress, clearWizardProgress } from "@/utils/wizardProgress";

export const useAdWizardState = () => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [businessIdea, setBusinessIdea] = useState<BusinessIdea | null>(null);
  const [targetAudience, setTargetAudience] = useState<TargetAudience | null>(null);
  const [audienceAnalysis, setAudienceAnalysis] = useState<AudienceAnalysis | null>(null);
  const [selectedHooks, setSelectedHooks] = useState<AdHook[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [autoCreatedProjectId, setAutoCreatedProjectId] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { projectId } = useParams();

  // Create project automatically when starting new wizard
  useEffect(() => {
    const createInitialProject = async () => {
      if (projectId === "new" && !autoCreatedProjectId) {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          // Get count of existing projects for this user
          const { count } = await supabase
            .from('projects')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);

          const projectNumber = (count || 0) + 1;
          const projectTitle = `My Ad Campaign ${projectNumber}`;

          const { data, error } = await supabase
            .from("projects")
            .insert({
              title: projectTitle,
              user_id: user.id,
              status: "draft"
            })
            .select()
            .single();

          if (error) {
            console.error('Error creating project:', error);
            throw error;
          }

          setAutoCreatedProjectId(data.id);
          navigate(`/ad-wizard/${data.id}`, { replace: true });
          
          toast({
            title: "Project created",
            description: "Your progress will be saved automatically.",
          });
        } catch (error) {
          console.error('Error creating initial project:', error);
          toast({
            title: "Error",
            description: "Failed to create project",
            variant: "destructive",
          });
        }
      }
    };

    createInitialProject();
  }, [projectId, navigate, toast, autoCreatedProjectId]);

  const handleIdeaSubmit = useCallback(async (idea: BusinessIdea) => {
    setBusinessIdea(idea);
    await saveWizardProgress({ 
      business_idea: idea,
      current_step: 2
    }, autoCreatedProjectId || projectId);
    setCurrentStep(2);
  }, [projectId, autoCreatedProjectId]);

  const handleAudienceSelect = useCallback(async (audience: TargetAudience) => {
    setTargetAudience(audience);
    await saveWizardProgress({ 
      target_audience: audience,
      current_step: 3
    }, autoCreatedProjectId || projectId);
    setCurrentStep(3);
  }, [projectId, autoCreatedProjectId]);

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
      setAudienceAnalysis(analysis);
      await saveWizardProgress({ 
        audience_analysis: analysis,
        current_step: 3
      }, autoCreatedProjectId || projectId);

      const hooks = await generateHooks(businessIdea, targetAudience, analysis);
      
      await saveWizardProgress({ 
        selected_hooks: hooks,
        current_step: 4
      }, autoCreatedProjectId || projectId);
      
      setSelectedHooks(hooks);
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
  }, [businessIdea, targetAudience, toast, projectId, autoCreatedProjectId, isLoading]);

  const handleBack = useCallback(() => {
    setCurrentStep(prev => Math.max(1, prev - 1));
  }, []);

  const handleStartOver = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const success = await clearWizardProgress(projectId || autoCreatedProjectId, user.id);
      
      if (success) {
        setBusinessIdea(null);
        setTargetAudience(null);
        setAudienceAnalysis(null);
        setSelectedHooks([]);
        setCurrentStep(1);

        // If using auto-created project, create a new one
        if (autoCreatedProjectId) {
          setAutoCreatedProjectId(null);
          navigate('/ad-wizard/new', { replace: true });
        }

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
  }, [projectId, autoCreatedProjectId, navigate, toast]);

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
    isLoading,
  };
};

export default useAdWizardState;
