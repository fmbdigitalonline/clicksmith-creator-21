import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Masonry from "react-masonry-css";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PlusCircle, AlertCircle, LoaderIcon } from "lucide-react";
import StepNavigation from "../wizard/StepNavigation";
import LoadingState from "./LoadingState";
import AdPreviewCard from "./gallery/components/AdPreviewCard";
import { useAdGeneration } from "./gallery/useAdGeneration";
import AdGenerationControls from "./gallery/AdGenerationControls";
import PlatformTabs from "./gallery/PlatformTabs";
import { useWizardContext } from "@/hooks/useAdWizardState";
import { useTranslation } from "react-i18next";

const AdGalleryStep = () => {
  const { businessIdea, targetAudience, adHooks } = useWizardContext();
  const { t } = useTranslation("gallery");
  const [selectedPlatform, setSelectedPlatform] = useState("facebook");
  const [activeTab, setActiveTab] = useState("generate");
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const { projectId } = useParams();
  const { toast } = useToast();
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isRegeneratingImage, setIsRegeneratingImage] = useState(false);

  // Use the enhanced hook with regenerateImage function
  const {
    isGenerating,
    adVariants,
    regenerationCount,
    generationStatus,
    processingStatus,
    generateAds,
    processImagesForFacebook,
    regenerateImage,
    setAdVariants
  } = useAdGeneration(businessIdea, targetAudience, adHooks);

  const breakpointCols = {
    default: 3,
    1100: 3,
    700: 2,
    500: 1,
  };

  const getVariantsByPlatform = (platform: string) => {
    return adVariants.filter((variant) => variant.platform === platform);
  };

  const handleCreateProject = async () => {
    setIsCreatingProject(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          name: businessIdea.name,
          description: businessIdea.description,
          generated_ads: adVariants
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Project created!",
        description: "Your project has been successfully created.",
      });

      window.location.href = `/project/${data.id}/gallery`;
    } catch (error: any) {
      console.error('Error creating project:', error);
      toast({
        title: "Error creating project",
        description: error.message || "Failed to create project. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingProject(false);
    }
  };

  // Add handler for regenerating a single image
  const handleRegenerateImage = useCallback(async (variant: any, prompt: string) => {
    if (!variant || !variant.id) {
      toast({
        title: "Error",
        description: "Cannot regenerate image. Missing ad variant ID.",
        variant: "destructive",
      });
      return;
    }
    
    setIsRegeneratingImage(true);
    try {
      const tempId = variant.id || `temp_${Date.now()}`;
      
      console.log('Starting image regeneration with prompt:', prompt);
      console.log('Variant data:', JSON.stringify({
        id: tempId,
        platform: variant.platform,
        imageUrl: variant.imageUrl || variant.image?.url
      }, null, 2));
      
      await regenerateImage(variant.id, prompt);
      
      toast({
        title: "Image regenerated",
        description: "Your new image has been generated successfully."
      });
    } catch (error) {
      console.error("Error regenerating image:", error);
      toast({
        title: "Regeneration failed",
        description: "Failed to regenerate the image. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsRegeneratingImage(false);
    }
  }, [toast, regenerateImage]);

  useEffect(() => {
    if (adVariants.length > 0) {
      setIsInitialLoad(false);
    }
  }, [adVariants]);

  // Filter for the selected platform
  const filteredVariants = adVariants.filter((variant) => variant.platform === selectedPlatform);

  // Check if we're currently generating or processing images
  const isLoading = isGenerating || isInitialLoad || processingStatus.inProgress;

  return (
    <div className="space-y-4">
      <PlatformTabs
        selectedPlatform={selectedPlatform}
        onPlatformChange={setSelectedPlatform}
      />

      <Tabs defaultValue="generate" className="w-full">
        <TabsList>
          <TabsTrigger value="generate">Generate Ads</TabsTrigger>
        </TabsList>
        <TabsContent value="generate" className="space-y-4">
          {generationStatus && (
            <Alert>
              <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
              <AlertTitle>Generating Ads</AlertTitle>
              <AlertDescription>{generationStatus}</AlertDescription>
            </Alert>
          )}
        </TabsContent>
      </Tabs>
      
      {!isLoading && activeTab === "generate" && (
        <div className="grid gap-4">
          <AdGenerationControls
            selectedPlatform={selectedPlatform}
            onGenerateClick={() => generateAds(selectedPlatform)}
            isGenerating={isGenerating}
          />
        </div>
      )}

      {isLoading ? (
        <LoadingState
          platform={selectedPlatform}
          generationStatus={generationStatus}
          processingStatus={processingStatus}
        />
      ) : filteredVariants.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <Alert className="max-w-2xl">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{t("emptyStateTitle")}</AlertTitle>
            <AlertDescription>{t("emptyStateDescription")}</AlertDescription>
          </Alert>
          
          <Button
            onClick={() => generateAds(selectedPlatform)}
            disabled={isGenerating}
            className="mt-4"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            {isGenerating ? (
              <>
                <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
                {t("generating")}
              </>
            ) : (
              t("generateAds")
            )}
          </Button>
        </div>
      ) : (
        <Masonry
          breakpointCols={breakpointCols}
          className="my-masonry-grid"
          columnClassName="my-masonry-grid_column"
        >
          {filteredVariants.map((variant) => (
            <div key={variant.id || `${variant.headline}-${regenerationCount}`}>
              <AdPreviewCard
                variant={variant}
                adVariants={adVariants}
                onCreateProject={handleCreateProject}
                isVideo={selectedPlatform === "video"}
                onRegenerateImage={(prompt) => handleRegenerateImage(variant, prompt)}
              />
            </div>
          ))}
        </Masonry>
      )}

      <StepNavigation
        nextStepLink="/campaign"
        onNext={handleCreateProject}
        isNextDisabled={isCreatingProject || adVariants.length === 0}
        nextButtonText={isCreatingProject ? "Creating Project..." : "Create Project"}
      />
    </div>
  );
};

export default AdGalleryStep;
