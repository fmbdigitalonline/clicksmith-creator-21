
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BusinessIdea, TargetAudience, AudienceAnalysis, Project } from "@/types/adWizard";
import { 
  validateProjectDataCompleteness, 
  ValidationResult,
  createDefaultBusinessIdea,
  createDefaultTargetAudience,
  createDefaultAudienceAnalysis,
  createDefaultFormatPreferences
} from "@/utils/dataValidationUtils";
import { Json } from "@/integrations/supabase/types";

interface ProjectData {
  businessIdea?: BusinessIdea;
  targetAudience?: TargetAudience;
  audienceAnalysis?: AudienceAnalysis;
  formatPreferences?: string[];
  loading: boolean;
  error: string | null;
  validation: ValidationResult;
  dataCompleteness: number; // 0-100 percentage
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
  business_idea?: Json;
  target_audience?: Json;
  audience_analysis?: Json;
  marketing_campaign?: Json;
  selected_hooks?: Json;
  generated_ads?: Json;
  tags?: string[];
  ad_format?: string;
  ad_dimensions?: Json; // Changed to match Json type from Supabase
  format_preferences?: Json; // Changed to Json type to match Supabase
  video_ads_enabled?: boolean;
  video_ad_settings?: Json; // Changed to Json type
  video_ad_preferences?: Json; // Changed to Json type
}

export function useProjectCampaignData(projectId?: string) {
  const initialData: ProjectData = {
    loading: true,
    error: null,
    validation: {
      isComplete: false,
      missingFields: [],
      warningMessage: null
    },
    dataCompleteness: 0
  };

  const [data, setData] = useState<ProjectData>(initialData);

  useEffect(() => {
    if (!projectId) {
      setData({
        ...initialData,
        loading: false,
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

        // Explicitly cast the projectData to unknown first, then to our typed response
        // This avoids TypeScript's type checking on the direct assignment
        const typedProjectData = projectData as unknown as ProjectDataResponse;
        
        // Apply data fallbacks for missing values
        const businessIdea = typedProjectData.business_idea as unknown as BusinessIdea || createDefaultBusinessIdea();
        const targetAudience = typedProjectData.target_audience as unknown as TargetAudience || createDefaultTargetAudience();
        const audienceAnalysis = typedProjectData.audience_analysis as unknown as AudienceAnalysis || createDefaultAudienceAnalysis();
        
        // Check if format_preferences exists and ensure it's an array
        const formatPreferences = Array.isArray(typedProjectData.format_preferences) 
          ? typedProjectData.format_preferences as string[]
          : createDefaultFormatPreferences();

        // Validate project data completeness
        const validation = validateProjectDataCompleteness(
          businessIdea, 
          targetAudience, 
          audienceAnalysis, 
          formatPreferences
        );

        // Calculate data completeness percentage (simple version)
        const totalFields = 4; // Business idea, target audience, audience analysis, format preferences
        const missingCounts = validation.missingFields.length;
        const dataCompleteness = Math.max(0, Math.min(100, Math.round((totalFields - missingCounts) / totalFields * 100)));

        setData({
          businessIdea,
          targetAudience,
          audienceAnalysis,
          formatPreferences,
          loading: false,
          error: null,
          validation,
          dataCompleteness
        });
      } catch (error) {
        console.error("Error fetching project data:", error);
        setData({
          loading: false,
          error: error instanceof Error ? error.message : "Failed to load project data",
          validation: {
            isComplete: false,
            missingFields: ["data load failed"],
            warningMessage: "Unable to load project data"
          },
          dataCompleteness: 0
        });
      }
    }

    fetchProjectData();
  }, [projectId]);

  return data;
}
