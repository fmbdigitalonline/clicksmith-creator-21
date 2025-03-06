
import { useState } from "react";
import { BusinessIdea, TargetAudience, AudienceAnalysis } from "@/types/adWizard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type SuggestionType = 
  | "targeting" 
  | "budget" 
  | "objective" 
  | "performance";

export interface SuggestionRequest {
  type: SuggestionType;
  businessIdea?: BusinessIdea;
  targetAudience?: TargetAudience;
  audienceAnalysis?: AudienceAnalysis;
  currentValue?: string | number;
}

export interface SuggestionResponse {
  suggestion: string;
  explanation: string;
  confidence: "high" | "medium" | "low";
}

export function useAICampaignAssistant() {
  const [isLoading, setIsLoading] = useState<Record<SuggestionType, boolean>>({
    targeting: false,
    budget: false,
    objective: false,
    performance: false
  });
  const { toast } = useToast();

  const getSuggestion = async (request: SuggestionRequest): Promise<SuggestionResponse | null> => {
    try {
      setIsLoading(prev => ({ ...prev, [request.type]: true }));
      
      const { data, error } = await supabase.functions.invoke('ai-campaign-assistant', {
        body: request
      });
      
      if (error) {
        console.error(`Error getting ${request.type} suggestion:`, error);
        toast({
          title: "Suggestion Failed",
          description: `Could not get AI suggestion for ${request.type}.`,
          variant: "destructive"
        });
        return null;
      }
      
      return data as SuggestionResponse;
    } catch (error) {
      console.error(`Error in getSuggestion for ${request.type}:`, error);
      return null;
    } finally {
      setIsLoading(prev => ({ ...prev, [request.type]: false }));
    }
  };
  
  return {
    getSuggestion,
    isLoading,
  };
}
