
import { useLocation } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

const BreadcrumbNav = () => {
  const location = useLocation();
  const pathSegments = location.pathname.split("/").filter(Boolean);

  // Function to check if a string is a UUID
  const isUUID = (str: string) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  };

  // Query for project title if the segment is a UUID
  const { data: project, isLoading } = useQuery({
    queryKey: ['project', pathSegments[pathSegments.length - 1]],
    queryFn: async () => {
      const lastSegment = pathSegments[pathSegments.length - 1];
      if (isUUID(lastSegment)) {
        const { data, error } = await supabase
          .from('projects')
          .select('title')
          .eq('id', lastSegment)
          .single();
        
        if (error) throw error;
        return data;
      }
      return null;
    },
    enabled: isUUID(pathSegments[pathSegments.length - 1]),
  });

  const getDisplayName = (segment: string, index: number) => {
    // If it's the last segment and it's a UUID, show the project title
    if (index === pathSegments.length - 1 && isUUID(segment)) {
      if (isLoading) {
        return <Skeleton className="h-4 w-[100px] bg-muted" />;
      }
      return project?.title || "My Project";
    }

    // Handle other special cases
    switch (segment) {
      case "ad-wizard":
        return "Ad Wizard";
      case "new":
        return "New Project";
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
            <BreadcrumbLink 
              href={`/${pathSegments.slice(0, index + 1).join("/")}`}
              className="max-w-[200px] truncate"
            >
              {getDisplayName(segment, index)}
            </BreadcrumbLink>
          </BreadcrumbItem>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
};

export default BreadcrumbNav;
