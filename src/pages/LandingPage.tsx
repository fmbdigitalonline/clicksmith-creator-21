
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
        .maybeSingle(); // Changed from .single() to .maybeSingle()

      if (error) {
        toast({
          title: "Error loading project",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }

      if (!data) {
        toast({
          title: "Project not found",
          description: "The requested project could not be found.",
          variant: "destructive",
        });
        throw new Error("Project not found");
      }

      return data;
    },
    retry: false, // Don't retry on failure since we're handling the "not found" case
  });

  const { data: landingPage, isLoading: landingPageLoading } = useQuery({
    queryKey: ["landing-page", projectId],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("landing_pages")
          .select("*")
          .eq("project_id", projectId)
          .maybeSingle(); // Using maybeSingle() here as well

        if (error && error.code !== "PGRST116") { // Only throw for non-404 errors
          toast({
            title: "Error loading landing page",
            description: error.message,
            variant: "destructive",
          });
          throw error;
        }

        return data; // This will be null if no landing page exists
      } catch (error) {
        console.error("Error fetching landing page:", error);
        return null; // Return null on error to allow graceful fallback
      }
    },
    retry: false, // Don't retry on failure since we're handling the "not found" case
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
