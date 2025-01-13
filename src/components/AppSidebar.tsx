import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react"; // Added missing import
import { Sidebar, SidebarContent, SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "./ui/sidebar";
import { Home, Settings, Images } from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  {
    title: "Home",
    icon: Home,
    url: "/",
  },
  {
    title: "Ad Gallery",
    icon: Images,
    url: "/ad-wizard",
    showCondition: () => true, // Always show Ad Gallery
  },
  {
    title: "Settings",
    icon: Settings,
    url: "/settings",
  },
];

const AppSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  const isActive = (path: string) => {
    if (path === "/") {
      return currentPath === "/" || currentPath === "/projects";
    }
    if (path === "/ad-wizard") {
      return currentPath.includes('/ad-wizard');
    }
    return currentPath === path;
  };

  const handleMenuClick = (url: string) => {
    if (url === '/ad-wizard') {
      // Get the last wizard path or default to new
      const lastWizardPath = sessionStorage.getItem('lastWizardPath') || '/ad-wizard/new';
      navigate(lastWizardPath);
    } else {
      navigate(url);
    }
  };

  // Store the current wizard path when on a wizard route
  useEffect(() => {
    if (currentPath.includes('/ad-wizard')) {
      sessionStorage.setItem('lastWizardPath', currentPath);
    }
  }, [currentPath]);

  return (
    <Sidebar>
      <SidebarContent>
        <div className="space-y-4 py-4">
          <div className="px-3 py-2">
            <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
              Navigation
            </h2>
            <SidebarGroupContent>
              <SidebarMenu>
                {menuItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      onClick={() => handleMenuClick(item.url)}
                      className={cn(
                        isActive(item.url) && "bg-accent text-accent-foreground"
                      )}
                    >
                      <item.icon className="h-4 w-4 mr-2" />
                      {item.title}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </div>
        </div>
      </SidebarContent>
    </Sidebar>
  );
};

export default AppSidebar; // Changed to default export