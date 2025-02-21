
import { useLocation } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useProjectTitle } from "@/hooks/useProjectTitle";
import { Loader2, CircleDot, Check, Lock, ArrowRight } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

interface BusinessIdea {
  description: string;
  valueProposition?: string;
}

// Create a specific type for breadcrumb data
interface BreadcrumbProjectData {
  current_step: number;
  business_idea: BusinessIdea | null;
  target_audience: Record<string, any> | null;
  audience_analysis: Record<string, any> | null;
  generated_ads: any[];
}

interface WizardStep {
  name: string;
  description: string;
  status: 'completed' | 'current' | 'upcoming' | 'locked';
  completionData?: {
    hasData: boolean;
    summary?: string;
  };
}

// Type guard for BusinessIdea
const isBusinessIdea = (value: unknown): value is BusinessIdea => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'description' in value &&
    typeof (value as BusinessIdea).description === 'string'
  );
};

// Type guard for Record<string, any>
const isRecord = (value: unknown): value is Record<string, any> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

// Type guard for array
const isNonEmptyArray = (value: unknown): value is any[] => {
  return Array.isArray(value) && value.length > 0;
};

const BreadcrumbNav = () => {
  const location = useLocation();
  const pathSegments = location.pathname.split("/").filter(Boolean);

  // Function to check if a string is a UUID
  const isUUID = (str: string) => {
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidPattern.test(str);
  };

  // Get project ID if present in the path
  const projectId = pathSegments.find(isUUID) || null;
  const { title: projectTitle, isLoading: isTitleLoading } = useProjectTitle(projectId);

  // Fetch project data for step status using the new type
  const { data: projectData, isLoading: isProjectLoading } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      try {
        if (!projectId) return null;
        const { data, error } = await supabase
          .from("projects")
          .select("current_step, business_idea, target_audience, audience_analysis, generated_ads")
          .eq("id", projectId)
          .single();

        if (error) {
          console.error("Error fetching project:", error);
          throw error;
        }

        // Transform and validate the data as BreadcrumbProjectData
        const typedData: BreadcrumbProjectData = {
          current_step: typeof data.current_step === 'number' ? data.current_step : 1,
          business_idea: isBusinessIdea(data.business_idea) ? data.business_idea : null,
          target_audience: isRecord(data.target_audience) ? data.target_audience : null,
          audience_analysis: isRecord(data.audience_analysis) ? data.audience_analysis : null,
          generated_ads: Array.isArray(data.generated_ads) ? data.generated_ads : []
        };

        return typedData;
      } catch (error) {
        console.error("Error in queryFn:", error);
        throw error;
      }
    },
    enabled: !!projectId,
  });

  const getStepInfo = (segment: string): { steps: WizardStep[]; currentStep: number } | null => {
    if (segment === 'ad-wizard' && projectData) {
      const steps: WizardStep[] = [
        {
          name: "Business Idea",
          description: "Define your business concept",
          status: isBusinessIdea(projectData.business_idea) ? 'completed' : 
                 projectData.current_step === 1 ? 'current' : 'upcoming',
          completionData: isBusinessIdea(projectData.business_idea) ? {
            hasData: true,
            summary: projectData.business_idea.description.substring(0, 50) + '...'
          } : undefined
        },
        {
          name: "Target Audience",
          description: "Identify your ideal customers",
          status: projectData.target_audience ? 'completed' :
                 projectData.current_step === 2 ? 'current' :
                 projectData.current_step < 2 ? 'locked' : 'upcoming',
          completionData: projectData.target_audience ? {
            hasData: true,
            summary: "Target audience defined"
          } : undefined
        },
        {
          name: "Audience Analysis",
          description: "Deep dive into audience insights",
          status: projectData.audience_analysis ? 'completed' :
                 projectData.current_step === 3 ? 'current' :
                 projectData.current_step < 3 ? 'locked' : 'upcoming',
          completionData: projectData.audience_analysis ? {
            hasData: true,
            summary: "Analysis complete"
          } : undefined
        },
        {
          name: "Ad Gallery",
          description: "View and manage generated ads",
          status: isNonEmptyArray(projectData.generated_ads) ? 'completed' :
                 projectData.current_step === 4 ? 'current' :
                 projectData.current_step < 4 ? 'locked' : 'upcoming',
          completionData: isNonEmptyArray(projectData.generated_ads) ? {
            hasData: true,
            summary: `${projectData.generated_ads.length} ads generated`
          } : undefined
        }
      ];

      return {
        steps,
        currentStep: projectData.current_step || 1
      };
    }
    return null;
  };

  const getDisplayName = (segment: string, index: number) => {
    // If this segment is a UUID and we're loading or have a project title
    if (isUUID(segment)) {
      if (isTitleLoading) {
        return (
          <span className="flex items-center gap-2">
            <Loader2 className="h-3 w-3 animate-spin" />
            Loading...
          </span>
        );
      }
      return projectTitle || "Project";
    }

    // Handle other special cases
    switch (segment) {
      case "ad-wizard": {
        const stepInfo = getStepInfo(segment);
        if (stepInfo && !isProjectLoading) {
          return (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger className="flex items-center gap-2 group">
                  <span>Ad Wizard</span>
                  <div className="flex items-center gap-1.5 pl-2 border-l">
                    {stepInfo.steps.map((step, i) => (
                      <div 
                        key={i}
                        className={`transition-all duration-300 ease-in-out transform
                          ${step.status === 'current' ? 'scale-110' : ''}
                          ${step.status === 'completed' ? 'animate-fade-in' : ''}
                          ${step.status !== 'locked' ? 'hover:scale-105' : ''}
                        `}
                      >
                        {getStepIcon(step.status)}
                      </div>
                    ))}
                  </div>
                </TooltipTrigger>
                <TooltipContent className="w-72">
                  <div className="space-y-3">
                    {stepInfo.steps.map((step, i) => (
                      <div 
                        key={i} 
                        className={`flex items-start gap-3 p-2 rounded-lg transition-colors
                          ${step.status === 'current' ? 'bg-facebook/10' : ''}
                          ${step.status === 'completed' ? 'hover:bg-green-50' : ''}
                        `}
                      >
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs
                          ${step.status === 'completed' ? 'bg-green-500 text-white' :
                            step.status === 'current' ? 'bg-facebook text-white' :
                            step.status === 'locked' ? 'bg-muted-foreground/20' : 'bg-muted'}
                        `}>
                          {step.status === 'completed' ? <Check className="h-3 w-3" /> : i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="font-medium">{step.name}</div>
                            {step.status === 'current' && (
                              <span className="text-xs text-facebook animate-pulse">Current</span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">{step.description}</div>
                          {step.completionData && (
                            <div className="mt-1 text-xs text-green-600 font-medium">
                              {step.completionData.summary}
                            </div>
                          )}
                        </div>
                        {step.status === 'completed' && (
                          <ArrowRight className="h-4 w-4 text-muted-foreground/50" />
                        )}
                      </div>
                    ))}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        }
        return "Ad Wizard";
      }
      default:
        return segment.charAt(0).toUpperCase() + segment.slice(1);
    }
  };

  const getStepIcon = (status: WizardStep['status']) => {
    switch (status) {
      case 'completed':
        return <Check className="h-3 w-3 text-green-500" />;
      case 'current':
        return <CircleDot className="h-3 w-3 text-facebook animate-pulse" />;
      case 'locked':
        return <Lock className="h-3 w-3 text-muted-foreground/50" />;
      default:
        return <CircleDot className="h-3 w-3 text-muted-foreground/30" />;
    }
  };

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/dashboard">Home</BreadcrumbLink>
        </BreadcrumbItem>
        {pathSegments.map((segment, index) => (
          <BreadcrumbItem key={index}>
            <BreadcrumbSeparator />
            <BreadcrumbLink href={`/${pathSegments.slice(0, index + 1).join("/")}`}>
              {getDisplayName(segment, index)}
            </BreadcrumbLink>
          </BreadcrumbItem>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
};

export default BreadcrumbNav;
