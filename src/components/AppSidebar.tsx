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
  Logout,
} from "lucide-react";
import * as Sidebar from "@/components/ui/sidebar";
import { useUser } from "@/hooks/useUser";
import { useSignOut } from "@/hooks/useSignOut";
import { useToast } from "@/components/ui/use-toast";

export default function AppSidebar() {
  const { collapsed } = useSidebar();
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
    <Sidebar.Root className="bg-background border-r">
      <Sidebar.Container className="flex flex-col gap-6 p-4">
        <div className="flex items-center gap-4">
          <Avatar>
            <AvatarImage src={user?.user_metadata?.avatar_url} />
            <AvatarFallback>{user?.email?.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div>
              <p className="text-sm font-semibold">{user?.user_metadata?.full_name}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          )}
        </div>
        <Sidebar.Nav className="gap-2">
          <Sidebar.NavItem
            as={NavLink}
            to="/dashboard"
            className={getLinkClass}
            icon={<LayoutDashboard size={18} />}
          >
            Dashboard
          </Sidebar.NavItem>
          <Sidebar.NavItem
            as={NavLink}
            to="/projects"
            className={getLinkClass}
            icon={<Briefcase size={18} />}
          >
            Projects
          </Sidebar.NavItem>
          <Sidebar.NavItem
            as={NavLink}
            to="/saved-ads"
            className={getLinkClass}
            icon={<ImageIcon size={18} />}
          >
            Saved Ads
          </Sidebar.NavItem>
          <Sidebar.NavItem
            as={NavLink}
            to="/integrations"
            className={getLinkClass}
            icon={<Link size={18} />}
          >
            Integrations
          </Sidebar.NavItem>
        </Sidebar.Nav>
        <div className="mt-auto">
          <Sidebar.Nav className="gap-2">
            <Sidebar.NavItem
              as={NavLink}
              to="/settings"
              className={getLinkClass}
              icon={<Settings size={18} />}
            >
              Settings
            </Sidebar.NavItem>
            <Sidebar.NavItem
              as={NavLink}
              to="/help"
              className={getLinkClass}
              icon={<HelpCircle size={18} />}
            >
              Help
            </Sidebar.NavItem>
          </Sidebar.Nav>
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:bg-secondary/50"
            onClick={handleSignOut}
            disabled={isSigningOut}
          >
            <Logout size={18} className="mr-2" />
            Sign Out
          </Button>
        </div>
      </Sidebar.Container>
    </Sidebar.Root>
  );
}
