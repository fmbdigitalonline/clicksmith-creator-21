
import { useLocation } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useProjectTitle } from "@/hooks/useProjectTitle";
import { Loader2, CircleDot } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  const { title: projectTitle, isLoading } = useProjectTitle(projectId);

  const getStepInfo = (segment: string) => {
    if (segment === 'ad-wizard') {
      return {
        steps: [
          { name: "Business Idea", description: "Define your business concept" },
          { name: "Target Audience", description: "Identify your ideal customers" },
          { name: "Audience Analysis", description: "Deep dive into audience insights" },
          { name: "Ad Gallery", description: "View and manage generated ads" }
        ],
        currentStep: 1
      };
    }
    return null;
  };

  const getDisplayName = (segment: string, index: number) => {
    // If this segment is a UUID and we're loading or have a project title
    if (isUUID(segment)) {
      if (isLoading) {
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
        if (stepInfo) {
          return (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger className="flex items-center gap-2">
                  <span>Ad Wizard</span>
                  <div className="flex items-center gap-1">
                    {stepInfo.steps.map((step, i) => (
                      <CircleDot 
                        key={i}
                        className={`h-3 w-3 ${i + 1 === stepInfo.currentStep ? 'text-facebook' : 'text-muted-foreground/30'}`}
                      />
                    ))}
                  </div>
                </TooltipTrigger>
                <TooltipContent className="w-64">
                  <div className="space-y-2">
                    {stepInfo.steps.map((step, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                          i + 1 === stepInfo.currentStep ? 'bg-facebook text-white' : 'bg-muted'
                        }`}>
                          {i + 1}
                        </div>
                        <div>
                          <div className="font-medium">{step.name}</div>
                          <div className="text-xs text-muted-foreground">{step.description}</div>
                        </div>
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
