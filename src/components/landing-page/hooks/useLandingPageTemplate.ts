
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { LandingPageTemplate } from "@/types/landingPage";

export const useLandingPageTemplate = () => {
  return useQuery({
    queryKey: ["landing-page-template"],
    queryFn: async (): Promise<LandingPageTemplate> => {
      const { data, error } = await supabase
        .from("landing_page_templates")
        .select("*")
        .limit(1)
        .single();

      if (error) throw error;
      
      // Ensure the structure is properly typed
      const template: LandingPageTemplate = {
        id: data.id,
        name: data.name,
        description: data.description,
        structure: data.structure as LandingPageTemplate['structure']
      };

      return template;
    },
  });
};
