
import { NavLink } from "react-router-dom";
import { useSidebar } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Briefcase,
  ImageIcon,
  LayoutDashboard,
  Link as LinkIcon,
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
import { useIsMobile } from "@/hooks/use-mobile";
import { useTranslation } from "react-i18next";

export default function AppSidebar() {
  const { isCollapsed } = useSidebar();
  const { user } = useUser();
  const { signOut } = useSignOut();
  const { toast } = useToast();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const isMobile = useIsMobile();
  const { t } = useTranslation('common');

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
  
  return (
    <Sidebar.Sidebar className="bg-background border-r">
      <div className="flex flex-col h-full p-1 pt-16">
        <Sidebar.SidebarContent>
          <div className="flex items-center gap-2 mb-4 px-2">
            <Avatar className="h-8 w-8 flex-shrink-0">
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
              <div className="space-y-1">
                <NavLink 
                  to="/dashboard" 
                  className={({ isActive }) => 
                    `flex items-center w-full h-10 rounded-md text-sm font-medium px-2 transition-colors ${isActive 
                      ? "bg-secondary text-foreground" 
                      : "text-muted-foreground hover:bg-muted"}`
                  }
                >
                  <LayoutDashboard size={18} className="flex-shrink-0" />
                  {!isCollapsed && <span className="ml-2 truncate">{t('navigation.dashboard')}</span>}
                </NavLink>
                
                <NavLink 
                  to="/projects" 
                  className={({ isActive }) => 
                    `flex items-center w-full h-10 rounded-md text-sm font-medium px-2 transition-colors ${isActive 
                      ? "bg-secondary text-foreground" 
                      : "text-muted-foreground hover:bg-muted"}`
                  }
                >
                  <Briefcase size={18} className="flex-shrink-0" />
                  {!isCollapsed && <span className="ml-2 truncate">{t('navigation.projects')}</span>}
                </NavLink>
                
                <NavLink 
                  to="/saved-ads" 
                  className={({ isActive }) => 
                    `flex items-center w-full h-10 rounded-md text-sm font-medium px-2 transition-colors ${isActive 
                      ? "bg-secondary text-foreground" 
                      : "text-muted-foreground hover:bg-muted"}`
                  }
                >
                  <ImageIcon size={18} className="flex-shrink-0" />
                  {!isCollapsed && <span className="ml-2 truncate">{t('navigation.gallery')}</span>}
                </NavLink>
                
                <NavLink 
                  to="/integrations" 
                  className={({ isActive }) => 
                    `flex items-center w-full h-10 rounded-md text-sm font-medium px-2 transition-colors ${isActive 
                      ? "bg-secondary text-foreground" 
                      : "text-muted-foreground hover:bg-muted"}`
                  }
                >
                  <LinkIcon size={18} className="flex-shrink-0" />
                  {!isCollapsed && <span className="ml-2 truncate">{t('navigation.integrations')}</span>}
                </NavLink>
                
                {isAdmin && (
                  <NavLink 
                    to="/blog-admin" 
                    className={({ isActive }) => 
                      `flex items-center w-full h-10 rounded-md text-sm font-medium px-2 transition-colors ${isActive 
                        ? "bg-secondary text-foreground" 
                        : "text-muted-foreground hover:bg-muted"}`
                    }
                  >
                    <FileText size={18} className="flex-shrink-0" />
                    {!isCollapsed && <span className="ml-2 truncate">{t('navigation.blog')}</span>}
                  </NavLink>
                )}
              </div>
            </Sidebar.SidebarMenu>
          </div>
          
          <div className="mt-auto pt-4">
            <div className="space-y-1">
              <NavLink 
                to="/settings" 
                className={({ isActive }) => 
                  `flex items-center w-full h-10 rounded-md text-sm font-medium px-2 transition-colors ${isActive 
                    ? "bg-secondary text-foreground" 
                    : "text-muted-foreground hover:bg-muted"}`
                }
              >
                <Settings size={18} className="flex-shrink-0" />
                {!isCollapsed && <span className="ml-2 truncate">{t('navigation.settings')}</span>}
              </NavLink>
              
              <NavLink 
                to="/help" 
                className={({ isActive }) => 
                  `flex items-center w-full h-10 rounded-md text-sm font-medium px-2 transition-colors ${isActive 
                    ? "bg-secondary text-foreground" 
                    : "text-muted-foreground hover:bg-muted"}`
                }
              >
                <HelpCircle size={18} className="flex-shrink-0" />
                {!isCollapsed && <span className="ml-2 truncate">{t('navigation.help')}</span>}
              </NavLink>
              
              <button
                className="flex items-center w-full h-10 rounded-md text-sm font-medium px-2 transition-colors text-muted-foreground hover:bg-muted"
                onClick={handleSignOut}
                disabled={isSigningOut}
              >
                <LogOut size={18} className="flex-shrink-0" />
                {!isCollapsed && <span className="ml-2 truncate">{t('auth.logout.button')}</span>}
              </button>
            </div>
          </div>
        </Sidebar.SidebarContent>
      </div>
    </Sidebar.Sidebar>
  );
}
