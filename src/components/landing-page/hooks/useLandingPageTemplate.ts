
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
      
      // Convert the raw data to the expected type structure
      const template: LandingPageTemplate = {
        id: data.id,
        name: data.name,
        description: data.description,
        structure: {
          sections: data.structure?.sections || {
            hero: { type: "hero", components: [], layout: "default" },
            valueProposition: { type: "value-proposition", components: [], cardsPerRow: 3 },
            features: { type: "features", components: [], cardsPerRow: 3 },
            proof: { type: "proof", components: [] },
            pricing: { type: "pricing", components: [], cardsPerRow: 3 },
            finalCta: { type: "final-cta", components: [] },
            footer: { type: "footer", components: [], columns: 4 }
          },
          styles: data.structure?.styles || {
            colorScheme: {
              primary: "blue-500",
              secondary: "purple-500",
              accent: "yellow-500",
              background: "white",
              text: "gray-900",
              muted: "gray-600"
            },
            typography: {
              headingFont: "sans",
              bodyFont: "sans",
              scale: {
                h1: "text-5xl",
                h2: "text-4xl",
                h3: "text-2xl",
                body: "text-base",
                small: "text-sm"
              }
            },
            spacing: {
              sectionPadding: "py-16",
              componentGap: "gap-8",
              containerWidth: "max-w-7xl"
            },
            style: {
              borderRadius: "rounded-lg",
              shadowStrength: "medium",
              containerStyle: "contained"
            }
          }
        }
      };

      return template;
    },
  });
};
