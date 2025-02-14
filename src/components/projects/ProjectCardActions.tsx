
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ProjectCardActionsProps {
  projectId: string;
  onStartAdWizard: (projectId: string) => void;
}

const ProjectCardActions = ({ projectId, onStartAdWizard }: ProjectCardActionsProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleCreateLandingPage = async () => {
    try {
      // Get the project data first
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('business_idea, target_audience, audience_analysis, title')
        .eq('id', projectId)
        .single();

      if (projectError) throw projectError;

      // Get any saved ad images
      const { data: adFeedback } = await supabase
        .from('ad_feedback')
        .select('saved_images')
        .eq('project_id', projectId)
        .limit(1)
        .single();

      const savedImages = adFeedback?.saved_images || [];

      // Call the edge function to generate landing page content
      const { data: generatedContent, error } = await supabase.functions
        .invoke('generate-landing-page', {
          body: {
            businessIdea: project.business_idea,
            targetAudience: project.target_audience,
            audienceAnalysis: project.audience_analysis,
            projectImages: savedImages
          },
        });

      if (error) throw error;

      // Save the generated content to the landing_pages table
      const { data: landingPage, error: saveError } = await supabase
        .from('landing_pages')
        .insert({
          project_id: projectId,
          user_id: (await supabase.auth.getUser()).data.user?.id,
          title: `${project.title} Landing Page`,
          content: generatedContent,
          image_placements: generatedContent.imagePlacements,
          styling: generatedContent.styling,
          layout_style: generatedContent.layout,
          published: false
        })
        .select()
        .single();

      if (saveError) throw saveError;

      // Show success message
      toast({
        title: "Landing page created",
        description: "Your landing page has been generated successfully.",
      });

      // Navigate to the landing page editor
      navigate(`/landing-page/${landingPage.id}`);
    } catch (error) {
      console.error('Error creating landing page:', error);
      toast({
        title: "Error",
        description: "Failed to create landing page. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex gap-2 mt-4">
      <Button
        variant="secondary"
        onClick={() => onStartAdWizard(projectId)}
        className="flex-1"
      >
        Create Ad
      </Button>
      <Button
        variant="default"
        onClick={handleCreateLandingPage}
        className="flex-1"
      >
        Create Landing Page
      </Button>
    </div>
  );
};

export default ProjectCardActions;
