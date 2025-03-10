
import { useState, useEffect } from "react";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { FacebookAdSettings } from "@/types/campaignTypes";

interface FacebookAdSettingsFormProps {
  adIds: string[];
  projectUrl?: string;
  onSettingsSaved?: (settings: FacebookAdSettings) => void;
}

export default function FacebookAdSettingsForm({
  adIds,
  projectUrl,
  onSettingsSaved
}: FacebookAdSettingsFormProps) {
  const form = useForm<FacebookAdSettings>({
    defaultValues: {
      website_url: projectUrl || "",
      visible_link: projectUrl || "",
      call_to_action: "Learn More",
      ad_language: "English (US)",
      url_parameters: "utm_source=facebook&utm_medium=paid",
      browser_addon: "None"
    }
  });

  const onSubmit = async (data: FacebookAdSettings) => {
    if (onSettingsSaved) {
      onSettingsSaved(data);
    }
  };

  useEffect(() => {
    if (projectUrl) {
      form.setValue("website_url", projectUrl);
      form.setValue("visible_link", projectUrl);
    }
  }, [projectUrl, form]);

  const callToActionOptions = [
    "Learn More",
    "Shop Now",
    "Sign Up",
    "Contact Us",
    "Book Now",
    "Download"
  ];

  const languageOptions = [
    "English (US)",
    "English (UK)",
    "Spanish",
    "French",
    "German"
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="website_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Website URL</FormLabel>
              <FormControl>
                <Input {...field} placeholder="https://example.com" required />
              </FormControl>
              <FormDescription>Landing page URL for your ad</FormDescription>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="visible_link"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Visible Link Display</FormLabel>
              <FormControl>
                <Input {...field} placeholder="https://example.com" />
              </FormControl>
              <FormDescription>Shown URL in ad (can be different from actual URL)</FormDescription>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="call_to_action"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Call to Action Button</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a call to action" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {callToActionOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />

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
                  {languageOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="url_parameters"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL Parameters</FormLabel>
              <FormControl>
                <Input {...field} placeholder="utm_source=facebook&utm_medium=paid" />
              </FormControl>
              <FormDescription>Tracking parameters to add to your URL</FormDescription>
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button type="submit">Save Settings</Button>
        </div>
      </form>
    </Form>
  );
}
