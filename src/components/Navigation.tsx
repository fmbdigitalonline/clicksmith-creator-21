
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Settings, CreditCard, PlusCircle, Images } from "lucide-react";
import { CreditDisplay } from "./CreditDisplay";

const Navigation = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  
  const isActive = (path: string) => {
    if (path === "/ad-wizard") {
      return currentPath.includes('/ad-wizard');
    }
    return currentPath === path;
  };

  const handleStartClick = () => {
    window.location.href = "/ad-wizard/new";
  };

  const showAdGallery = currentPath.includes('/ad-wizard');
  
  return (
    <nav className="fixed top-0 left-0 right-0 h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
      <div className="container h-full">
        <div className="flex h-full items-center justify-between">
          <Link to="/dashboard" className="flex items-center">
            <span className="text-2xl font-bold tracking-tight text-[#1A1F2C] hover:text-primary/90 transition-colors">
              Viable
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <CreditDisplay />
            <Button
              variant="default"
              size="sm"
              onClick={handleStartClick}
              className="gap-2"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Start</span>
            </Button>
            {showAdGallery && (
              <Button
                variant="ghost"
                size="sm"
                asChild
                className={cn(
                  "gap-2",
                  isActive("/ad-wizard") && "bg-accent"
                )}
              >
                <Link to="/ad-wizard">
                  <Images className="h-4 w-4" />
                  <span>Ad Gallery</span>
                </Link>
              </Button>
            )}
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
            <Button
              variant="ghost"
              size="sm"
              asChild
              className={cn(
                "gap-2",
                isActive("/settings") && "bg-accent"
              )}
            >
              <Link to="/settings">
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
