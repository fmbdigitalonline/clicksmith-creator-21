import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Check, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { SavedAd, FacebookAdSettings } from "@/types/campaignTypes";

interface FacebookAdSettingsProps {
  ad: SavedAd;
  onSettingsChanged: (adId: string, settings: FacebookAdSettings) => void;
}

// Facebook call-to-action options
const CTA_OPTIONS = [
  { value: "LEARN_MORE", label: "Learn More" },
  { value: "SHOP_NOW", label: "Shop Now" },
  { value: "SIGN_UP", label: "Sign Up" },
  { value: "BOOK_TRAVEL", label: "Book Now" },
  { value: "DOWNLOAD", label: "Download" },
  { value: "GET_OFFER", label: "Get Offer" },
  { value: "GET_QUOTE", label: "Get Quote" },
  { value: "CONTACT_US", label: "Contact Us" },
  { value: "SUBSCRIBE", label: "Subscribe" },
  { value: "DONATE_NOW", label: "Donate" },
  { value: "APPLY_NOW", label: "Apply Now" },
  { value: "BUY_NOW", label: "Buy Now" },
  { value: "WATCH_MORE", label: "Watch More" }
];

// Language options
const LANGUAGE_OPTIONS = [
  { value: "en_US", label: "English (US)" },
  { value: "es_LA", label: "Spanish" },
  { value: "fr_FR", label: "French" },
  { value: "de_DE", label: "German" },
  { value: "it_IT", label: "Italian" },
  { value: "pt_BR", label: "Portuguese (Brazil)" },
  { value: "zh_CN", label: "Chinese (Simplified)" },
  { value: "ja_JP", label: "Japanese" },
  { value: "ru_RU", label: "Russian" },
  { value: "ar_AR", label: "Arabic" }
];

// Browser addon options - updated with correct options
const BROWSER_ADDONS = [
  { value: "none", label: "Geen (geen knop toevoegen)" },
  { value: "call_button", label: "Bellen (voeg een belknop toe)" },
  { value: "express_form", label: "Expresformulier (verzamel contactgegevens)" },
  { value: "chat_app", label: "Chatberichtenapp (Messenger, Instagram of WhatsApp)" },
  { value: "instant_experience", label: "Instant Experience (snel ladende mobiele ervaring)" },
  { value: "facebook_event", label: "Facebook-evenement (naar evenement op Facebook)" }
];

export default function FacebookAdSettingsComponent({ ad, onSettingsChanged }: FacebookAdSettingsProps) {
  const [expanded, setExpanded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<FacebookAdSettings>({
    website_url: ad.fb_ad_settings?.website_url || ad.website_url || "",
    call_to_action: ad.fb_ad_settings?.call_to_action || ad.call_to_action || "LEARN_MORE",
    visible_link: ad.fb_ad_settings?.visible_link || ad.visible_link || "",
    language: ad.fb_ad_settings?.language || ad.fb_language || "en_US",
    url_parameters: ad.fb_ad_settings?.url_parameters || ad.url_parameters || "",
    browser_addons: ad.fb_ad_settings?.browser_addons || "none"
  });
  const { toast } = useToast();

  const handleChange = (field: keyof FacebookAdSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('ad_feedback')
        .update({
          fb_ad_settings: settings as any,
          website_url: settings.website_url,
          call_to_action: settings.call_to_action,
          visible_link: settings.visible_link,
          fb_language: settings.language,
          url_parameters: settings.url_parameters,
          browser_addons: settings.browser_addons
        })
        .eq('id', ad.id);

      if (error) throw error;

      onSettingsChanged(ad.id, settings);
      
      toast({
        title: "Settings saved",
        description: "Facebook ad settings have been updated",
      });
    } catch (error) {
      console.error('Error saving Facebook ad settings:', error);
      toast({
        title: "Error",
        description: "Failed to save Facebook ad settings",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mt-3 border rounded-lg overflow-hidden">
      <div 
        className="p-3 bg-blue-50 border-b border-blue-100 flex justify-between items-center cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <h4 className="font-medium text-blue-800 flex items-center">
          <span className="inline-block w-5 h-5 rounded-full bg-facebook mr-2 flex items-center justify-center text-white text-xs font-bold">f</span>
          Facebook Ad Settings
        </h4>
        <Button variant="ghost" size="sm" onClick={(e) => {
          e.stopPropagation();
          setExpanded(!expanded);
        }}>
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>
      
      {expanded && (
        <CardContent className="p-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="website_url">Website URL (required)</Label>
            <Input
              id="website_url"
              placeholder="https://yourdomain.com"
              value={settings.website_url || ""}
              onChange={(e) => handleChange("website_url", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Landing page URL for your ad</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="visible_link">Visible Link Display</Label>
            <Input
              id="visible_link"
              placeholder="yourdomain.com"
              value={settings.visible_link || ""}
              onChange={(e) => handleChange("visible_link", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Shown URL in ad (can be different from actual URL)</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="cta_select">Call to Action Button</Label>
            <Select
              value={settings.call_to_action || "LEARN_MORE"}
              onValueChange={(value) => handleChange("call_to_action", value)}
            >
              <SelectTrigger id="cta_select">
                <SelectValue placeholder="Select a call to action" />
              </SelectTrigger>
              <SelectContent>
                {CTA_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="lang_select">Ad Language</Label>
            <Select
              value={settings.language || "en_US"}
              onValueChange={(value) => handleChange("language", value)}
            >
              <SelectTrigger id="lang_select">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGE_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="url_params">URL Parameters</Label>
            <Input
              id="url_params"
              placeholder="utm_source=facebook&utm_medium=paid"
              value={settings.url_parameters || ""}
              onChange={(e) => handleChange("url_parameters", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Tracking parameters to add to your URL</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="browser_addon">Browser Add-on</Label>
            <Select
              value={settings.browser_addons || "none"}
              onValueChange={(value) => handleChange("browser_addons", value)}
            >
              <SelectTrigger id="browser_addon">
                <SelectValue placeholder="Select add-on" />
              </SelectTrigger>
              <SelectContent>
                {BROWSER_ADDONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Special features to add to your ad</p>
          </div>
          
          <div className="pt-2 flex justify-end">
            <Button onClick={saveSettings} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
          
          {settings.website_url && (
            <div className="mt-4 pt-4 border-t">
              <h5 className="text-sm font-medium mb-2">Preview</h5>
              <div className="bg-gray-50 p-3 rounded-md">
                <div className="flex items-center text-sm">
                  <span className="text-gray-600 mr-2">
                    {settings.visible_link || new URL(settings.website_url).hostname}
                  </span>
                  <ExternalLink className="h-3 w-3 text-gray-400" />
                </div>
                <div className="my-1">
                  <p className="font-medium text-facebook text-sm">{ad.headline}</p>
                </div>
                <div className="text-xs text-gray-600 line-clamp-2">{ad.primary_text}</div>
                <div className="mt-2">
                  <span className="inline-block px-2 py-1 rounded bg-facebook text-white text-xs font-medium">
                    {CTA_OPTIONS.find(o => o.value === settings.call_to_action)?.label || "Learn More"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </div>
  );
}
