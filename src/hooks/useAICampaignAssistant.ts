
import { useState } from "react";
import { BusinessIdea, TargetAudience, AudienceAnalysis } from "@/types/adWizard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AISuggestionFeedback } from "@/types/aiSuggestionTypes";

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
  const [suggestionsCache, setSuggestionsCache] = useState<Record<string, SuggestionResponse>>({});
  const { toast } = useToast();

  const getSuggestion = async (request: SuggestionRequest): Promise<SuggestionResponse | null> => {
    try {
      // Create a cache key based on the request properties
      const cacheKey = `${request.type}:${JSON.stringify(request.businessIdea)}:${JSON.stringify(request.targetAudience)}:${JSON.stringify(request.audienceAnalysis)}:${request.currentValue}`;
      
      // Check cache first for identical requests
      if (suggestionsCache[cacheKey]) {
        return suggestionsCache[cacheKey];
      }
      
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
      
      // Save to cache
      if (data) {
        setSuggestionsCache(prev => ({ ...prev, [cacheKey]: data }));
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
