
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

interface ProjectData {
  id: string;
  title: string;
  business_idea: BusinessIdea | null;
  target_audience: TargetAudience | null;
  audience_analysis: any;
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
    console.log("Starting landing page creation for project:", projectId);
    
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
      // Get user session
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get the project data
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select(`
          id,
          title,
          business_idea,
          target_audience,
          audience_analysis
        `)
        .eq('id', projectId)
        .single();

      if (projectError) throw projectError;
      if (!project) throw new Error('Project not found');

      const typedProject = project as ProjectData;
      console.log("Project data retrieved:", typedProject);

      // Ensure we have the required data
      if (!typedProject.business_idea || !typedProject.target_audience) {
        throw new Error('Missing required project data');
      }

      // Format the business idea and target audience data with proper typing
      const businessIdea: BusinessIdea = {
        description: typedProject.business_idea.description || "",
        valueProposition: typedProject.business_idea.valueProposition || ""
      };

      const targetAudience: TargetAudience = {
        name: typedProject.target_audience.name || "",
        description: typedProject.target_audience.description || "",
        demographics: typedProject.target_audience.demographics || "",
        painPoints: typedProject.target_audience.painPoints || [],
        icp: typedProject.target_audience.icp || "",
        coreMessage: typedProject.target_audience.coreMessage || "",
        positioning: typedProject.target_audience.positioning || "",
        marketingAngle: typedProject.target_audience.marketingAngle || "",
        messagingApproach: typedProject.target_audience.messagingApproach || "",
        marketingChannels: typedProject.target_audience.marketingChannels || []
      };

      // Generate landing page content
      const { data: generatedContent, error } = await supabase.functions
        .invoke('generate-landing-page', {
          body: JSON.stringify({
            projectId,
            businessName: typedProject.title,
            businessIdea,
            targetAudience,
            userId: user.id,
          })
        });

      console.log("Edge function response:", generatedContent);

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
