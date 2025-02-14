import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  LayoutDashboard,
  FolderKanban,
  Settings,
  ChevronRight,
  PlusCircle,
  Images,
  Home,
  BookmarkIcon,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Button } from "./ui/button";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { projectId } = useParams();
  const currentPath = location.pathname;
  const [adWizardUrl, setAdWizardUrl] = useState("/ad-wizard/new");
  const [hasGeneratedAds, setHasGeneratedAds] = useState(false);
  const [lastValidProjectId, setLastValidProjectId] = useState<string | null>(null);

  // Check for generated ads
  useEffect(() => {
    const checkGeneratedAds = async () => {
      const currentProjectId = projectId || lastValidProjectId;
      
      if (currentProjectId && currentProjectId !== 'new') {
        console.log('Checking generated ads for project:', currentProjectId);
        const { data: project } = await supabase
          .from('projects')
          .select('generated_ads')
          .eq('id', currentProjectId)
          .single();
        
        console.log('Project data:', project);
        
        const hasAds = project?.generated_ads != null && 
                      Array.isArray(project.generated_ads) && 
                      project.generated_ads.length > 0;
        
        setHasGeneratedAds(hasAds);
        
        // Update last valid project ID if we have ads
        if (hasAds && currentProjectId) {
          setLastValidProjectId(currentProjectId);
        }
      }
    };

    checkGeneratedAds();
  }, [projectId, lastValidProjectId]);

  // Update the Ad Gallery URL based on the current project context
  useEffect(() => {
    const currentProjectId = projectId || lastValidProjectId;
    if (currentPath.includes('/ad-wizard/') && currentProjectId && currentProjectId !== 'new') {
      setAdWizardUrl(`/ad-wizard/${currentProjectId}`);
    }
  }, [currentPath, projectId, lastValidProjectId]);

  const currentProjectId = projectId || lastValidProjectId;
  const isDisabled = (!currentProjectId || currentProjectId === 'new' || !hasGeneratedAds);
  
  console.log('Sidebar state:', { projectId: currentProjectId, hasGeneratedAds, isDisabled });

  const menuItems = [
    {
      title: "Home",
      icon: Home,
      url: "/dashboard",
    },
    {
      title: "Projects",
      icon: FolderKanban,
      url: "/projects",
    },
    {
      title: "Saved Ads",
      icon: BookmarkIcon,
      url: "/saved-ads",
    },
    {
      title: "Ad Gallery",
      icon: Images,
      url: adWizardUrl,
      disabled: isDisabled,
    },
    {
      title: "Settings",
      icon: Settings,
      url: "/settings",
    },
  ];

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return currentPath === "/dashboard";
    }
    if (path.startsWith("/ad-wizard")) {
      return currentPath.includes('/ad-wizard');
    }
    return currentPath === path;
  };

  const handleStartClick = () => {
    navigate("/ad-wizard/new");
  };

  return (
    <Sidebar>
      <SidebarContent>
        <div className="px-4 py-4">
          <Button 
            className="w-full bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary"
            onClick={handleStartClick}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Start
          </Button>
        </div>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild={!item.disabled}
                    isActive={isActive(item.url)}
                    tooltip={item.disabled ? "Generate ads first to access the gallery" : item.title}
                    className={cn(
                      item.disabled && "opacity-50 cursor-not-allowed pointer-events-none"
                    )}
                  >
                    {item.disabled ? (
                      <div className="flex items-center gap-2">
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </div>
                    ) : (
                      <Link to={item.url} className="flex items-center gap-2">
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                        {isActive(item.url) && (
                          <ChevronRight className="ml-auto h-4 w-4" />
                        )}
                      </Link>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
