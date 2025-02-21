
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
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        throw new Error('No authenticated session');
      }

      const { data, error } = await supabase
        .from("projects")
        .select("*, business_idea, target_audience, audience_analysis")
        .eq("id", projectId)
        .maybeSingle();

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

      console.log("Project data retrieved:", data);
      return data;
    },
    retry: false,
  });

  const { data: landingPage, isLoading: landingPageLoading } = useQuery({
    queryKey: ["landing-page", projectId],
    enabled: !!project,
    queryFn: async () => {
      try {
        const { data: session } = await supabase.auth.getSession();
        if (!session.session) {
          throw new Error('No authenticated session');
        }

        // First, check for any existing landing page
        const { data: existingPage, error: pageError } = await supabase
          .from("landing_pages")
          .select("*")
          .eq("project_id", projectId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (pageError && pageError.code !== "PGRST116") {
          toast({
            title: "Error loading landing page",
            description: pageError.message,
            variant: "destructive",
          });
          throw pageError;
        }

        if (!existingPage) {
          // If no landing page exists, create one with required fields
          const { data: newPage, error: createError } = await supabase
            .from("landing_pages")
            .insert({
              project_id: projectId,
              user_id: session.session.user.id,
              title: project?.title || 'New Landing Page', // Use project title or default
              content: {},
              theme_settings: {},
              content_iterations: 0
            })
            .select()
            .single();

          if (createError) {
            toast({
              title: "Error creating landing page",
              description: createError.message,
              variant: "destructive",
            });
            throw createError;
          }

          console.log("New landing page created:", newPage);
          return newPage;
        }

        console.log("Existing landing page retrieved:", existingPage);
        return existingPage;
      } catch (error) {
        console.error("Error fetching/creating landing page:", error);
        return null;
      }
    },
    retry: false,
  });

  if (projectLoading || landingPageLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Project not found</h2>
          <p className="text-gray-600">The requested project could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <LandingPageHeader project={project} landingPage={landingPage} />
      <LandingPageContent project={project} landingPage={landingPage} />
    </div>
  );
};

export default LandingPage;
