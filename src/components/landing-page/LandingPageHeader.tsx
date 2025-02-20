
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Globe, Loader2, Save, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import LandingPageSettings from "./LandingPageSettings";
import { useState } from "react";

interface LandingPageHeaderProps {
  project: any;
  landingPage: any;
}

const LandingPageHeader = ({ project, landingPage }: LandingPageHeaderProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
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
      console.log('Generated content:', content); // Debug log
      
      if (landingPage?.id) {
        console.log('Updating existing landing page:', landingPage.id); // Debug log
        const { error } = await supabase
          .from("landing_pages")
          .update({ 
            content,
            updated_at: new Date().toISOString()
          })
          .eq("id", landingPage.id);

        if (error) throw error;

        toast({
          title: "Landing page updated",
          description: "Your landing page has been updated successfully.",
        });
      } else {
        console.log('Creating new landing page for project:', project.id); // Debug log
        // Create new landing page
        const slug = generateUniqueSlug(project.title);
        const title = project.title || "Untitled Landing Page";
        
        const { data, error } = await supabase
          .from("landing_pages")
          .insert({
            project_id: project.id,
            user_id: user.id,
            title,
            content,
            slug,
            published: false, // Add this to ensure new pages start unpublished
            theme_settings: {
              colorScheme: "light",
              typography: {
                headingFont: "Inter",
                bodyFont: "Inter"
              },
              spacing: {
                sectionPadding: "py-16",
                componentGap: "gap-8"
              }
            }
          })
          .select()
          .single();

        if (error) throw error;

        console.log('Created new landing page:', data); // Debug log

        // Successfully created
        toast({
          title: "Landing page created",
          description: "Your landing page has been created successfully.",
        });

        // Redirect to the new landing page URL
        if (data) {
          // Small delay to ensure the toast is visible
          setTimeout(() => {
            navigate(`/projects/${project.id}/landing-page/${data.id}`);
          }, 500);
        }
      }
    } catch (error: any) {
      console.error('Error saving landing page:', error);
      toast({
        title: "Error saving landing page",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const visitPage = () => {
    if (!landingPage) return;
    
    if (landingPage.domain) {
      window.open(`https://${landingPage.domain}`, '_blank');
    } else if (landingPage.id) {
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
        <h1 className="text-2xl font-bold">{project?.title || "Untitled Project"} - Landing Page</h1>
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

        <Button onClick={handleSave} disabled={isSaving} className="gap-2">
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {isSaving ? "Saving..." : "Save Landing Page"}
        </Button>
      </div>
    </div>
  );
};

const generateSlug = (title: string): string => {
  return (title || "untitled")
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
      title: business_idea?.valueProposition || project.title || "Welcome",
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
