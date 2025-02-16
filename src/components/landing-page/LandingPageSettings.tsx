
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

interface LandingPageSettingsProps {
  landingPageId: string;
  initialData: {
    published: boolean;
    seo_title?: string;
    seo_description?: string;
    domain?: string;
  };
}

export default function LandingPageSettings({
  landingPageId,
  initialData,
}: LandingPageSettingsProps) {
  const [isPublished, setIsPublished] = useState(initialData.published);
  const [seoTitle, setSeoTitle] = useState(initialData.seo_title || "");
  const [seoDescription, setSeoDescription] = useState(initialData.seo_description || "");
  const [domain, setDomain] = useState(initialData.domain || "");
  const [isSaving, setIsSaving] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("landing_pages")
        .update({
          published: isPublished,
          seo_title: seoTitle,
          seo_description: seoDescription,
          domain: domain,
          last_edited_at: new Date().toISOString(),
        })
        .eq("id", landingPageId);

      if (error) throw error;

      await queryClient.invalidateQueries(["landing-pages"]);
      
      toast({
        title: "Settings saved",
        description: "Your landing page settings have been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error saving settings",
        description: error instanceof Error ? error.message : "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-medium">Publishing</h3>
          <p className="text-sm text-muted-foreground">
            Control the visibility and settings of your landing page
          </p>
        </div>
        <Switch
          checked={isPublished}
          onCheckedChange={setIsPublished}
        />
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="seoTitle">SEO Title</Label>
          <Input
            id="seoTitle"
            placeholder="Enter SEO title"
            value={seoTitle}
            onChange={(e) => setSeoTitle(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="seoDescription">SEO Description</Label>
          <Textarea
            id="seoDescription"
            placeholder="Enter SEO description"
            value={seoDescription}
            onChange={(e) => setSeoDescription(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="domain">Custom Domain</Label>
          <Input
            id="domain"
            placeholder="yourdomain.com"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
          />
        </div>
      </div>

      <Button 
        onClick={handleSave} 
        disabled={isSaving}
        className="w-full"
      >
        {isSaving ? "Saving..." : "Save Settings"}
      </Button>
    </div>
  );
}
