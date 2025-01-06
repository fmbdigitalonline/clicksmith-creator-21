import ProjectList from "@/components/projects/ProjectList";
import { Button } from "@/components/ui/button";
import { Wand2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAnonymousSession } from "@/hooks/useAnonymousSession";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";

const Index = () => {
  const navigate = useNavigate();
  const { sessionId, hasUsedTrial } = useAnonymousSession();
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
    };

    checkAuth();
  }, []);

  const handleStartAdWizard = async (projectId?: string) => {
    if (projectId) {
      navigate(`/ad-wizard/${projectId}`);
    } else if (isAuthenticated) {
      navigate("/ad-wizard/new");
    } else if (!hasUsedTrial) {
      navigate("/ad-wizard/new");
    } else {
      toast({
        title: "Free Trial Used",
        description: "Please sign up to continue using ProfitPilot and get 11 more free credits!",
        variant: "destructive",
      });
      navigate("/login");
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight">ProfitPilot</h1>
          <p className="text-lg text-muted-foreground">
            Discover profitable ideas fast through targeted market testing and AI-powered Facebook ad campaigns
          </p>
          {!isAuthenticated && !hasUsedTrial && (
            <p className="text-sm text-muted-foreground">
              Try it once for free, no registration required!
            </p>
          )}
          <Button 
            size="lg" 
            onClick={() => handleStartAdWizard()}
            className="mt-4 gap-2"
          >
            <Wand2 className="h-5 w-5" />
            {isAuthenticated ? "Start ProfitPilot Wizard" : hasUsedTrial ? "Sign Up to Continue" : "Try it Free"}
          </Button>
        </div>
        {isAuthenticated && <ProjectList onStartAdWizard={handleStartAdWizard} />}
      </div>
    </div>
  );
};

export default Index;