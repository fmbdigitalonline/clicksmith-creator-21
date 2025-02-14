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

  // Check for generated ads
  useEffect(() => {
    const checkGeneratedAds = async () => {
      if (projectId && projectId !== 'new') {
        console.log('Checking generated ads for project:', projectId);
        const { data: project } = await supabase
          .from('projects')
          .select('generated_ads')
          .eq('id', projectId)
          .single();
        
        console.log('Project data:', project);
        
        // Check if generated_ads exists and is an array with items
        setHasGeneratedAds(
          project?.generated_ads != null && 
          Array.isArray(project.generated_ads) && 
          project.generated_ads.length > 0
        );
      }
    };

    checkGeneratedAds();
  }, [projectId]);

  // Update the Ad Gallery URL based on the current project context
  useEffect(() => {
    if (currentPath.includes('/ad-wizard/') && projectId && projectId !== 'new') {
      setAdWizardUrl(`/ad-wizard/${projectId}`);
    }
  }, [currentPath, projectId]);

  const isDisabled = !projectId || projectId === 'new' || !hasGeneratedAds;
  
  console.log('Sidebar state:', { projectId, hasGeneratedAds, isDisabled });

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
