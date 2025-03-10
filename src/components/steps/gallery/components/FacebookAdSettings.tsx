
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { InfoIcon } from "lucide-react";

interface FacebookAdSettingsProps {
  onChange: (settings: FacebookAdSettings) => void;
  initialSettings?: FacebookAdSettings;
}

export interface FacebookAdSettings {
  websiteUrl: string;
  visibleLink?: string;
  language?: string;
  browserAddOns?: {
    blockBrowserExtensions: boolean;
    blockPlugins: boolean;
  };
  urlParameters?: string;
}

export function FacebookAdSettings({ onChange, initialSettings }: FacebookAdSettingsProps) {
  const [settings, setSettings] = useState<FacebookAdSettings>(initialSettings || {
    websiteUrl: "https://",
    visibleLink: "",
    language: "en_US",
    browserAddOns: {
      blockBrowserExtensions: false,
      blockPlugins: false
    },
    urlParameters: ""
  });

  const updateSettings = (updatedValues: Partial<FacebookAdSettings>) => {
    const newSettings = { ...settings, ...updatedValues };
    setSettings(newSettings);
    onChange(newSettings);
  };

  const updateBrowserAddOns = (key: keyof FacebookAdSettings["browserAddOns"], value: boolean) => {
    const browserAddOns = { ...settings.browserAddOns, [key]: value };
    updateSettings({ browserAddOns });
  };

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="facebook-settings">
        <AccordionTrigger className="text-sm font-medium">
          Facebook Ad URLs & Settings
        </AccordionTrigger>
        <AccordionContent className="space-y-4 pt-2">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="websiteUrl">Website URL</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <InfoIcon className="h-4 w-4 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">The URL where people will be directed when they click on your ad</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input 
              id="websiteUrl" 
              placeholder="https://example.com" 
              value={settings.websiteUrl}
              onChange={(e) => updateSettings({ websiteUrl: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="visibleLink">Visible Link (Display URL)</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <InfoIcon className="h-4 w-4 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">The URL that appears in your ad, which can be different from the actual destination</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input 
              id="visibleLink" 
              placeholder="example.com" 
              value={settings.visibleLink}
              onChange={(e) => updateSettings({ visibleLink: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="language">Ad Language</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <InfoIcon className="h-4 w-4 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">The primary language used in your ad</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Select 
              value={settings.language}
              onValueChange={(value) => updateSettings({ language: value })}
            >
              <SelectTrigger id="language">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en_US">English (US)</SelectItem>
                <SelectItem value="es_LA">Spanish</SelectItem>
                <SelectItem value="fr_FR">French</SelectItem>
                <SelectItem value="de_DE">German</SelectItem>
                <SelectItem value="it_IT">Italian</SelectItem>
                <SelectItem value="pt_BR">Portuguese</SelectItem>
                <SelectItem value="ja_JP">Japanese</SelectItem>
                <SelectItem value="zh_CN">Chinese (Simplified)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="browserAddOns">Browser Add-ons Options</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <InfoIcon className="h-4 w-4 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Control how your ad behaves with browser extensions and plugins</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="space-y-2 ml-1">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="blockBrowserExtensions" 
                  checked={settings.browserAddOns?.blockBrowserExtensions || false}
                  onCheckedChange={(checked) => 
                    updateBrowserAddOns('blockBrowserExtensions', checked === true)
                  }
                />
                <label
                  htmlFor="blockBrowserExtensions"
                  className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Block browser extensions
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="blockPlugins" 
                  checked={settings.browserAddOns?.blockPlugins || false}
                  onCheckedChange={(checked) => 
                    updateBrowserAddOns('blockPlugins', checked === true)
                  }
                />
                <label
                  htmlFor="blockPlugins"
                  className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Block plugins
                </label>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="urlParameters">URL Parameters</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <InfoIcon className="h-4 w-4 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Additional URL parameters for tracking (e.g. utm_source=facebook&utm_medium=cpc)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input 
              id="urlParameters" 
              placeholder="utm_source=facebook&utm_medium=cpc" 
              value={settings.urlParameters}
              onChange={(e) => updateSettings({ urlParameters: e.target.value })}
            />
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
