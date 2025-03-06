
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { SuggestionResponse, SuggestionType, useAICampaignAssistant } from "@/hooks/useAICampaignAssistant";
import { Lightbulb, Info, Shield, Loader2, Check, ThumbsUp, ThumbsDown, BarChart3, HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { supabase } from "@/integrations/supabase/client";
import { useParams } from "react-router-dom";

interface AISuggestionProps {
  type: SuggestionType;
  projectId?: string;
  businessIdea?: any;
  targetAudience?: any;
  audienceAnalysis?: any;
  currentValue?: string | number;
  onSuggestionSelected?: (suggestion: string) => void;
  disabled?: boolean;
  size?: "default" | "sm";
}

export function AISuggestion({
  type,
  projectId,
  businessIdea,
  targetAudience,
  audienceAnalysis,
  currentValue,
  onSuggestionSelected,
  disabled = false,
  size = "default"
}: AISuggestionProps) {
  const [suggestion, setSuggestion] = useState<SuggestionResponse | null>(null);
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState<'helpful' | 'unhelpful' | null>(null);
  const { getSuggestion, isLoading } = useAICampaignAssistant();
  const { projectId: routeProjectId } = useParams();
  const effectiveProjectId = projectId || routeProjectId;

  const handleGetSuggestion = async () => {
    const result = await getSuggestion({
      type,
      businessIdea,
      targetAudience,
      audienceAnalysis,
      currentValue
    });
    
    if (result) {
      setSuggestion(result);
      setShowSuggestion(true);
      setFeedbackSent(null);
    }
  };

  const handleApplySuggestion = () => {
    if (suggestion && onSuggestionSelected) {
      onSuggestionSelected(suggestion.suggestion);
      setShowSuggestion(false);
      
      // Log the application of the suggestion
      logSuggestionInteraction('applied');
    }
  };

  const handleFeedback = async (helpful: boolean) => {
    if (!suggestion) return;
    
    setFeedbackSent(helpful ? 'helpful' : 'unhelpful');
    
    // Log the feedback
    logSuggestionInteraction(helpful ? 'helpful' : 'unhelpful');
  };

  const logSuggestionInteraction = async (action: 'applied' | 'helpful' | 'unhelpful' | 'dismissed') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user || !effectiveProjectId) return;
      
      await supabase.from('ai_suggestion_feedback').insert({
        user_id: user.id,
        project_id: effectiveProjectId,
        suggestion_type: type,
        action,
        suggestion_content: suggestion?.suggestion,
        suggestion_confidence: suggestion?.confidence,
        current_value: currentValue?.toString()
      });
      
      console.log(`Suggestion ${action} logged successfully`);
    } catch (error) {
      console.error('Error logging suggestion interaction:', error);
    }
  };

  const handleDismissSuggestion = () => {
    setShowSuggestion(false);
    logSuggestionInteraction('dismissed');
  };

  const buttonSizeClass = size === "sm" ? "h-7 px-2 text-xs" : "h-9 px-3";

  const getIcon = () => {
    switch (type) {
      case "targeting":
        return <Lightbulb className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} />;
      case "budget":
        return <Shield className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} />;
      case "objective":
        return <Info className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} />;
      case "performance":
        return <BarChart3 className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} />;
      default:
        return <Lightbulb className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} />;
    }
  };

  const getLabel = () => {
    switch (type) {
      case "targeting":
        return "Targeting suggestion";
      case "budget":
        return "Budget suggestion";
      case "objective":
        return "Objective suggestion";
      case "performance":
        return "Performance prediction";
      default:
        return "Get AI suggestion";
    }
  };

  const getConfidenceColor = (confidence: "high" | "medium" | "low") => {
    switch (confidence) {
      case "high":
        return "text-green-600";
      case "medium":
        return "text-amber-600";
      case "low":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  if (!businessIdea && !targetAudience && type !== "performance") {
    return null;
  }

  if (isLoading[type]) {
    return (
      <Button variant="outline" className={`${buttonSizeClass} text-muted-foreground`} disabled>
        <Loader2 className={`${size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} mr-2 animate-spin`} />
        <span>Thinking...</span>
      </Button>
    );
  }

  if (showSuggestion && suggestion) {
    return (
      <div className="flex flex-col gap-2 border rounded-md p-3 bg-purple-50/50">
        <div className="flex justify-between items-start gap-2">
          <h4 className="font-medium text-sm flex items-center gap-1.5">
            {getIcon()}
            <span>AI Suggestion</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className={`text-xs ${getConfidenceColor(suggestion.confidence)} flex items-center`}>
                    ({suggestion.confidence} confidence) <HelpCircle className="h-3 w-3 ml-0.5" />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <div className="max-w-xs">
                    <p className="font-medium mb-1">Confidence Levels Explained:</p>
                    <ul className="text-xs space-y-1">
                      <li><span className="text-green-600 font-medium">High</span>: Strong data support, high reliability</li>
                      <li><span className="text-amber-600 font-medium">Medium</span>: Moderate data support, generally reliable</li>
                      <li><span className="text-red-600 font-medium">Low</span>: Limited data, consider as a starting point</li>
                    </ul>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </h4>
          <div className="flex gap-1">
            <Button 
              variant="outline" 
              size="sm" 
              className="h-6 px-2 text-xs"
              onClick={handleDismissSuggestion}
            >
              Dismiss
            </Button>
            {onSuggestionSelected && (
              <Button 
                size="sm" 
                className="h-6 px-2 text-xs bg-purple-600 hover:bg-purple-700"
                onClick={handleApplySuggestion}
              >
                <Check className="h-3 w-3 mr-1" /> Apply
              </Button>
            )}
          </div>
        </div>
        <p className="text-sm">{suggestion.suggestion}</p>
        <p className="text-xs text-gray-600">{suggestion.explanation}</p>
        
        {/* Feedback UI */}
        <div className="mt-1 pt-2 border-t border-gray-100 flex justify-between items-center">
          <span className="text-xs text-gray-500">Was this suggestion helpful?</span>
          <div className="flex gap-2">
            {feedbackSent === null ? (
              <>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleFeedback(true)} 
                  className="h-6 px-2 text-xs border-green-200 hover:bg-green-50 hover:text-green-700"
                >
                  <ThumbsUp className="h-3 w-3 mr-1" /> Yes
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleFeedback(false)} 
                  className="h-6 px-2 text-xs border-red-200 hover:bg-red-50 hover:text-red-700"
                >
                  <ThumbsDown className="h-3 w-3 mr-1" /> No
                </Button>
              </>
            ) : (
              <span className="text-xs text-purple-600 italic">
                {feedbackSent === 'helpful' ? 'Thanks for your feedback!' : 'Thanks, we\'ll improve our suggestions'}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={`${buttonSizeClass} text-purple-700 border-purple-200 bg-purple-50 hover:bg-purple-100 hover:text-purple-800`}
            onClick={handleGetSuggestion}
            disabled={disabled}
          >
            {getIcon()}
            {size === "default" && <span className="ml-2">{getLabel()}</span>}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Get AI-powered {type} suggestions</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
