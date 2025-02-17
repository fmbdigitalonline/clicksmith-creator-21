import { Link } from "react-router-dom";
import ProjectList from "@/components/projects/ProjectList";
import { HelpCircle, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { OnboardingDialog } from "@/components/onboarding/OnboardingDialog";

const Dashboard = () => {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if the user is new and hasn't completed onboarding
    const checkOnboardingStatus = () => {
      const onboardingCompleted = localStorage.getItem("onboardingCompleted");
      if (!onboardingCompleted) {
        // If onboarding hasn't been completed, show the dialog
        setShowOnboarding(true);
      }
    };

    checkOnboardingStatus();
  }, [toast, navigate]);

  const handleStartAdWizard = (projectId?: string) => {
    const onboardingCompleted = localStorage.getItem("onboardingCompleted");
    if (!onboardingCompleted) {
      // If onboarding hasn't been completed, show the dialog
      setShowOnboarding(true);
    } else {
      // If onboarding is completed, navigate to the AdWizard
      navigate(`/ad-wizard/${projectId ? projectId : 'new'}`);
    }
  };

  const handleOpenOnboarding = () => {
    setShowOnboarding(true);
  };

  return (
    <>
      <OnboardingDialog open={showOnboarding} onOpenChange={setShowOnboarding} />
      <div className="container mx-auto px-4 py-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to your Ad Wizard dashboard.
          </p>
        </div>

        <ProjectList onStartAdWizard={handleStartAdWizard} />

        {/* Resources & Help with Enhanced Visual Design */}
        <div className="grid gap-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <HelpCircle className="h-6 w-6 text-primary" />
            Resources & Help
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Getting Started</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="link"
                  className="h-auto p-0 text-left font-normal"
                  onClick={handleOpenOnboarding}
                >
                  Getting Started with Ad Wizard
                </Button>
                <Button
                  variant="link"
                  className="h-auto p-0 text-left font-normal"
                  asChild
                >
                  <Link to="/contact">Contact Support</Link>
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>AI Ad Examples</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="link" className="h-auto p-0 text-left font-normal">
                  Explore AI-generated ad examples
                </Button>
                <Button variant="link" className="h-auto p-0 text-left font-normal">
                  Learn how to create effective ad copy
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Community</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="link" className="h-auto p-0 text-left font-normal">
                  Join our Facebook group
                </Button>
                <Button variant="link" className="h-auto p-0 text-left font-normal">
                  Share your success stories
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
