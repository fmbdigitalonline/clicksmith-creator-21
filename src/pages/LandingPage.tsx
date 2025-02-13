
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import LandingPageContent from "@/components/landing-page/LandingPageContent";
import LandingPageHeader from "@/components/landing-page/LandingPageHeader";

const LandingPage = () => {
  const { projectId } = useParams();
  const { toast } = useToast();

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*, business_idea, target_audience, audience_analysis")
        .eq("id", projectId)
        .single();

      if (error) {
        toast({
          title: "Error loading project",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }

      return data;
    },
  });

  const { data: landingPage, isLoading: landingPageLoading } = useQuery({
    queryKey: ["landing-page", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("landing_pages")
        .select("*")
        .eq("project_id", projectId)
        .single();

      if (error && error.code !== "PGRST116") { // Not found error is expected
        toast({
          title: "Error loading landing page",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }

      return data;
    },
  });

  if (projectLoading || landingPageLoading) {
    return <div>Loading...</div>;
  }

  if (!project) {
    return <div>Project not found</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <LandingPageHeader project={project} landingPage={landingPage} />
      <LandingPageContent project={project} landingPage={landingPage} />
    </div>
  );
};

export default LandingPage;
