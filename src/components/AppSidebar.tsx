
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FolderKanban,
  Settings,
  ChevronRight,
  PlusCircle,
  Home,
  BookmarkIcon,
  FileText,
  Bell,
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
import { supabase } from "@/integrations/supabase/client";

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async () => {
      const { data: isAdminResult } = await supabase.rpc('is_admin');
      setIsAdmin(!!isAdminResult);
    };

    checkAdminStatus();
  }, []);

  const baseMenuItems = [
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
      title: "Settings",
      icon: Settings,
      url: "/settings",
    },
  ];

  const adminMenuItems = [
    {
      title: "Blog Admin",
      icon: FileText,
      url: "/blog-admin",
    },
    {
      title: "Admin Updates",
      icon: Bell,
      url: "/admin-updates",
    },
  ];

  const menuItems = isAdmin ? [...baseMenuItems, ...adminMenuItems] : baseMenuItems;

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return currentPath === "/dashboard";
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
