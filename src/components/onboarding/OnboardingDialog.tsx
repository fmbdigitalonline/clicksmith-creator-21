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
    description: "Let's get to know you better and personalize your experience.",
  },
  {
    id: "user-type",
    title: "How will you use Ad Wizard?",
    description: "Help us tailor our features to your needs.",
  },
  {
    id: "ai-features",
    title: "AI-Powered Content Creation",
    description: "Discover how our AI helps you create compelling ads and landing pages.",
  },
  {
    id: "content-formats",
    title: "Multiple Content Formats",
    description: "Create ads and landing pages optimized for your goals.",
  },
  {
    id: "audience",
    title: "Understanding Your Audience",
    description: "Learn how we help you reach and engage the right people.",
  },
  {
    id: "getting-started",
    title: "Ready to Get Started?",
    description: "Let's begin creating your first campaign!",
  },
];

interface OnboardingDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function OnboardingDialog({ open: controlledOpen, onOpenChange }: OnboardingDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [fullName, setFullName] = useState("");
  const [industry, setIndustry] = useState("");
  const [businessSize, setBusinessSize] = useState("");
  const [userType, setUserType] = useState("consumer");
  const { toast } = useToast();
  const navigate = useNavigate();

  // Use controlled or uncontrolled open state
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = (value: boolean) => {
    if (onOpenChange) {
      onOpenChange(value);
    }
    setInternalOpen(value);
  };

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
                .insert([{ 
                  user_id: user.id, 
                  steps_completed: [],
                  user_type: 'consumer' 
                }]);
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

    // Only run the check if we're not being controlled externally
    if (controlledOpen === undefined) {
      checkOnboardingStatus();
    }
  }, [toast, controlledOpen]);

  const handleStepComplete = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (currentStep === 0 && fullName) {
        // Update profile with user information
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ 
            full_name: fullName,
            is_business_owner: userType === 'business_owner',
            can_create_landing_pages: true // Enable for all users
          })
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
            completed: currentStep === steps.length - 1,
            user_type: userType
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
            description: "You're all set to start creating amazing content!"
          });
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
    <Dialog open={isOpen} onOpenChange={setOpen}>
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
            userType={userType}
            setUserType={setUserType}
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
              disabled={currentStep === 0 && (!fullName || !userType)}
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
