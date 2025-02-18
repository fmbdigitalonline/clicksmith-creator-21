
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
  business_idea: BusinessIdea;
  target_audience: TargetAudience;
  audience_analysis: any;
  title: string;
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

    // Show loading toast with landing page loading state
    const toastInstance = toast({
      title: "Creating landing page",
      description: <LoadingStateLandingPage />,
      duration: 100000, // Long duration since we'll dismiss it manually
    });

    try {
      // Get the project data first
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('business_idea, target_audience, audience_analysis, title')
        .eq('id', projectId)
        .single();

      if (projectError) throw projectError;
      if (!project) throw new Error('Project not found');

      const typedProject = project as unknown as ProjectData;

      // Get any saved ad images
      const { data: adFeedback } = await supabase
        .from('ad_feedback')
        .select('saved_images')
        .eq('project_id', projectId)
        .maybeSingle();
      
      const savedImages = adFeedback?.saved_images || [];

      console.log("Calling generate-landing-page function with data:", {
        businessIdea: typedProject.business_idea,
        targetAudience: typedProject.target_audience,
        audienceAnalysis: typedProject.audience_analysis,
        projectImages: savedImages
      });

      // Call the edge function to generate landing page content
      const { data: generatedContent, error } = await supabase.functions
        .invoke('generate-landing-page', {
          body: {
            businessIdea: typedProject.business_idea,
            targetAudience: typedProject.target_audience,
            audienceAnalysis: typedProject.audience_analysis,
            projectImages: savedImages
          },
        });

      if (error) throw error;
      
      console.log("Generated content:", generatedContent);

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("No authenticated user found");

      // Transform the generated content into the expected format
      const formattedContent = {
        hero: generatedContent.hero || {
          title: typedProject.business_idea?.valueProposition || typedProject.business_idea?.description || "Transform Your Business",
          description: typedProject.target_audience?.coreMessage || "Transform your business today",
          cta: "Get Started",
          image: savedImages[0] || "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b"
        },
        value_proposition: {
          title: "Why Choose Us",
          description: typedProject.target_audience?.messagingApproach || "We deliver exceptional value",
          cards: (generatedContent.valueProposition?.cards as any[]) || []
        },
        features: {
          title: "Key Features",
          description: "Discover what makes us unique",
          items: (generatedContent.marketAnalysis?.features as any[]) || []
        },
        proof: {
          title: "What Our Clients Say",
          testimonials: (generatedContent.testimonials?.items as any[]) || []
        },
        pricing: {
          title: "Simple, Transparent Pricing",
          description: "Choose the plan that's right for you",
          plans: []
        },
        finalCta: {
          title: "Ready to Get Started?",
          description: typedProject.target_audience?.coreMessage || "Join us today",
          buttonText: "Get Started Now"
        },
        footer: {
          contact: "Contact us",
          newsletter: "Subscribe to our newsletter",
          copyright: `© ${new Date().getFullYear()} ${typedProject.title}. All rights reserved.`
        }
      };

      // Save the generated content to the landing_pages table
      const landingPageData = {
        project_id: projectId,
        user_id: userData.user.id,
        title: `${typedProject.title} Landing Page`,
        content: formattedContent,
        image_placements: [], 
        layout_style: 'default',
        template_version: 2,
        section_order: [
          "hero",
          "value_proposition",
          "features",
          "proof",
          "pricing",
          "finalCta",
          "footer"
        ],
        conversion_goals: [
          "sign_up",
          "contact_form",
          "newsletter"
        ],
        published: false
      };

      const { data: landingPage, error: saveError } = await supabase
        .from('landing_pages')
        .upsert(landingPageData)
        .select()
        .single();

      if (saveError) throw saveError;

      // Dismiss loading toast
      toastInstance.dismiss();

      // Show success message
      toast({
        title: "Success",
        description: "Your landing page has been generated successfully!",
      });

      // Invalidate landing pages query to refetch latest data
      await queryClient.invalidateQueries({
        queryKey: ['landing-page', projectId]
      });

      // Navigate to the landing page editor
      navigate(`/projects/${projectId}/landing-page`);
    } catch (error) {
      console.error('Error creating landing page:', error);
      // Dismiss loading toast
      toastInstance.dismiss();
      
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
