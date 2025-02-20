
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

      // Generate new content
      const { data: generatedContent, error: generationError } = await supabase.functions
        .invoke('generate-landing-page', {
          body: {
            projectId: project.id,
            businessIdea: project.business_idea,
            targetAudience: project.target_audience,
            userId: user.id,
            currentContent: landingPage?.content,
            iterationNumber: (landingPage?.content_iterations || 1) + 1,
            isRefinement: true
          }
        });

      if (generationError) {
        console.error('Generation error:', generationError);
        throw generationError;
      }

      if (!generatedContent?.content) {
        throw new Error('No content generated');
      }

      toast({
        title: "Landing page updated",
        description: "Your landing page has been updated successfully.",
      });

      // Force a reload to show the new content
      window.location.reload();

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

export default LandingPageHeader;
