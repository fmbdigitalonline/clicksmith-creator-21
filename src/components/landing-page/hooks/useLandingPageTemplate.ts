
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LandingPageTemplate } from "@/types/landingPage";
import { Database } from "@/integrations/supabase/types";

type LandingPageTemplateRow = Database["public"]["Tables"]["landing_page_templates"]["Row"];

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

      // Type assertion to ensure the structure matches LandingPageTemplate
      const template: LandingPageTemplate = {
        id: data.id,
        name: data.name,
        description: data.description || "",
        structure: data.structure as LandingPageTemplate["structure"]
      };

      return template;
    },
  });
};
