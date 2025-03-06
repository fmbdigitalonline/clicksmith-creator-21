
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { SuggestionResponse, SuggestionType, useAICampaignAssistant } from "@/hooks/useAICampaignAssistant";
import { Lightbulb, Info, Shield, Loader2, Check } from "lucide-react";
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
  const { getSuggestion, isLoading } = useAICampaignAssistant();

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
    }
  };

  const handleApplySuggestion = () => {
    if (suggestion && onSuggestionSelected) {
      onSuggestionSelected(suggestion.suggestion);
      setShowSuggestion(false);
    }
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
        return <Info className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} />;
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
      <div className="flex flex-col gap-2 border rounded-md p-3 bg-blue-50/50">
        <div className="flex justify-between items-start gap-2">
          <h4 className="font-medium text-sm flex items-center gap-1.5">
            {getIcon()}
            <span>AI Suggestion</span>
            <span className={`text-xs ${getConfidenceColor(suggestion.confidence)}`}>
              ({suggestion.confidence} confidence)
            </span>
          </h4>
          <div className="flex gap-1">
            <Button 
              variant="outline" 
              size="sm" 
              className="h-6 px-2 text-xs"
              onClick={() => setShowSuggestion(false)}
            >
              Dismiss
            </Button>
            <Button 
              size="sm" 
              className="h-6 px-2 text-xs bg-blue-600 hover:bg-blue-700"
              onClick={handleApplySuggestion}
            >
              Apply
            </Button>
          </div>
        </div>
        <p className="text-sm">{suggestion.suggestion}</p>
        <p className="text-xs text-gray-600">{suggestion.explanation}</p>
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
            className={`${buttonSizeClass} text-blue-700 border-blue-200 bg-blue-50 hover:bg-blue-100 hover:text-blue-800`}
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
