
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { useProjectTitle } from "@/hooks/useProjectTitle";

interface CampaignModeSelectionProps {
  onModeSelect: (mode: "manual" | "semi-automatic" | "automatic") => void;
  selectedMode: "manual" | "semi-automatic" | "automatic";
  projectId?: string;
}

export default function CampaignModeSelection({ 
  onModeSelect, 
  selectedMode,
  projectId 
}: CampaignModeSelectionProps) {
  const { title: projectTitle } = useProjectTitle(projectId);
  
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Campaign Creation Mode</h3>
        <p className="text-muted-foreground">
          Select how you want to create your ad campaign
        </p>
      </div>
      
      {projectId && projectTitle && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <p className="font-medium">Creating campaign for project: <span className="text-blue-700">{projectTitle}</span></p>
        </div>
      )}
      
      <RadioGroup 
        defaultValue={selectedMode} 
        value={selectedMode}
        onValueChange={(value) => onModeSelect(value as "manual" | "semi-automatic" | "automatic")}
        className="grid gap-4"
      >
        <Card className={`cursor-pointer border-2 ${selectedMode === "manual" ? "border-primary" : "border-transparent"}`}>
          <CardHeader className="pb-2">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="manual" id="manual" className="mt-0" />
              <Label htmlFor="manual" className="font-medium text-base cursor-pointer">
                Manual Mode
              </Label>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Create your campaign from scratch with full control over all settings and creative elements.
            </CardDescription>
          </CardContent>
        </Card>
        
        <Card 
          className={`cursor-pointer border-2 ${selectedMode === "semi-automatic" ? "border-primary" : "border-transparent"} ${!projectId ? "opacity-50" : ""}`}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center space-x-2">
              <RadioGroupItem 
                value="semi-automatic" 
                id="semi-automatic" 
                className="mt-0" 
                disabled={!projectId}
              />
              <Label htmlFor="semi-automatic" className="font-medium text-base cursor-pointer">
                Semi-Automatic Mode
              </Label>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Start with pre-filled fields based on your project data, then customize as needed.
              {!projectId && (
                <div className="mt-2 text-amber-600">
                  Requires a selected project to use data from.
                </div>
              )}
            </CardDescription>
          </CardContent>
        </Card>
        
        <Card 
          className={`cursor-pointer border-2 ${selectedMode === "automatic" ? "border-primary" : "border-transparent"} ${!projectId ? "opacity-50" : ""}`}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center space-x-2">
              <RadioGroupItem 
                value="automatic" 
                id="automatic" 
                className="mt-0" 
                disabled={!projectId}
              />
              <Label htmlFor="automatic" className="font-medium text-base cursor-pointer">
                AI-Driven Mode
              </Label>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Let our AI create your entire campaign based on your project data.
              {!projectId && (
                <div className="mt-2 text-amber-600">
                  Requires a selected project for AI to analyze.
                </div>
              )}
            </CardDescription>
          </CardContent>
        </Card>
      </RadioGroup>
    </div>
  );
}
