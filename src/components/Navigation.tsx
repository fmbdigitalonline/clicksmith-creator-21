
import { Link, useLocation, useParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Settings, CreditCard, PlusCircle, Images } from "lucide-react";
import { CreditDisplay } from "./CreditDisplay";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const Navigation = () => {
  const location = useLocation();
  const { projectId } = useParams();
  const currentPath = location.pathname;
  const [hasGeneratedAds, setHasGeneratedAds] = useState(false);
  
  useEffect(() => {
    const checkGeneratedAds = async () => {
      if (projectId && projectId !== 'new') {
        const { data: project } = await supabase
          .from('projects')
          .select('generated_ads')
          .eq('id', projectId)
          .single();
        
        // Check if generated_ads exists and is an array with items
        setHasGeneratedAds(
          project?.generated_ads != null && 
          Array.isArray(project.generated_ads) && 
          project.generated_ads.length > 0
        );
      }
    };

    checkGeneratedAds();
  }, [projectId]);

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
  const adGalleryUrl = projectId && projectId !== 'new' ? `/ad-wizard/${projectId}` : '/ad-wizard/new';
  const isDisabled = !projectId || projectId === 'new' || !hasGeneratedAds;
  
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
                asChild={!isDisabled}
                className={cn(
                  "gap-2",
                  isActive("/ad-wizard") && "bg-accent",
                  isDisabled && "opacity-50 cursor-not-allowed"
                )}
                disabled={isDisabled}
              >
                {isDisabled ? (
                  <div className="flex items-center">
                    <Images className="h-4 w-4 mr-2" />
                    <span>Ad Gallery</span>
                  </div>
                ) : (
                  <Link to={adGalleryUrl}>
                    <Images className="h-4 w-4" />
                    <span>Ad Gallery</span>
                  </Link>
                )}
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
