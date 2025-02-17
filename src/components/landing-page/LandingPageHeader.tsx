
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Globe, Save, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import LandingPageSettings from "./LandingPageSettings";

interface LandingPageHeaderProps {
  project: any;
  landingPage: any;
}

const LandingPageHeader = ({ project, landingPage }: LandingPageHeaderProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSave = async () => {
    // Get the current user's ID
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to save landing pages.",
        variant: "destructive",
      });
      return;
    }

    const content = generateLandingPageContent(project);
    
    if (landingPage) {
      const { error } = await supabase
        .from("landing_pages")
        .update({ content })
        .eq("id", landingPage.id);

      if (error) {
        toast({
          title: "Error updating landing page",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Landing page updated",
        description: "Your landing page has been updated successfully.",
      });
    } else {
      const slug = generateUniqueSlug(project.title);
      const { error } = await supabase
        .from("landing_pages")
        .insert({
          project_id: project.id,
          user_id: user.id,
          title: project.title,
          content,
          slug,
        });

      if (error) {
        toast({
          title: "Error creating landing page",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Landing page created",
        description: "Your landing page has been created successfully.",
      });
    }
  };

  const visitPage = () => {
    if (landingPage?.domain) {
      window.open(`https://${landingPage.domain}`, '_blank');
    } else {
      window.open(`/preview/${landingPage.id}`, '_blank');
    }
  };

  return (
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">{project.title} - Landing Page</h1>
      </div>
      <div className="flex items-center gap-2">
        {landingPage?.published && (
          <Button 
            variant="outline" 
            onClick={visitPage}
            className="gap-2"
          >
            <Globe className="h-4 w-4" />
            Visit Page
          </Button>
        )}
        
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Landing Page Settings</SheetTitle>
            </SheetHeader>
            {landingPage && (
              <LandingPageSettings
                landingPageId={landingPage.id}
                initialData={{
                  published: landingPage.published,
                  seo_title: landingPage.seo_title,
                  seo_description: landingPage.seo_description,
                  domain: landingPage.domain,
                }}
              />
            )}
          </SheetContent>
        </Sheet>

        <Button onClick={handleSave} className="gap-2">
          <Save className="h-4 w-4" />
          Save Landing Page
        </Button>
      </div>
    </div>
  );
};

const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
};

const generateUniqueSlug = (title: string): string => {
  const baseSlug = generateSlug(title);
  // Add a random 6-character suffix
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  return `${baseSlug}-${randomSuffix}`;
};

const generateLandingPageContent = (project: any) => {
  const { business_idea, target_audience, audience_analysis } = project;
  
  return {
    hero: {
      title: business_idea?.valueProposition || project.title,
      description: business_idea?.description || "",
      cta: "Get Started Now",
    },
    features: audience_analysis?.keyFeatures || [],
    benefits: audience_analysis?.benefits || [],
    painPoints: target_audience?.painPoints || [],
    testimonials: generateTestimonials(target_audience, audience_analysis),
    callToAction: {
      title: "Ready to Get Started?",
      description: "Join thousands of satisfied customers and transform your business today.",
      buttonText: "Start Now",
    },
  };
};

const generateTestimonials = (targetAudience: any, audienceAnalysis: any) => {
  // Generate testimonials based on target audience and analysis
  const testimonials = [];
  
  if (targetAudience?.demographics) {
    testimonials.push({
      name: "John Doe",
      role: targetAudience.demographics,
      content: `As ${targetAudience.demographics}, I found this solution incredibly helpful. ${audienceAnalysis?.positiveOutcomes?.[0] || ""}`,
    });
  }

  if (targetAudience?.painPoints?.[0]) {
    testimonials.push({
      name: "Jane Smith",
      role: "Business Owner",
      content: `I struggled with ${targetAudience.painPoints[0]}, but this solution changed everything. ${audienceAnalysis?.benefits?.[0] || ""}`,
    });
  }

  return testimonials;
};

export default LandingPageHeader;
