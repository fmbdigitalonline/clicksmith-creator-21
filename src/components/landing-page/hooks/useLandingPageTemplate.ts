
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LandingPageTemplate } from "@/types/landingPage";

export const useLandingPageTemplate = (templateId?: string) => {
  return useQuery({
    queryKey: ["landing-page-template", templateId],
    queryFn: async () => {
      const query = supabase
        .from("landing_page_templates")
        .select("*");

      if (templateId) {
        query.eq("id", templateId);
      } else {
        // Get the default template if no ID is provided
        query.eq("name", "Standard Business Template");
      }

      const { data, error } = await query.single();

      if (error) {
        throw error;
      }

      return data as LandingPageTemplate;
    },
  });
};
