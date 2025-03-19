
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
  FileText
} from "lucide-react";
import * as Sidebar from "@/components/ui/sidebar";
import { useUser } from "@/hooks/useUser";
import { useSignOut } from "@/hooks/useSignOut";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

export default function AppSidebar() {
  const { isCollapsed } = useSidebar();
  const { user } = useUser();
  const { signOut } = useSignOut();
  const { toast } = useToast();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (user) {
      const checkAdminStatus = async () => {
        const { data, error } = await supabase.rpc('is_admin');
        if (!error && data) {
          setIsAdmin(data);
        }
      };
      
      checkAdminStatus();
    }
  }, [user]);

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
    <Sidebar.Sidebar className="bg-background border-r overflow-hidden">
      <div className="flex flex-col h-full p-2 pt-16">
        <Sidebar.SidebarContent>
          <div className="flex items-center gap-2 mb-4 px-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.user_metadata?.avatar_url} />
              <AvatarFallback>{user?.email?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            {!isCollapsed && (
              <div className="truncate">
                <p className="text-sm font-semibold truncate">{user?.user_metadata?.full_name}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            )}
          </div>
          
          <div className="space-y-1">
            <Sidebar.SidebarMenu>
              <Sidebar.SidebarMenuItem>
                <NavLink to="/dashboard" className={getLinkClass}>
                  <Sidebar.SidebarMenuButton>
                    <LayoutDashboard size={18} className="shrink-0" />
                    <span className="truncate">Dashboard</span>
                  </Sidebar.SidebarMenuButton>
                </NavLink>
              </Sidebar.SidebarMenuItem>
              <Sidebar.SidebarMenuItem>
                <NavLink to="/projects" className={getLinkClass}>
                  <Sidebar.SidebarMenuButton>
                    <Briefcase size={18} className="shrink-0" />
                    <span className="truncate">Projects</span>
                  </Sidebar.SidebarMenuButton>
                </NavLink>
              </Sidebar.SidebarMenuItem>
              <Sidebar.SidebarMenuItem>
                <NavLink to="/saved-ads" className={getLinkClass}>
                  <Sidebar.SidebarMenuButton>
                    <ImageIcon size={18} className="shrink-0" />
                    <span className="truncate">Saved Ads</span>
                  </Sidebar.SidebarMenuButton>
                </NavLink>
              </Sidebar.SidebarMenuItem>
              <Sidebar.SidebarMenuItem>
                <NavLink to="/integrations" className={getLinkClass}>
                  <Sidebar.SidebarMenuButton>
                    <Link size={18} className="shrink-0" />
                    <span className="truncate">Integrations</span>
                  </Sidebar.SidebarMenuButton>
                </NavLink>
              </Sidebar.SidebarMenuItem>
              
              {isAdmin && (
                <Sidebar.SidebarMenuItem>
                  <NavLink to="/blog-admin" className={getLinkClass}>
                    <Sidebar.SidebarMenuButton>
                      <FileText size={18} className="shrink-0" />
                      <span className="truncate">Blog Admin</span>
                    </Sidebar.SidebarMenuButton>
                  </NavLink>
                </Sidebar.SidebarMenuItem>
              )}
            </Sidebar.SidebarMenu>
          </div>
          
          <div className="mt-auto pt-4">
            <Sidebar.SidebarMenu>
              <Sidebar.SidebarMenuItem>
                <NavLink to="/settings" className={getLinkClass}>
                  <Sidebar.SidebarMenuButton>
                    <Settings size={18} className="shrink-0" />
                    <span className="truncate">Settings</span>
                  </Sidebar.SidebarMenuButton>
                </NavLink>
              </Sidebar.SidebarMenuItem>
              <Sidebar.SidebarMenuItem>
                <NavLink to="/help" className={getLinkClass}>
                  <Sidebar.SidebarMenuButton>
                    <HelpCircle size={18} className="shrink-0" />
                    <span className="truncate">Help</span>
                  </Sidebar.SidebarMenuButton>
                </NavLink>
              </Sidebar.SidebarMenuItem>
            </Sidebar.SidebarMenu>
            
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:bg-secondary/50 mt-2"
              onClick={handleSignOut}
              disabled={isSigningOut}
            >
              <LogOut size={18} className="mr-2 shrink-0" />
              <span className="truncate">Sign Out</span>
            </Button>
          </div>
        </Sidebar.SidebarContent>
      </div>
    </Sidebar.Sidebar>
  );
}
