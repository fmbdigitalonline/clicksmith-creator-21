
import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Globe, Copy } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { FacebookAdSettings } from "@/types/campaignTypes";
import { Json } from "@/integrations/supabase/types";

// Define the schema for Facebook ad settings
const facebookAdSettingsSchema = z.object({
  website_url: z.string().url({ message: "Please enter a valid URL" }),
  visible_link: z.string().optional(),
  call_to_action: z.string(),
  ad_language: z.string(),
  url_parameters: z.string().optional(),
  browser_addon: z.string().optional(),
});

interface FacebookAdSettingsFormProps {
  adIds: string[];
  projectUrl?: string;
  onSettingsSaved?: (settings: FacebookAdSettings, adId: string, applyToAll?: boolean) => void;
  initialSettings?: FacebookAdSettings;
  showApplyToAllOption?: boolean;
}

// Call to action options for Facebook ads
const CTA_OPTIONS = [
  { value: "LEARN_MORE", label: "Learn More" },
  { value: "SHOP_NOW", label: "Shop Now" },
  { value: "SIGN_UP", label: "Sign Up" },
  { value: "BOOK_TRAVEL", label: "Book Now" },
  { value: "GET_QUOTE", label: "Get Quote" },
  { value: "APPLY_NOW", label: "Apply Now" },
  { value: "CONTACT_US", label: "Contact Us" },
  { value: "DOWNLOAD", label: "Download" },
  { value: "GET_OFFER", label: "Get Offer" },
  { value: "SUBSCRIBE", label: "Subscribe" },
  { value: "DONATE", label: "Donate" },
  { value: "WATCH_MORE", label: "Watch More" },
];

// Language options for Facebook ads
const LANGUAGE_OPTIONS = [
  { value: "en_US", label: "English (US)" },
  { value: "es_LA", label: "Spanish" },
  { value: "fr_FR", label: "French" },
  { value: "de_DE", label: "German" },
  { value: "it_IT", label: "Italian" },
  { value: "pt_BR", label: "Portuguese (Brazil)" },
  { value: "zh_CN", label: "Chinese (Simplified)" },
  { value: "ja_JP", label: "Japanese" },
  { value: "ko_KR", label: "Korean" },
  { value: "ru_RU", label: "Russian" },
];

export default function FacebookAdSettingsForm({
  adIds,
  projectUrl,
  onSettingsSaved,
  initialSettings,
  showApplyToAllOption = false,
}: FacebookAdSettingsFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [applyToAll, setApplyToAll] = useState(false);
  const { toast } = useToast();

  // Default settings with required properties
  const defaultSettings: FacebookAdSettings = {
    website_url: projectUrl || "",
    visible_link: "",
    call_to_action: "LEARN_MORE",
    ad_language: "en_US",
    url_parameters: "",
    browser_addon: "",
  };

  const form = useForm<z.infer<typeof facebookAdSettingsSchema>>({
    resolver: zodResolver(facebookAdSettingsSchema),
    defaultValues: initialSettings || defaultSettings,
  });

  // Fetch existing settings or use initialSettings if provided
  useEffect(() => {
    const fetchSettings = async () => {
      if (initialSettings) {
        form.reset(initialSettings);
        return;
      }

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
          // Ensure type safety by coalescing with defaultSettings
          const fbSettings = data.fb_ad_settings as Record<string, unknown>;
          const safeSettings: FacebookAdSettings = {
            ...defaultSettings,
            website_url: typeof fbSettings.website_url === 'string' ? fbSettings.website_url : defaultSettings.website_url,
            visible_link: typeof fbSettings.visible_link === 'string' ? fbSettings.visible_link : defaultSettings.visible_link,
            call_to_action: typeof fbSettings.call_to_action === 'string' ? fbSettings.call_to_action : defaultSettings.call_to_action,
            ad_language: typeof fbSettings.ad_language === 'string' ? fbSettings.ad_language : defaultSettings.ad_language,
            url_parameters: typeof fbSettings.url_parameters === 'string' ? fbSettings.url_parameters : defaultSettings.url_parameters,
            browser_addon: typeof fbSettings.browser_addon === 'string' ? fbSettings.browser_addon : defaultSettings.browser_addon,
          };
          form.reset(safeSettings);
        }
      } catch (error) {
        console.error('Error fetching ad settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [adIds, form, initialSettings, projectUrl, defaultSettings]);

  // Update form when projectUrl changes
  useEffect(() => {
    if (projectUrl && !form.getValues().website_url) {
      form.setValue('website_url', projectUrl);
    }
  }, [projectUrl, form]);

  const handleUseProjectUrl = () => {
    if (projectUrl) {
      form.setValue('website_url', projectUrl);
    }
  };

  const onSubmit = async (values: z.infer<typeof facebookAdSettingsSchema>) => {
    if (adIds.length === 0) {
      toast({
        title: "Error",
        description: "No ads selected to apply settings to.",
        variant: "destructive",
      });
      return;
    }

    // Ensure the submitted values have all required properties of FacebookAdSettings
    const completeSettings: FacebookAdSettings = {
      website_url: values.website_url,
      visible_link: values.visible_link || "",
      call_to_action: values.call_to_action,
      ad_language: values.ad_language,
      url_parameters: values.url_parameters || "",
      browser_addon: values.browser_addon || "",
    };

    setIsLoading(true);
    try {
      if (onSettingsSaved) {
        onSettingsSaved(completeSettings, adIds[0], applyToAll);
      } else {
        // Direct database update fallback if no callback provided
        const { error } = await supabase
          .from('ad_feedback')
          .update({ fb_ad_settings: completeSettings as unknown as Json })
          .eq('id', adIds[0]);
          
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Facebook ad settings have been saved.",
        });
      }
    } catch (error) {
      console.error('Error saving ad settings:', error);
      toast({
        title: "Error",
        description: "Failed to save Facebook ad settings.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Website URL field with project URL suggestion */}
        <FormField
          control={form.control}
          name="website_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Website URL</FormLabel>
              <div className="flex gap-2">
                <FormControl>
                  <Input placeholder="https://example.com" {...field} />
                </FormControl>
                {projectUrl && (
                  <Button type="button" variant="outline" size="sm" onClick={handleUseProjectUrl}>
                    <Copy className="h-4 w-4 mr-1" />
                    Use Project
                  </Button>
                )}
              </div>
              <FormDescription>
                The destination URL when people click your ad
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Visible link text */}
        <FormField
          control={form.control}
          name="visible_link"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Display URL (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="example.com" {...field} />
              </FormControl>
              <FormDescription>
                A shorter, cleaner URL to display in your ad, leave empty to use the actual URL
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Call to action dropdown */}
        <FormField
          control={form.control}
          name="call_to_action"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Call to Action</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a call to action" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {CTA_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                The button text that encourages people to take action
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Ad language dropdown */}
        <FormField
          control={form.control}
          name="ad_language"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ad Language</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {LANGUAGE_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                The primary language of your ad
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* URL parameters for tracking */}
        <FormField
          control={form.control}
          name="url_parameters"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL Parameters (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="utm_source=facebook&utm_medium=cpc" {...field} />
              </FormControl>
              <FormDescription>
                Add tracking parameters to your URL
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* "Apply to all" checkbox */}
        {showApplyToAllOption && (
          <div className="flex items-center space-x-2 pt-2">
            <Checkbox
              id="apply-to-all"
              checked={applyToAll}
              onCheckedChange={(checked) => setApplyToAll(checked === true)}
            />
            <label
              htmlFor="apply-to-all"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Apply these settings to all selected ads
            </label>
          </div>
        )}

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Ad Settings"
          )}
        </Button>
      </form>
    </Form>
  );
}
