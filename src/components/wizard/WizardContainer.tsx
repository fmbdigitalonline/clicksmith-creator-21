import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import WizardHeader from "./WizardHeader";
import WizardProgress from "../WizardProgress";
import VideoToggle from "./VideoToggle";
import StepRenderer from "./StepRenderer";
import CreateProjectDialog from "../projects/CreateProjectDialog";

type WizardProgress = Database['public']['Tables']['wizard_progress']['Row'];

const WizardContainer = () => {
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [videoAdsEnabled, setVideoAdsEnabled] = useState(false);
  const [generatedAds, setGeneratedAds] = useState<any[]>([]);
  const [hasLoadedInitialAds, setHasLoadedInitialAds] = useState(false);
  const navigate = useNavigate();
  const { projectId } = useParams();
  const { toast } = useToast();

  const handleCreateProject = () => {
    setShowCreateProject(true);
  };

  const handleProjectCreated = (projectId: string) => {
    setShowCreateProject(false);
    navigate(`/ad-wizard/${projectId}`);
  };

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

  const handleAdsGenerated = async (newAds: any[]) => {
    console.log('Handling newly generated ads:', newAds);
    setGeneratedAds(newAds);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
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

  return {
    showCreateProject,
    videoAdsEnabled,
    generatedAds,
    hasLoadedInitialAds,
    handleCreateProject,
    handleProjectCreated,
    handleVideoAdsToggle,
    handleAdsGenerated,
    setHasLoadedInitialAds
  };
};

export default WizardContainer;