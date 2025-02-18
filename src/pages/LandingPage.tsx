
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
        throw new Error("No authenticated session");
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

      // Transform the data to match expected types
      const transformedProject = {
        id: data.id,
        title: data.title,
        name: data.name || undefined,
        business_idea: {
          description: typeof data.business_idea === 'string' 
            ? data.business_idea 
            : data.business_idea?.description || '',
          valueProposition: typeof data.business_idea === 'string'
            ? data.business_idea
            : data.business_idea?.valueProposition
        },
        target_audience: typeof data.target_audience === 'string'
          ? { description: data.target_audience }
          : {
              description: data.target_audience?.description,
              name: data.target_audience?.name,
              painPoints: Array.isArray(data.target_audience?.painPoints) 
                ? data.target_audience.painPoints 
                : undefined,
              demographics: data.target_audience?.demographics,
              marketingAngle: data.target_audience?.marketingAngle
            },
        audience_analysis: typeof data.audience_analysis === 'string'
          ? { description: data.audience_analysis }
          : {
              marketDesire: data.audience_analysis?.marketDesire,
              awarenessLevel: data.audience_analysis?.awarenessLevel,
              deepPainPoints: Array.isArray(data.audience_analysis?.deepPainPoints)
                ? data.audience_analysis.deepPainPoints
                : undefined,
              expandedDefinition: data.audience_analysis?.expandedDefinition
            },
        marketing_campaign: data.marketing_campaign,
        selected_hooks: Array.isArray(data.selected_hooks) ? data.selected_hooks : [],
        generated_ads: Array.isArray(data.generated_ads) ? data.generated_ads : []
      };

      return transformedProject;
    },
    retry: false,
  });

  const { data: landingPage, isLoading: landingPageLoading } = useQuery({
    queryKey: ["landing-page", projectId],
    enabled: !!project, // Only run this query if we have a project
    queryFn: async () => {
      try {
        const { data: session } = await supabase.auth.getSession();
        if (!session.session) {
          throw new Error("No authenticated session");
        }

        const { data, error } = await supabase
          .from("landing_pages")
          .select("*")
          .eq("project_id", projectId)
          .maybeSingle();

        if (error && error.code !== "PGRST116") {
          toast({
            title: "Error loading landing page",
            description: error.message,
            variant: "destructive",
          });
          throw error;
        }

        // Transform the landing page data to match expected types
        if (data) {
          return {
            id: data.id,
            content: typeof data.content === 'string' 
              ? JSON.parse(data.content)
              : data.content,
            layout_style: data.layout_style,
            section_order: Array.isArray(data.section_order) 
              ? data.section_order 
              : undefined
          };
        }

        return null;
      } catch (error) {
        console.error("Error fetching landing page:", error);
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
