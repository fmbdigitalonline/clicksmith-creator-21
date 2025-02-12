import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight } from "lucide-react";
import { OnboardingStepContent } from "./OnboardingStepContent";

const steps = [
  {
    id: "profile",
    title: "Welcome to Ad Wizard! 👋",
    description: "Let's start by getting to know you and your business better.",
  },
  {
    id: "ai-features",
    title: "AI-Powered Ad Creation",
    description: "Discover how our AI helps you create compelling ads.",
  },
  {
    id: "ad-formats",
    title: "Multiple Ad Formats",
    description: "Create ads optimized for different placements and objectives.",
  },
  {
    id: "audience",
    title: "Understanding Your Audience",
    description: "Learn how we help you reach the right people.",
  },
  {
    id: "getting-started",
    title: "Ready to Create Your First Ad?",
    description: "Let's start with your first campaign!",
  },
];

export function OnboardingDialog() {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [fullName, setFullName] = useState("");
  const [industry, setIndustry] = useState("");
  const [businessSize, setBusinessSize] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Check user's profile first
        const { data: profile } = await supabase
          .from('profiles')
          .select('created_at, full_name')
          .eq('id', user.id)
          .single();
        
        // Only proceed with onboarding if this is a new user (profile was just created)
        // and they haven't completed onboarding yet
        if (profile) {
          const createdAt = new Date(profile.created_at);
          const now = new Date();
          const isNewUser = now.getTime() - createdAt.getTime() < 5000; // Within 5 seconds
          
          if (isNewUser) {
            const { data: onboarding } = await supabase
              .from("onboarding")
              .select("completed")
              .eq("user_id", user.id)
              .maybeSingle();

            if (!onboarding) {
              setOpen(true);
              // Create onboarding record
              await supabase
                .from("onboarding")
                .insert([{ user_id: user.id, steps_completed: [] }]);
            } else if (!onboarding.completed) {
              setOpen(true);
            }

            // If user already has a full name, pre-fill it
            if (profile.full_name) {
              setFullName(profile.full_name);
            }
          }
        }
      } catch (error) {
        console.error("Error in checkOnboardingStatus:", error);
        toast({
          title: "Error",
          description: "Failed to check onboarding status",
          variant: "destructive",
        });
      }
    };

    checkOnboardingStatus();
  }, [toast]);

  const handleStepComplete = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (currentStep === 0 && fullName) {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ full_name: fullName })
          .eq("id", user.id);

        if (profileError) {
          console.error("Error updating profile:", profileError);
          toast({
            title: "Error updating profile",
            description: profileError.message,
            variant: "destructive",
          });
          return;
        }
      }

      const { data: onboarding, error: fetchError } = await supabase
        .from("onboarding")
        .select("steps_completed")
        .eq("user_id", user.id)
        .maybeSingle();

      if (fetchError) {
        console.error("Error fetching onboarding steps:", fetchError);
        toast({
          title: "Error updating onboarding progress",
          description: fetchError.message,
          variant: "destructive",
        });
        return;
      }

      const stepsCompleted = onboarding?.steps_completed || [];
      if (Array.isArray(stepsCompleted)) {
        stepsCompleted.push(steps[currentStep].id);

        const { error: updateError } = await supabase
          .from("onboarding")
          .update({
            steps_completed: stepsCompleted,
            completed: currentStep === steps.length - 1
          })
          .eq("user_id", user.id);

        if (updateError) {
          console.error("Error updating onboarding:", updateError);
          toast({
            title: "Error saving progress",
            description: updateError.message,
            variant: "destructive",
          });
          return;
        }

        if (currentStep < steps.length - 1) {
          setCurrentStep(prev => prev + 1);
        } else {
          setOpen(false);
          toast({
            title: "Welcome aboard! 🎉",
            description: "You're all set to start creating amazing ads!"
          });
          navigate("/");
        }
      }
    } catch (error) {
      console.error("Error in handleStepComplete:", error);
      toast({
        title: "Error",
        description: "Failed to complete onboarding step",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">{steps[currentStep].title}</h2>
            <p className="text-sm text-muted-foreground">
              {steps[currentStep].description}
            </p>
          </div>
          <OnboardingStepContent
            currentStep={currentStep}
            fullName={fullName}
            setFullName={setFullName}
            industry={industry}
            setIndustry={setIndustry}
            businessSize={businessSize}
            setBusinessSize={setBusinessSize}
          />
          <div className="flex justify-between items-center mt-6">
            <div className="flex space-x-1">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`h-1 w-6 rounded-full ${
                    index === currentStep ? "bg-facebook" : "bg-muted"
                  }`}
                />
              ))}
            </div>
            <Button
              onClick={handleStepComplete}
              disabled={currentStep === 0 && (!fullName || !industry || !businessSize)}
              className="bg-facebook hover:bg-facebook/90"
            >
              {currentStep === steps.length - 1 ? "Get Started" : "Continue"}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
