import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Home, Settings, CreditCard, PlusCircle, BookmarkIcon, Images } from "lucide-react";
import { CreditDisplay } from "./CreditDisplay";

const Navigation = () => {
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

  const showAdGallery = currentPath.includes('/ad-wizard');
  
  return (
    <nav className="fixed top-0 left-0 right-0 h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
      <div className="container h-full">
        <div className="flex h-full items-center justify-between">
          <Link to="/" className="font-semibold">
            Viable
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
            <Button
              variant="ghost"
              size="sm"
              asChild
              className={cn(
                "gap-2",
                isActive("/") && "bg-accent"
              )}
            >
              <Link to="/">
                <Home className="h-4 w-4" />
                <span>Home</span>
              </Link>
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
                isActive("/saved-ads") && "bg-accent"
              )}
            >
              <Link to="/saved-ads">
                <BookmarkIcon className="h-4 w-4" />
                <span>Saved Ads</span>
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