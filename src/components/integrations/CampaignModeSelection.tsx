
import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Settings, Wand2, PenLine } from "lucide-react";

interface CampaignModeSelectionProps {
  onModeSelect: (mode: "manual" | "semi-automatic" | "automatic") => void;
  selectedMode: "manual" | "semi-automatic" | "automatic";
}

export default function CampaignModeSelection({ onModeSelect, selectedMode }: CampaignModeSelectionProps) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold">How would you like to create your campaign?</h2>
        <p className="text-muted-foreground mt-2">
          Choose how much control you want over your campaign creation process
        </p>
      </div>

      <RadioGroup value={selectedMode} onValueChange={(value) => onModeSelect(value as "manual" | "semi-automatic" | "automatic")}>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <RadioGroupItem id="manual" value="manual" className="sr-only peer" />
            <Label
              htmlFor="manual"
              className="flex flex-col items-center justify-between rounded-md border-2 border-muted p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
            >
              <PenLine className="mb-3 h-6 w-6" />
              <CardTitle className="text-xl">Manual</CardTitle>
              <CardDescription className="text-center mt-2">
                Create your campaign with full control over all settings and creative elements
              </CardDescription>
            </Label>
          </div>

          <div>
            <RadioGroupItem id="semi-automatic" value="semi-automatic" className="sr-only peer" />
            <Label
              htmlFor="semi-automatic"
              className="flex flex-col items-center justify-between rounded-md border-2 border-muted p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
            >
              <Settings className="mb-3 h-6 w-6" />
              <CardTitle className="text-xl">Semi-Automatic</CardTitle>
              <CardDescription className="text-center mt-2">
                Start with your project data and customize to your needs
              </CardDescription>
            </Label>
          </div>

          <div>
            <RadioGroupItem id="automatic" value="automatic" className="sr-only peer" />
            <Label
              htmlFor="automatic"
              className="flex flex-col items-center justify-between rounded-md border-2 border-muted p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
            >
              <Wand2 className="mb-3 h-6 w-6" />
              <CardTitle className="text-xl">Automatic</CardTitle>
              <CardDescription className="text-center mt-2">
                Let AI create your campaign based on your project and business goals
              </CardDescription>
            </Label>
          </div>
        </div>
      </RadioGroup>

      <div className="mt-6">
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            {selectedMode === "manual" && (
              <>
                <h3 className="font-medium mb-2">Manual Campaign Creation</h3>
                <p className="text-sm text-muted-foreground">
                  You'll have full control over all campaign settings including target audience,
                  budget, creative elements, and more. Best for experienced advertisers who want
                  precise control.
                </p>
              </>
            )}
            {selectedMode === "semi-automatic" && (
              <>
                <h3 className="font-medium mb-2">Semi-Automatic Campaign Creation</h3>
                <p className="text-sm text-muted-foreground">
                  We'll pre-fill your form with data from your project including audience
                  targeting, images, and ad copy. You can review and adjust before publishing.
                </p>
              </>
            )}
            {selectedMode === "automatic" && (
              <>
                <h3 className="font-medium mb-2">AI-Driven Campaign Creation</h3>
                <p className="text-sm text-muted-foreground">
                  Our AI will analyze your project and business goals to create an optimized
                  campaign. You'll be able to review before publishing, but most of the work
                  is done for you.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
