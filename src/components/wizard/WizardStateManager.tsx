import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from 'uuid';
import { Database } from "@/integrations/supabase/types";

type WizardProgress = Database['public']['Tables']['wizard_progress']['Row'];
type AnonymousWizardData = {
  generated_ads?: any[];
  business_idea?: any;
  target_audience?: any;
  audience_analysis?: any;
  selected_hooks?: any[];
};

interface WizardStateManagerProps {
  projectId?: string;
  children: (props: {
    generatedAds: any[];
    videoAdsEnabled: boolean;
    hasLoadedInitialAds: boolean;
    handleVideoAdsToggle: (enabled: boolean) => Promise<void>;
    handleAdsGenerated: (newAds: any[]) => Promise<void>;
    handleStartOver: () => Promise<void>;
  }) => React.ReactNode;
}

export const WizardStateManager = ({ projectId, children }: WizardStateManagerProps) => {
  const [videoAdsEnabled, setVideoAdsEnabled] = useState(false);
  const [generatedAds, setGeneratedAds] = useState<any[]>([]);
  const [hasLoadedInitialAds, setHasLoadedInitialAds] = useState(false);
  const [sessionId] = useState(() => localStorage.getItem('anonymous_session_id') || uuidv4());
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const loadProgress = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          const { data: anonymousData } = await supabase
            .from('anonymous_usage')
            .select('wizard_data')
            .eq('session_id', sessionId)
            .single();

          const wizardData = anonymousData?.wizard_data as AnonymousWizardData | null;
          if (wizardData?.generated_ads) {
            setGeneratedAds(wizardData.generated_ads);
          }
          setHasLoadedInitialAds(true);
          return;
        }

        if (projectId && projectId !== 'new') {
          const { data: project, error: projectError } = await supabase
            .from('projects')
            .select('generated_ads, video_ads_enabled')
            .eq('id', projectId)
            .maybeSingle();

          if (projectError) {
            console.error('Error loading project:', projectError);
            toast({
              title: "Couldn't load your project",
              description: "We had trouble loading your project data. Please try again.",
              variant: "destructive",
            });
            return;
          }

          if (!project) {
            navigate('/ad-wizard/new');
          } else {
            setVideoAdsEnabled(project.video_ads_enabled || false);
            if (project.generated_ads && Array.isArray(project.generated_ads)) {
              setGeneratedAds(project.generated_ads);
            }
          }
        } else {
          const { data: wizardData, error: wizardError } = await supabase
            .from('wizard_progress')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();

          if (wizardError && wizardError.code !== 'PGRST116') {
            console.error('Error loading wizard progress:', wizardError);
            toast({
              title: "Couldn't load your progress",
              description: "We had trouble loading your previous work. Starting fresh.",
              variant: "destructive",
            });
          }

          if (wizardData?.generated_ads && Array.isArray(wizardData.generated_ads)) {
            setGeneratedAds(wizardData.generated_ads);
          }
        }
        setHasLoadedInitialAds(true);
      } catch (error) {
        console.error('Error loading progress:', error);
        toast({
          title: "Something went wrong",
          description: "We couldn't load your previous work. Please try refreshing the page.",
          variant: "destructive",
        });
        setHasLoadedInitialAds(true);
      }
    };

    loadProgress();
  }, [projectId, navigate, toast, sessionId]);

  const handleVideoAdsToggle = async (enabled: boolean) => {
    setVideoAdsEnabled(enabled);
    if (projectId && projectId !== 'new') {
      await supabase
        .from('projects')
        .update({ 
          video_ads_enabled: enabled,
          video_ad_preferences: enabled ? {
            format: 'landscape',
            duration: 30
          } : null
        })
        .eq('id', projectId);
    }
  };

  const handleStartOver = async () => {
    console.log('Starting over...');
    setGeneratedAds([]); // Clear generated ads
    setHasLoadedInitialAds(false); // Reset loading state

    const { data: { user } } = await supabase.auth.getUser();
    
    try {
      if (!user) {
        // For anonymous users, clear wizard data
        const { error: updateError } = await supabase
          .from('anonymous_usage')
          .update({ 
            wizard_data: null,
            completed: false
          })
          .eq('session_id', sessionId);

        if (updateError) throw updateError;
      } else if (projectId && projectId !== 'new') {
        // For authenticated users with a project, clear project data
        const { error: updateError } = await supabase
          .from('projects')
          .update({
            business_idea: null,
            target_audience: null,
            audience_analysis: null,
            selected_hooks: null,
            generated_ads: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', projectId);

        if (updateError) throw updateError;
      } else {
        // For authenticated users without a project, clear wizard progress
        const { error: deleteError } = await supabase
          .from('wizard_progress')
          .delete()
          .eq('user_id', user.id);

        if (deleteError) throw deleteError;
      }

      // Navigate back to first step
      navigate('/ad-wizard/new');
    } catch (error) {
      console.error('Error clearing progress:', error);
      toast({
        title: "Couldn't clear progress",
        description: "There was an error clearing your progress. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAdsGenerated = async (newAds: any[]) => {
    console.log('Handling newly generated ads:', newAds);
    setGeneratedAds(newAds);
    
    const { data: { user } } = await supabase.auth.getUser();
    
    try {
      if (!user) {
        const wizardData: AnonymousWizardData = {
          generated_ads: newAds,
        };

        const { error: updateError } = await supabase
          .from('anonymous_usage')
          .update({ 
            wizard_data: wizardData,
            completed: true
          })
          .eq('session_id', sessionId);

        if (updateError) throw updateError;
        
        toast({
          title: "Trial completed!",
          description: "Sign up now to save your work and get 12 free generations.",
          variant: "default",
        });
        
        setTimeout(() => {
          navigate('/login');
        }, 3000);
        
        return;
      }

      if (projectId && projectId !== 'new') {
        const { error: updateError } = await supabase
          .from('projects')
          .update({ generated_ads: newAds })
          .eq('id', projectId);

        if (updateError) throw updateError;
      } else {
        const { error: upsertError } = await supabase
          .from('wizard_progress')
          .upsert({
            user_id: user.id,
            generated_ads: newAds
          }, {
            onConflict: 'user_id'
          });

        if (upsertError) throw upsertError;
      }
    } catch (error) {
      console.error('Error saving generated ads:', error);
      toast({
        title: "Couldn't save your ads",
        description: "Your ads were generated but we couldn't save them. Please try again.",
        variant: "destructive",
      });
    }
  };

  return children({
    generatedAds,
    videoAdsEnabled,
    hasLoadedInitialAds,
    handleVideoAdsToggle,
    handleAdsGenerated,
    handleStartOver,
  });
};