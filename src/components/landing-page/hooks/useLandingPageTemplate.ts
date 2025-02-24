
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { LandingPageTemplate } from "@/types/landingPage";

interface DatabaseTemplate {
  id: string;
  name: string;
  description: string;
  structure: {
    sections: {
      hero: { type: string; components: string[]; layout: string; };
      valueProposition: { type: string; components: string[]; cardsPerRow: number; };
      features: { type: string; components: string[]; cardsPerRow: number; };
      proof: { type: string; components: string[]; };
      pricing: { type: string; components: string[]; cardsPerRow: number; };
      finalCta: { type: string; components: string[]; };
      footer: { type: string; components: string[]; columns: number; };
    };
    styles: {
      colorScheme: {
        primary: string;
        secondary: string;
        accent: string;
        background: string;
        text: string;
        muted: string;
      };
      typography: {
        headingFont: string;
        bodyFont: string;
        scale: {
          h1: string;
          h2: string;
          h3: string;
          body: string;
          small: string;
        };
      };
      spacing: {
        sectionPadding: string;
        componentGap: string;
        containerWidth: string;
      };
      style: {
        borderRadius: string;
        shadowStrength: 'none' | 'light' | 'medium' | 'strong';
        containerStyle: 'contained' | 'wide' | 'full';
      };
    };
  };
}

export const useLandingPageTemplate = () => {
  return useQuery({
    queryKey: ["landing-page-template"],
    queryFn: async (): Promise<LandingPageTemplate> => {
      const { data: rawData, error } = await supabase
        .from("landing_page_templates")
        .select("*")
        .limit(1)
        .single();

      if (error) throw error;

      const data = rawData as DatabaseTemplate;
      
      const defaultStructure = {
        sections: {
          hero: { type: "hero", components: [], layout: "default" },
          valueProposition: { type: "value-proposition", components: [], cardsPerRow: 3 },
          features: { type: "features", components: [], cardsPerRow: 3 },
          proof: { type: "proof", components: [] },
          pricing: { type: "pricing", components: [], cardsPerRow: 3 },
          finalCta: { type: "final-cta", components: [] },
          footer: { type: "footer", components: [], columns: 4 }
        },
        styles: {
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
            shadowStrength: "medium" as const,
            containerStyle: "contained" as const
          }
        }
      };

      // Create the template with proper type checking
      const template: LandingPageTemplate = {
        id: data.id,
        name: data.name,
        description: data.description,
        structure: typeof data.structure === 'object' && data.structure !== null
          ? {
              sections: data.structure.sections || defaultStructure.sections,
              styles: data.structure.styles || defaultStructure.styles
            }
          : defaultStructure
      };

      return template;
    },
  });
};
