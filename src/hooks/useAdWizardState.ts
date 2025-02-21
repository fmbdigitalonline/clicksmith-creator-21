
import { useState, useCallback, useEffect } from "react";
import {
  BusinessIdea,
  TargetAudience,
  AudienceAnalysis,
  AdHook
} from "@/types/adWizard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { saveWizardProgress, clearWizardProgress } from "@/utils/wizardProgress";

export const useAdWizardState = (initialStep?: number) => {
  const [currentStep, setCurrentStep] = useState<number>(initialStep || 1);
  const [businessIdea, setBusinessIdea] = useState<BusinessIdea | null>(null);
  const [targetAudience, setTargetAudience] = useState<TargetAudience | null>(null);
  const [audienceAnalysis, setAudienceAnalysis] = useState<AudienceAnalysis | null>(null);
  const [selectedHooks, setSelectedHooks] = useState<AdHook[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { projectId } = useParams();
  const location = useLocation();
  const [autoCreatedProjectId, setAutoCreatedProjectId] = useState<string | null>(null);

  // Load existing project data
  useEffect(() => {
    const loadProjectData = async () => {
      setIsDataLoaded(false);
      setError(null);
      
      // Check for state from navigation first
      const routerState = location.state as { businessIdea?: BusinessIdea };
      if (routerState?.businessIdea) {
        setBusinessIdea(routerState.businessIdea);
        setIsDataLoaded(true);
        return;
      }

      const currentProjectId = autoCreatedProjectId || projectId;
      if (currentProjectId && currentProjectId !== 'new') {
        try {
          console.log('Loading project data for:', currentProjectId);
          const { data: project, error } = await supabase
            .from('projects')
            .select('*')
            .eq('id', currentProjectId)
            .single();

          if (error) throw error;
          
          if (project) {
            console.log('Loaded project data:', project);
            if (project.business_idea) {
              setBusinessIdea(project.business_idea as BusinessIdea);
            }
            if (project.target_audience) {
              setTargetAudience(project.target_audience as TargetAudience);
            }
            if (project.audience_analysis) {
              setAudienceAnalysis(project.audience_analysis as AudienceAnalysis);
            }
            if (project.selected_hooks) {
              setSelectedHooks(project.selected_hooks as AdHook[]);
            }
            
            // Prioritize initialStep over project.current_step
            if (initialStep) {
              setCurrentStep(initialStep);
            } else if (project.current_step) {
              setCurrentStep(Number(project.current_step));
            }
          }
        } catch (error) {
          console.error('Error loading project:', error);
          setError(error instanceof Error ? error.message : 'Failed to load project data');
        } finally {
          setIsDataLoaded(true);
        }
      } else {
        setIsDataLoaded(true);
      }
    };

    loadProjectData();
  }, [projectId, autoCreatedProjectId, location.state, initialStep]);

  const createInitialProject = async (idea: BusinessIdea) => {
    try {
      console.log('Creating initial project with idea:', idea);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No authenticated user found');
        return null;
      }

      const { count } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      const projectNumber = (count || 0) + 1;
      const projectTitle = `My Ad Campaign ${projectNumber}`;

      const projectData = {
        title: projectTitle,
        user_id: user.id,
        status: "draft",
        current_step: 2,
        business_idea: idea
      };

      const { data, error } = await supabase
        .from("projects")
        .insert(projectData)
        .select()
        .single();

      if (error) {
        console.error('Error creating project:', error);
        throw error;
      }

      console.log('Created new project:', data.id);
      return data.id;
    } catch (error) {
      console.error('Error creating initial project:', error);
      toast({
        title: "Error",
        description: "Failed to create project",
        variant: "destructive",
      });
      return null;
    }
  };

  const handleIdeaSubmit = useCallback(async (idea: BusinessIdea) => {
    if (isCreatingProject) return;
    console.log('Handling idea submit:', idea);
    
    setBusinessIdea(idea); // Set state immediately
    setCurrentStep(2);
    
    if (projectId === 'new') {
      setIsCreatingProject(true);
      try {
        const newProjectId = await createInitialProject(idea);
        if (!newProjectId) return;
        
        setAutoCreatedProjectId(newProjectId);
        // Use React Router state to persist data during navigation
        navigate(`/ad-wizard/${newProjectId}`, {
          replace: true,
          state: { businessIdea: idea }
        });
        
        toast({
          title: "Project created",
          description: "Your progress will be saved automatically.",
        });
      } finally {
        setIsCreatingProject(false);
      }
    } else {
      await saveWizardProgress({ 
        business_idea: idea,
        current_step: 2
      }, projectId);
    }
  }, [projectId, navigate, isCreatingProject]);

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
    const newStep = Math.max(1, currentStep - 1);
    setCurrentStep(newStep);
    saveWizardProgress({ 
      current_step: newStep 
    }, autoCreatedProjectId || projectId);
  }, [currentStep, projectId, autoCreatedProjectId]);

  const handleStartOver = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const currentProjectId = autoCreatedProjectId || projectId;
      
      const success = await clearWizardProgress(currentProjectId, user.id);
      
      if (success) {
        setBusinessIdea(null);
        setTargetAudience(null);
        setAudienceAnalysis(null);
        setSelectedHooks([]);
        setCurrentStep(1);

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
    isDataLoaded,
    error,
    isCreatingProject,
  };
};

export default useAdWizardState;
