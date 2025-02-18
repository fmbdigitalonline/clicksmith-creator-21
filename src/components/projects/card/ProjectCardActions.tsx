
import { CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2, Layout } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import LoadingStateLandingPage from "@/components/landing-page/LoadingStateLandingPage";
import { BusinessIdea, TargetAudience } from "@/types/adWizard";

interface ProjectCardActionsProps {
  projectId: string;
  onEdit: () => void;
  onDelete: () => void;
  onStartAdWizard: () => void;
  hasCampaign: boolean;
  hasBusinessIdea?: boolean;
  hasTargetAudience?: boolean;
  hasAudienceAnalysis?: boolean;
}

const ProjectCardActions = ({ 
  projectId,
  onEdit, 
  onDelete, 
  hasBusinessIdea,
  hasTargetAudience,
  hasAudienceAnalysis
}: ProjectCardActionsProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleCreateLandingPage = async () => {
    if (!hasBusinessIdea || !hasTargetAudience || !hasAudienceAnalysis) {
      toast({
        title: "Missing information",
        description: "Please complete the business idea, target audience, and market analysis steps before creating a landing page.",
        variant: "destructive",
      });
      return;
    }

    // Show loading toast
    const loadingToast = toast({
      title: "Creating your landing page",
      description: <LoadingStateLandingPage />,
      duration: 100000,
    });

    try {
      // Get the project data
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('*, business_idea, target_audience, audience_analysis')
        .eq('id', projectId)
        .single();

      if (projectError) throw projectError;

      // Generate landing page content
      const { data: generatedContent, error } = await supabase.functions
        .invoke('generate-landing-page', {
          body: {
            projectId,
            businessName: project.title,
            businessIdea: project.business_idea,
            targetAudience: project.target_audience,
          },
        });

      if (error) throw error;

      // Dismiss loading toast and show success
      loadingToast.dismiss();
      toast({
        title: "Success!",
        description: "Your landing page has been created.",
      });

      // Invalidate queries with the correct type format
      await queryClient.invalidateQueries({
        queryKey: ['landing-page', projectId]
      });
      
      navigate(`/projects/${projectId}/landing-page`);
    } catch (error) {
      console.error('Error creating landing page:', error);
      loadingToast.dismiss();
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create landing page",
        variant: "destructive",
      });
    }
  };

  return (
    <CardFooter className="flex flex-wrap gap-1.5 justify-end p-3">
      <Button
        variant="outline"
        size="icon"
        className="h-7 w-7"
        onClick={onEdit}
      >
        <Edit2 className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="h-7 w-7"
        onClick={onDelete}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="h-7 text-xs"
        onClick={handleCreateLandingPage}
      >
        <Layout className="h-3.5 w-3.5 mr-1.5" />
        Landing Page
      </Button>
    </CardFooter>
  );
};

export default ProjectCardActions;
