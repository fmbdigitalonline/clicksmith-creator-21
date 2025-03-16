
import { EnhancedPersona } from "@/types/adWizard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, User, Lightbulb, AlertCircle, Target, Radio, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface EnhancedPersonaCardProps {
  persona: EnhancedPersona;
  onSelect: () => void;
  isSelected?: boolean;
}

export default function EnhancedPersonaCard({ 
  persona, 
  onSelect, 
  isSelected = false 
}: EnhancedPersonaCardProps) {
  return (
    <Card className={`h-full flex flex-col overflow-hidden transition-all hover:shadow-md ${
      isSelected ? "border-primary shadow-sm" : ""
    }`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{persona.name}</CardTitle>
            <CardDescription className="line-clamp-2 mt-1">
              {persona.description}
            </CardDescription>
          </div>
          {isSelected && (
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary ml-2">
              <Check className="h-3 w-3 mr-1" /> Selected
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pb-4 pt-0 flex-grow">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid grid-cols-3 mb-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="traits">Traits</TabsTrigger>
            <TabsTrigger value="behaviors">Behaviors</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-3">
            <div>
              <h4 className="text-sm font-medium flex items-center mb-1">
                <User className="h-4 w-4 mr-1 text-muted-foreground" /> Demographics
              </h4>
              <p className="text-xs text-muted-foreground">{persona.demographics}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium flex items-center mb-1">
                <Lightbulb className="h-4 w-4 mr-1 text-muted-foreground" /> Psychographics
              </h4>
              <p className="text-xs text-muted-foreground">{persona.psychographics}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium flex items-center mb-1">
                <AlertCircle className="h-4 w-4 mr-1 text-muted-foreground" /> Challenges
              </h4>
              <div className="flex flex-wrap gap-1">
                {persona.challenges.map((challenge, index) => (
                  <Badge key={index} variant="secondary" className="text-[10px]">
                    {challenge}
                  </Badge>
                ))}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="traits" className="space-y-3">
            <div>
              <h4 className="text-sm font-medium mb-1">Core Values</h4>
              <div className="flex flex-wrap gap-1">
                {persona.values.map((value, index) => (
                  <Badge key={index} variant="outline" className="text-[10px]">
                    {value}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <h4 className="text-sm font-medium mb-1">Strengths</h4>
                <ul className="text-xs text-muted-foreground list-disc list-inside">
                  {persona.strengths.map((strength, index) => (
                    <li key={index}>{strength}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-1">Weaknesses</h4>
                <ul className="text-xs text-muted-foreground list-disc list-inside">
                  {persona.weaknesses.map((weakness, index) => (
                    <li key={index}>{weakness}</li>
                  ))}
                </ul>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="behaviors" className="space-y-3">
            <div>
              <h4 className="text-sm font-medium flex items-center mb-1">
                <Target className="h-4 w-4 mr-1 text-muted-foreground" /> Goals
              </h4>
              <ul className="text-xs text-muted-foreground list-disc list-inside">
                {persona.goals.map((goal, index) => (
                  <li key={index}>{goal}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium flex items-center mb-1">
                <Radio className="h-4 w-4 mr-1 text-muted-foreground" /> Media Preferences
              </h4>
              <div className="flex flex-wrap gap-1">
                {persona.mediaPreferences.map((media, index) => (
                  <Badge key={index} variant="secondary" className="text-[10px]">
                    {media}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium flex items-center mb-1">
                <ShoppingBag className="h-4 w-4 mr-1 text-muted-foreground" /> Purchase Drivers
              </h4>
              <div className="flex flex-wrap gap-1">
                {persona.purchaseDrivers.map((driver, index) => (
                  <Badge key={index} variant="secondary" className="text-[10px]">
                    {driver}
                  </Badge>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <div className="p-4 pt-0 mt-auto">
        <Button 
          onClick={onSelect} 
          variant={isSelected ? "secondary" : "default"}
          className="w-full"
        >
          {isSelected ? "Selected" : "Select"}
        </Button>
      </div>
    </Card>
  );
}
