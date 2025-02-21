
import { useLocation } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useProjectTitle } from "@/hooks/useProjectTitle";
import { Loader2 } from "lucide-react";

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

  const getDisplayName = (segment: string) => {
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
      case "ad-wizard":
        return "Ad Wizard";
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
              {getDisplayName(segment)}
            </BreadcrumbLink>
          </BreadcrumbItem>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
};

export default BreadcrumbNav;
