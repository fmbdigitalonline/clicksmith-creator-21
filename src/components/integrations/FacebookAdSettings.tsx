
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Facebook, Globe, Link, ExternalLink, Code, Settings, CheckCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FacebookAdSettings } from "@/types/campaignTypes";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const CALL_TO_ACTION_OPTIONS = [
  "Learn More",
  "Shop Now",
  "Sign Up",
  "Book Now",
  "Contact Us",
  "Subscribe",
  "Apply Now",
  "Download",
  "Watch More",
  "Get Offer"
];

const LANGUAGE_OPTIONS = [
  "English (US)",
  "English (UK)",
  "Spanish",
  "French",
  "German",
  "Italian",
  "Portuguese",
  "Dutch",
  "Japanese",
  "Chinese (Simplified)"
];

const BROWSER_ADDON_OPTIONS = [
  "None (no button added)",
  "Shop Pay",
  "Meta Pay",
  "WhatsApp Button"
];

interface FacebookAdSettingsFormProps {
  adIds: string[];
  projectUrl?: string;
  onSettingsSaved?: (settings: FacebookAdSettings) => void;
  existingSettings?: FacebookAdSettings;
}

export default function FacebookAdSettingsForm({
  adIds,
  projectUrl,
  onSettingsSaved,
  existingSettings
}: FacebookAdSettingsFormProps) {
  const [settings, setSettings] = useState<FacebookAdSettings>({
    website_url: existingSettings?.website_url || projectUrl || "",
    visible_link: existingSettings?.visible_link || "",
    call_to_action: existingSettings?.call_to_action || "Learn More",
    ad_language: existingSettings?.ad_language || "English (US)",
    url_parameters: existingSettings?.url_parameters || "utm_source=facebook&utm_medium=paid",
    browser_addon: existingSettings?.browser_addon || "None (no button added)"
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (adIds.length > 0) {
      fetchExistingSettings();
    }
  }, [adIds]);

  useEffect(() => {
    // Initialize with project URL if available
    if (projectUrl && !settings.website_url) {
      setSettings(prev => ({
        ...prev,
        website_url: projectUrl,
        visible_link: prev.visible_link || extractDomain(projectUrl)
      }));
    }
  }, [projectUrl]);

  // Track changes
  useEffect(() => {
    if (existingSettings) {
      const changed = 
        settings.website_url !== existingSettings.website_url ||
        settings.visible_link !== existingSettings.visible_link ||
        settings.call_to_action !== existingSettings.call_to_action ||
        settings.ad_language !== existingSettings.ad_language ||
        settings.url_parameters !== existingSettings.url_parameters ||
        settings.browser_addon !== existingSettings.browser_addon;
      
      setHasChanges(changed);
    }
  }, [settings, existingSettings]);

  const extractDomain = (url: string): string => {
    try {
      if (!url.startsWith('http')) {
        url = 'https://' + url;
      }
      const domain = new URL(url).hostname;
      return domain;
    } catch (e) {
      return url;
    }
  };

  const fetchExistingSettings = async () => {
    if (adIds.length === 0) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('ad_feedback')
        .select('fb_ad_settings')
        .eq('id', adIds[0])
        .single();
      
      if (error) throw error;
      
      if (data?.fb_ad_settings) {
        setSettings({
          website_url: data.fb_ad_settings.website_url || projectUrl || "",
          visible_link: data.fb_ad_settings.visible_link || "",
          call_to_action: data.fb_ad_settings.call_to_action || "Learn More",
          ad_language: data.fb_ad_settings.ad_language || "English (US)",
          url_parameters: data.fb_ad_settings.url_parameters || "utm_source=facebook&utm_medium=paid",
          browser_addon: data.fb_ad_settings.browser_addon || "None (no button added)"
        });
      }
    } catch (error) {
      console.error("Error fetching Facebook ad settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof FacebookAdSettings, value: string) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveSettings = async () => {
    if (!settings.website_url) {
      toast({
        title: "Website URL Required",
        description: "Please enter a valid website URL for your Facebook ad.",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      // Update all selected ads with the same settings
      for (const adId of adIds) {
        const { error } = await supabase
          .from('ad_feedback')
          .update({
            fb_ad_settings: settings
          })
          .eq('id', adId);
        
        if (error) throw error;
      }

      toast({
        title: "Settings Saved",
        description: `Facebook ad settings saved for ${adIds.length} ad${adIds.length !== 1 ? 's' : ''}.`,
      });

      if (onSettingsSaved) {
        onSettingsSaved(settings);
      }
      
      setHasChanges(false);
    } catch (error) {
      console.error("Error saving Facebook ad settings:", error);
      toast({
        title: "Error",
        description: "Failed to save Facebook ad settings. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Facebook className="h-5 w-5 mr-2 text-blue-600" />
            Loading Facebook Ad Settings...
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 min-h-[300px] flex items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="animate-spin h-8 w-8 border-4 border-blue-600 rounded-full border-t-transparent"></div>
            <p className="mt-2 text-sm text-muted-foreground">Loading settings...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <Facebook className="h-5 w-5 mr-2 text-blue-600" />
          Facebook Ad Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="website_url" className="flex items-center">
            <Globe className="h-4 w-4 mr-1" /> Website URL <span className="text-red-500 ml-1">*</span>
          </Label>
          <Input
            id="website_url"
            placeholder="https://yourdomain.com"
            value={settings.website_url}
            onChange={(e) => handleInputChange('website_url', e.target.value)}
          />
          <p className="text-xs text-muted-foreground">Landing page URL for your ad</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="visible_link" className="flex items-center">
            <Link className="h-4 w-4 mr-1" /> Visible Link Display
          </Label>
          <Input
            id="visible_link"
            placeholder="yourdomain.com"
            value={settings.visible_link}
            onChange={(e) => handleInputChange('visible_link', e.target.value)}
          />
          <p className="text-xs text-muted-foreground">Shown URL in ad (can be different from actual URL)</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="call_to_action" className="flex items-center">
            <ExternalLink className="h-4 w-4 mr-1" /> Call to Action Button
          </Label>
          <Select
            value={settings.call_to_action}
            onValueChange={(value) => handleInputChange('call_to_action', value)}
          >
            <SelectTrigger id="call_to_action">
              <SelectValue placeholder="Select a CTA" />
            </SelectTrigger>
            <SelectContent>
              {CALL_TO_ACTION_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="ad_language" className="flex items-center">
            <Globe className="h-4 w-4 mr-1" /> Ad Language
          </Label>
          <Select
            value={settings.ad_language}
            onValueChange={(value) => handleInputChange('ad_language', value)}
          >
            <SelectTrigger id="ad_language">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGE_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="url_parameters" className="flex items-center">
            <Code className="h-4 w-4 mr-1" /> URL Parameters
          </Label>
          <Input
            id="url_parameters"
            placeholder="utm_source=facebook&utm_medium=paid"
            value={settings.url_parameters}
            onChange={(e) => handleInputChange('url_parameters', e.target.value)}
          />
          <p className="text-xs text-muted-foreground">Tracking parameters to add to your URL</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="browser_addon" className="flex items-center">
            <Settings className="h-4 w-4 mr-1" /> Browser Add-on
          </Label>
          <Select
            value={settings.browser_addon}
            onValueChange={(value) => handleInputChange('browser_addon', value)}
          >
            <SelectTrigger id="browser_addon">
              <SelectValue placeholder="Select add-on" />
            </SelectTrigger>
            <SelectContent>
              {BROWSER_ADDON_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="pt-4">
          <Button 
            onClick={handleSaveSettings}
            disabled={isSaving || !settings.website_url || !hasChanges}
            className="w-full"
          >
            {isSaving ? (
              <>
                <div className="animate-spin h-4 w-4 mr-2 border-2 border-white rounded-full border-t-transparent"></div>
                Saving...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Save Facebook Ad Settings
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
