import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, CheckCircle2, Lightbulb, Target, Users, Wand2 } from "lucide-react";

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
  const [industry, setIndustry] = useState("");
  const [businessSize, setBusinessSize] = useState("");
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
    if (Array.isArray(stepsCompleted)) {
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
    }
  };

  const steps: OnboardingStep[] = [
    {
      id: "profile",
      title: "Welcome to Ad Wizard! 👋",
      description: "Let's start by getting to know you and your business better.",
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
          <div className="space-y-2">
            <Label htmlFor="industry">What industry are you in?</Label>
            <Select value={industry} onValueChange={setIndustry}>
              <SelectTrigger id="industry">
                <SelectValue placeholder="Select your industry" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ecommerce">E-commerce</SelectItem>
                <SelectItem value="saas">SaaS</SelectItem>
                <SelectItem value="retail">Retail</SelectItem>
                <SelectItem value="services">Services</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="businessSize">How big is your business?</Label>
            <Select value={businessSize} onValueChange={setBusinessSize}>
              <SelectTrigger id="businessSize">
                <SelectValue placeholder="Select business size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="solo">Solo Entrepreneur</SelectItem>
                <SelectItem value="small">Small Business (2-10)</SelectItem>
                <SelectItem value="medium">Medium Business (11-50)</SelectItem>
                <SelectItem value="large">Large Business (50+)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )
    },
    {
      id: "ai-features",
      title: "AI-Powered Ad Creation",
      description: "Discover how our AI helps you create compelling ads.",
      component: (
        <div className="space-y-6 mt-4">
          <div className="flex items-start space-x-3">
            <Wand2 className="h-6 w-6 text-facebook mt-1" />
            <div>
              <p className="font-medium">Smart Content Generation</p>
              <p className="text-sm text-muted-foreground">
                Our AI analyzes your business and target audience to generate engaging ad copy and visuals that convert.
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <Target className="h-6 w-6 text-facebook mt-1" />
            <div>
              <p className="font-medium">Audience Targeting</p>
              <p className="text-sm text-muted-foreground">
                Get AI-powered suggestions for targeting the right audience based on your business goals.
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <Lightbulb className="h-6 w-6 text-facebook mt-1" />
            <div>
              <p className="font-medium">Creative Optimization</p>
              <p className="text-sm text-muted-foreground">
                Receive real-time suggestions to improve your ad's performance and engagement.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "ad-formats",
      title: "Multiple Ad Formats",
      description: "Create ads optimized for different placements and objectives.",
      component: (
        <div className="space-y-6 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="border rounded-lg p-4">
              <p className="font-medium mb-2">Image Ads</p>
              <div className="aspect-video bg-muted rounded-md mb-2" />
              <p className="text-sm text-muted-foreground">
                Static images optimized for feed and sidebar placements
              </p>
            </div>
            <div className="border rounded-lg p-4">
              <p className="font-medium mb-2">Carousel Ads</p>
              <div className="aspect-video bg-muted rounded-md mb-2" />
              <p className="text-sm text-muted-foreground">
                Multiple images to showcase products or features
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "audience",
      title: "Understanding Your Audience",
      description: "Learn how we help you reach the right people.",
      component: (
        <div className="space-y-6 mt-4">
          <div className="flex items-start space-x-3">
            <Users className="h-6 w-6 text-facebook mt-1" />
            <div>
              <p className="font-medium">Advanced Targeting</p>
              <p className="text-sm text-muted-foreground">
                Target your ideal customers based on demographics, interests, and behaviors.
              </p>
            </div>
          </div>
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Audience Insights</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center">
                <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                Demographic analysis
              </li>
              <li className="flex items-center">
                <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                Interest mapping
              </li>
              <li className="flex items-center">
                <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                Behavior tracking
              </li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: "getting-started",
      title: "Ready to Create Your First Ad?",
      description: "Let's start with your first campaign!",
      component: (
        <div className="space-y-6 mt-4">
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-medium mb-2">Quick Start Guide</h4>
            <ol className="space-y-3 text-sm">
              <li className="flex items-start">
                <span className="font-medium text-facebook mr-2">1.</span>
                Create a new project from the dashboard
              </li>
              <li className="flex items-start">
                <span className="font-medium text-facebook mr-2">2.</span>
                Follow the AI wizard to define your campaign goals
              </li>
              <li className="flex items-start">
                <span className="font-medium text-facebook mr-2">3.</span>
                Review and customize generated ad content
              </li>
              <li className="flex items-start">
                <span className="font-medium text-facebook mr-2">4.</span>
                Export your ads to Facebook
              </li>
            </ol>
          </div>
          <p className="text-sm text-muted-foreground">
            Don't worry, we'll guide you through each step of the process!
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