import { BusinessIdea, TargetAudience, AdHook, AdImage } from "@/types/adWizard";
import { TabsContent } from "@/components/ui/tabs";
import LoadingState from "./complete/LoadingState";
import PlatformTabs from "./gallery/PlatformTabs";
import PlatformContent from "./gallery/PlatformContent";
import PlatformChangeDialog from "./gallery/PlatformChangeDialog";
import { usePlatformSwitch } from "@/hooks/usePlatformSwitch";
import { useAdGeneration } from "./gallery/useAdGeneration";
import AdGenerationControls from "./gallery/AdGenerationControls";
import { useEffect, useState } from "react";
import { AdSizeSelector, AD_FORMATS } from "./gallery/components/AdSizeSelector";
import { supabase } from "@/integrations/supabase/client";
import { useParams } from "react-router-dom";

interface AdGalleryStepProps {
  businessIdea: BusinessIdea;
  targetAudience: TargetAudience;
  adHooks: AdHook[];
  generatedImages?: AdImage[];
  onStartOver: () => void;
  onBack: () => void;
  onCreateProject: () => void;
  videoAdsEnabled?: boolean;
}

const AdGalleryStep = ({
  businessIdea,
  targetAudience,
  adHooks,
  generatedImages,
  onStartOver,
  onBack,
  onCreateProject,
  videoAdsEnabled = false,
}: AdGalleryStepProps) => {
  const [selectedFormat, setSelectedFormat] = useState(AD_FORMATS[0]);
  const { projectId } = useParams();
  
  const {
    platform,
    showPlatformChangeDialog,
    handlePlatformChange,
    confirmPlatformChange,
    cancelPlatformChange,
    setShowPlatformChangeDialog
  } = usePlatformSwitch();

  const {
    isGenerating,
    adVariants,
    generationStatus,
    generateAds,
    setAdVariants
  } = useAdGeneration(businessIdea, targetAudience, adHooks);

  useEffect(() => {
    const loadExistingAds = async () => {
      try {
        // First try to get ads from project if we have a project ID
        if (projectId && projectId !== 'new') {
          const { data: project } = await supabase
            .from('projects')
            .select('generated_ads')
            .eq('id', projectId)
            .single();

          if (project?.generated_ads && Array.isArray(project.generated_ads)) {
            setAdVariants(project.generated_ads);
            return;
          }
        }

        // If no project ads, try to get from wizard progress
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: wizardData } = await supabase
          .from('wizard_progress')
          .select('selected_hooks')
          .eq('user_id', user.id)
          .single();

        if (wizardData?.selected_hooks) {
          const existingAds = Array.isArray(wizardData.selected_hooks) 
            ? wizardData.selected_hooks.map((hook: AdHook, index: number) => ({
                platform: 'facebook',
                headline: hook.description,
                description: hook.text,
                imageUrl: hook.image?.url || '', // Updated to use the correct property path
                size: {
                  width: 1200,
                  height: 628,
                  label: "Facebook Feed"
                },
                id: `wizard-${index}`,
              }))
            : [];
          
          if (existingAds.length > 0) {
            setAdVariants(existingAds);
            return;
          }
        }

        // Only generate new ads if we don't have any existing ones
        if (adVariants.length === 0) {
          generateAds(platform);
        }
      } catch (error) {
        console.error('Error loading existing ads:', error);
      }
    };

    loadExistingAds();
  }, [projectId]);

  const onPlatformChange = (newPlatform: "facebook" | "google" | "linkedin" | "tiktok") => {
    handlePlatformChange(newPlatform, adVariants.length > 0);
  };

  const onConfirmPlatformChange = () => {
    const newPlatform = confirmPlatformChange();
    generateAds(newPlatform);
  };

  const onCancelPlatformChange = () => {
    const currentPlatform = cancelPlatformChange();
    // Force update the PlatformTabs to stay on the current platform
    const tabsElement = document.querySelector(`[data-state="active"][value="${currentPlatform}"]`);
    if (tabsElement) {
      (tabsElement as HTMLElement).click();
    }
  };

  const handleFormatChange = (format: typeof AD_FORMATS[0]) => {
    setSelectedFormat(format);
  };

  const renderPlatformContent = (platformName: string) => (
    <TabsContent value={platformName} className="space-y-4">
      <div className="flex justify-end mb-4">
        <AdSizeSelector
          selectedFormat={selectedFormat}
          onFormatChange={handleFormatChange}
        />
      </div>
      <PlatformContent
        platformName={platformName}
        adVariants={adVariants.filter(variant => variant.platform === platformName)}
        onCreateProject={onCreateProject}
        videoAdsEnabled={videoAdsEnabled}
        selectedFormat={selectedFormat}
      />
    </TabsContent>
  );

  return (
    <div className="space-y-6 md:space-y-8">
      <AdGenerationControls
        onBack={onBack}
        onStartOver={onStartOver}
        onRegenerate={() => generateAds(platform)}
        isGenerating={isGenerating}
        generationStatus={generationStatus}
      />

      {isGenerating ? (
        <LoadingState />
      ) : (
        <PlatformTabs 
          platform={platform} 
          onPlatformChange={onPlatformChange}
        >
          {renderPlatformContent('facebook')}
          {renderPlatformContent('google')}
          {renderPlatformContent('linkedin')}
          {renderPlatformContent('tiktok')}
        </PlatformTabs>
      )}

      <PlatformChangeDialog
        open={showPlatformChangeDialog}
        onOpenChange={setShowPlatformChangeDialog}
        onConfirm={onConfirmPlatformChange}
        onCancel={onCancelPlatformChange}
      />
    </div>
  );
};

export default AdGalleryStep;