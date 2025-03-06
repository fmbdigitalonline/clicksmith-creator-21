
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BusinessIdea, TargetAudience, AudienceAnalysis } from "@/types/adWizard";

interface ProjectData {
  businessIdea?: BusinessIdea;
  targetAudience?: TargetAudience;
  audienceAnalysis?: AudienceAnalysis;
  formatPreferences?: string[];
  loading: boolean;
  error: string | null;
}

export function useProjectCampaignData(projectId?: string) {
  const [data, setData] = useState<ProjectData>({
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!projectId) {
      setData({
        loading: false,
        error: null,
      });
      return;
    }

    async function fetchProjectData() {
      try {
        const { data: projectData, error } = await supabase
          .from("projects")
          .select("*")
          .eq("id", projectId)
          .single();

        if (error) throw error;

        // Check if format_preferences exists in the project data
        const formatPreferences = projectData.format_preferences || [];

        setData({
          businessIdea: projectData.business_idea as BusinessIdea,
          targetAudience: projectData.target_audience as TargetAudience,
          audienceAnalysis: projectData.audience_analysis as AudienceAnalysis,
          formatPreferences: Array.isArray(formatPreferences) ? formatPreferences : [],
          loading: false,
          error: null,
        });
      } catch (error) {
        console.error("Error fetching project data:", error);
        setData({
          loading: false,
          error: error instanceof Error ? error.message : "Failed to load project data",
        });
      }
    }

    fetchProjectData();
  }, [projectId]);

  return data;
}
