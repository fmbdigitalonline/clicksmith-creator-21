import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FolderKanban,
  Settings,
  ChevronRight,
  PlusCircle,
  Images,
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

const menuItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    url: "/",
  },
  {
    title: "Projects",
    icon: FolderKanban,
    url: "/projects",
  },
  {
    title: "Ad Gallery",
    icon: Images,
    url: "/ad-wizard",
    showCondition: (pathname: string) => pathname.includes('/ad-wizard'),
  },
  {
    title: "Settings",
    icon: Settings,
    url: "/settings",
  },
];

export function AppSidebar() {
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
              {menuItems
                .filter(item => !item.showCondition || item.showCondition(currentPath))
                .map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
                    <Link to={item.url} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                      {isActive(item.url) && (
                        <ChevronRight className="ml-auto h-4 w-4" />
                      )}
                    </Link>
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