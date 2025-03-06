
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BusinessIdea, TargetAudience, AudienceAnalysis, Project } from "@/types/adWizard";

interface ProjectData {
  businessIdea?: BusinessIdea;
  targetAudience?: TargetAudience;
  audienceAnalysis?: AudienceAnalysis;
  formatPreferences?: string[];
  loading: boolean;
  error: string | null;
}

// Define the database response type to match the actual Supabase structure
interface ProjectDataResponse {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  title: string;
  description?: string;
  status?: string;
  current_step?: number;
  business_idea?: any;
  target_audience?: any;
  audience_analysis?: any;
  marketing_campaign?: any;
  selected_hooks?: any[];
  generated_ads?: any[];
  tags?: string[];
  ad_format?: string;
  ad_dimensions?: { width: number; height: number };
  format_preferences?: string[];
  video_ads_enabled?: boolean;
  video_ad_settings?: { format: string; duration: number };
  video_ad_preferences?: { format: string; duration: number };
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

        // Use our typed response to access the data
        const typedProjectData = projectData as ProjectDataResponse;
        
        // Check if format_preferences exists and ensure it's an array
        const formatPreferences = typedProjectData.format_preferences || [];

        setData({
          businessIdea: typedProjectData.business_idea as BusinessIdea,
          targetAudience: typedProjectData.target_audience as TargetAudience,
          audienceAnalysis: typedProjectData.audience_analysis as AudienceAnalysis,
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
