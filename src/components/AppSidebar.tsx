
import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useSidebar } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Briefcase,
  ImageIcon,
  LayoutDashboard,
  Link,
  Settings,
  HelpCircle,
  LogOut,
} from "lucide-react";
import * as Sidebar from "@/components/ui/sidebar";
import { useUser } from "@/hooks/useUser";
import { useSignOut } from "@/hooks/useSignOut";
import { useToast } from "@/components/ui/use-toast";

export default function AppSidebar() {
  const { isCollapsed } = useSidebar();
  const { user } = useUser();
  const { signOut } = useSignOut();
  const { toast } = useToast();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
    } catch (error: any) {
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSigningOut(false);
    }
  };

  const getLinkClass = ({ isActive }: { isActive: boolean }) => {
    return isActive
      ? "bg-secondary text-foreground hover:bg-secondary/80"
      : "text-muted-foreground hover:bg-secondary/50";
  };
  
  return (
    <Sidebar.Sidebar className="bg-background border-r">
      <Sidebar.SidebarContent className="flex flex-col gap-6 p-4">
        <div className="flex items-center gap-4">
          <Avatar>
            <AvatarImage src={user?.user_metadata?.avatar_url} />
            <AvatarFallback>{user?.email?.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <div>
              <p className="text-sm font-semibold">{user?.user_metadata?.full_name}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          )}
        </div>
        <Sidebar.SidebarMenu className="gap-2">
          <Sidebar.SidebarMenuItem>
            <Sidebar.SidebarMenuButton
              as={NavLink}
              to="/dashboard"
              className={getLinkClass}
            >
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </Sidebar.SidebarMenuButton>
          </Sidebar.SidebarMenuItem>
          <Sidebar.SidebarMenuItem>
            <Sidebar.SidebarMenuButton
              as={NavLink}
              to="/projects"
              className={getLinkClass}
            >
              <Briefcase size={18} />
              <span>Projects</span>
            </Sidebar.SidebarMenuButton>
          </Sidebar.SidebarMenuItem>
          <Sidebar.SidebarMenuItem>
            <Sidebar.SidebarMenuButton
              as={NavLink}
              to="/saved-ads"
              className={getLinkClass}
            >
              <ImageIcon size={18} />
              <span>Saved Ads</span>
            </Sidebar.SidebarMenuButton>
          </Sidebar.SidebarMenuItem>
          <Sidebar.SidebarMenuItem>
            <Sidebar.SidebarMenuButton
              as={NavLink}
              to="/integrations"
              className={getLinkClass}
            >
              <Link size={18} />
              <span>Integrations</span>
            </Sidebar.SidebarMenuButton>
          </Sidebar.SidebarMenuItem>
        </Sidebar.SidebarMenu>
        <div className="mt-auto">
          <Sidebar.SidebarMenu className="gap-2">
            <Sidebar.SidebarMenuItem>
              <Sidebar.SidebarMenuButton
                as={NavLink}
                to="/settings"
                className={getLinkClass}
              >
                <Settings size={18} />
                <span>Settings</span>
              </Sidebar.SidebarMenuButton>
            </Sidebar.SidebarMenuItem>
            <Sidebar.SidebarMenuItem>
              <Sidebar.SidebarMenuButton
                as={NavLink}
                to="/help"
                className={getLinkClass}
              >
                <HelpCircle size={18} />
                <span>Help</span>
              </Sidebar.SidebarMenuButton>
            </Sidebar.SidebarMenuItem>
          </Sidebar.SidebarMenu>
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:bg-secondary/50"
            onClick={handleSignOut}
            disabled={isSigningOut}
          >
            <LogOut size={18} className="mr-2" />
            Sign Out
          </Button>
        </div>
      </Sidebar.SidebarContent>
    </Sidebar.Sidebar>
  );
}

