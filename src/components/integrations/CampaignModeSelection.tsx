
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { useProjectTitle } from "@/hooks/useProjectTitle";
import { RocketIcon, Settings, Sparkles, Lightbulb } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
              <Label htmlFor="manual" className="font-medium text-base cursor-pointer flex items-center">
                <Settings className="h-4 w-4 mr-2" />
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
              <Label htmlFor="semi-automatic" className="font-medium text-base cursor-pointer flex items-center">
                <Sparkles className="h-4 w-4 mr-2" />
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
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <RadioGroupItem 
                  value="automatic" 
                  id="automatic" 
                  className="mt-0" 
                  disabled={!projectId}
                />
                <Label htmlFor="automatic" className="font-medium text-base cursor-pointer flex items-center">
                  <RocketIcon className="h-4 w-4 mr-2" />
                  AI-Driven Mode
                </Label>
              </div>
              <Badge className="bg-purple-600 hover:bg-purple-700">New</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Let our AI create your entire campaign based on your project data with smart decision algorithms.
              {!projectId && (
                <div className="mt-2 text-amber-600">
                  Requires a selected project for AI to analyze.
                </div>
              )}
              <div className="mt-2 flex items-start p-2 bg-purple-50 rounded border border-purple-100">
                <Lightbulb className="h-4 w-4 text-purple-600 mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-xs text-purple-800">
                  Our AI analyzes your business data and automatically applies industry best practices to create an optimized campaign.
                </span>
              </div>
            </CardDescription>
          </CardContent>
        </Card>
      </RadioGroup>
    </div>
  );
}
