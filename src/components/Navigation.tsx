
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CreditCard, HelpCircle, MessageSquare, BookOpen, BookOpen as BlogIcon, LogIn, User } from "lucide-react";
import { CreditDisplay } from "./CreditDisplay";
import { useSession, useSupabaseClient } from "@supabase/auth-helpers-react";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navigation = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  const session = useSession();
  const supabase = useSupabaseClient();
  const { toast } = useToast();
  
  const isActive = (path: string) => {
    if (path === "/ad-wizard") {
      return currentPath.includes('/ad-wizard');
    }
    return currentPath === path;
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Signed out successfully",
        description: "You have been logged out of your account",
      });
    } catch (error) {
      toast({
        title: "Error signing out",
        description: "There was a problem signing out. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <nav className="fixed top-0 left-0 right-0 h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
      <div className="container h-full">
        <div className="flex h-full items-center justify-between">
          <Link to="/" className="flex items-center">
            <span className="text-2xl font-bold tracking-tight text-[#1A1F2C] hover:text-primary/90 transition-colors">
              Viable
            </span>
          </Link>
          <div className="flex items-center gap-4">
            {session && (
              <>
                <CreditDisplay />
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className={cn(
                    "gap-2",
                    isActive("/dashboard") && "bg-accent"
                  )}
                >
                  <Link to="/dashboard">
                    Dashboard
                  </Link>
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="sm"
              asChild
              className={cn(
                "gap-2",
                isActive("/blog") && "bg-accent"
              )}
            >
              <Link to="/blog">
                <BlogIcon className="h-4 w-4" />
                <span>Blog</span>
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              asChild
              className={cn(
                "gap-2",
                isActive("/pricing") && "bg-accent"
              )}
            >
              <Link to="/pricing">
                <CreditCard className="h-4 w-4" />
                <span>Pricing</span>
              </Link>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <HelpCircle className="h-4 w-4" />
                  <span>Help</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link to="/faq" className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    FAQ
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/contact" className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Contact Support
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {session ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <User className="h-4 w-4" />
                    <span>Account</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link to="/projects">My Projects</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/settings">Settings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="default"
                size="sm"
                asChild
                className="gap-2"
              >
                <Link to="/login">
                  <LogIn className="h-4 w-4" />
                  Sign In
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
