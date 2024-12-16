import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, CheckCircle2 } from "lucide-react";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  component: React.ReactNode;
}

export function OnboardingDialog() {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [fullName, setFullName] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: onboarding } = await supabase
      .from("onboarding")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!onboarding || !onboarding.completed) {
      setOpen(true);
      if (!onboarding) {
        await supabase.from("onboarding").insert([
          { user_id: user.id, steps_completed: [] }
        ]);
      }
    }
  };

  const handleStepComplete = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (currentStep === 0 && fullName) {
      await supabase
        .from("profiles")
        .update({ full_name: fullName })
        .eq("id", user.id);
    }

    const { data: onboarding } = await supabase
      .from("onboarding")
      .select("steps_completed")
      .eq("user_id", user.id)
      .single();

    const stepsCompleted = onboarding?.steps_completed || [];
    stepsCompleted.push(steps[currentStep].id);

    await supabase
      .from("onboarding")
      .update({
        steps_completed: stepsCompleted,
        completed: currentStep === steps.length - 1
      })
      .eq("user_id", user.id);

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
  };

  const steps: OnboardingStep[] = [
    {
      id: "profile",
      title: "Welcome to Ad Wizard! 👋",
      description: "Let's start by getting to know you better.",
      component: (
        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">What's your name?</Label>
            <Input
              id="fullName"
              placeholder="Enter your full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
        </div>
      )
    },
    {
      id: "intro",
      title: "Create Engaging Ads",
      description: "Our AI-powered wizard helps you create compelling Facebook ads that convert.",
      component: (
        <div className="space-y-4 mt-4">
          <div className="flex items-start space-x-2">
            <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
            <div>
              <p className="font-medium">AI-Powered Creation</p>
              <p className="text-sm text-muted-foreground">
                Our wizard analyzes your business and generates tailored ad content
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
            <div>
              <p className="font-medium">Multiple Formats</p>
              <p className="text-sm text-muted-foreground">
                Create ads in various sizes optimized for different placements
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
            <div>
              <p className="font-medium">Performance Insights</p>
              <p className="text-sm text-muted-foreground">
                Get AI-powered suggestions to improve your ad performance
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "getting-started",
      title: "Ready to Get Started?",
      description: "Click the button below to create your first ad campaign!",
      component: (
        <div className="space-y-4 mt-4">
          <p className="text-sm text-muted-foreground">
            We'll guide you through the process step by step. You can always access help and documentation from the settings menu.
          </p>
        </div>
      )
    }
  ];

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
          {steps[currentStep].component}
          <div className="flex justify-end">
            <Button
              onClick={handleStepComplete}
              disabled={currentStep === 0 && !fullName}
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