
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAdWizardState } from "@/hooks/useAdWizardState";
import { useToast } from "@/hooks/use-toast";
import { EnhancedPersona } from "@/types/adWizard";
import { Progress } from "@/components/ui/progress";
import { RefreshCw, ArrowRight, ChevronLeft } from "lucide-react";
import { useEnhancedPersonaGeneration } from "./audience/useEnhancedPersonaGeneration";
import EnhancedPersonaGrid from "./audience/EnhancedPersonaGrid";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import useAudienceGeneration from "./audience/useAudienceGeneration";
import AudienceCard from "./audience/AudienceCard";

export default function EnhancedAudienceStep() {
  const { state, update, step, saveProject, goToStep } = useAdWizardState();
  const { toast } = useToast();
  const [selectedPersona, setSelectedPersona] = useState<EnhancedPersona | null>(null);
  const [regenerationCount, setRegenerationCount] = useState(0);
  const [viewMode, setViewMode] = useState<"enhanced" | "regular">("enhanced");
  const [selectedRegularAudience, setSelectedRegularAudience] = useState<number | null>(null);

  // Use both generation hooks
  const { 
    loading: enhancedLoading, 
    personas, 
    generateEnhancedPersonas,
    regenerate: regenerateEnhanced,
    error: enhancedError 
  } = useEnhancedPersonaGeneration();

  const {
    loading: regularLoading, 
    audiences, 
    generateAudiences,
    regenerate: regenerateRegular,
    error: regularError 
  } = useAudienceGeneration();

  const isLoading = enhancedLoading || regularLoading;

  useEffect(() => {
    // Set selected persona if it exists in the state
    if (state.enhanced_persona) {
      setSelectedPersona(state.enhanced_persona as EnhancedPersona);
    }
    
    // Set selected regular audience if it exists
    if (state.target_audience) {
      const index = audiences.findIndex(
        (a) => a.name === (state.target_audience as any)?.name
      );
      if (index >= 0) {
        setSelectedRegularAudience(index);
      }
    }
    
    // Begin generation if we have a business idea but no personas yet
    if (state.business_idea && !state.enhanced_persona && personas.length === 0 && !enhancedLoading) {
      generateEnhancedPersonas(state.business_idea);
    }
    
    // Also generate regular audiences as fallback
    if (state.business_idea && !state.target_audience && audiences.length === 0 && !regularLoading) {
      generateAudiences(state.business_idea);
    }
  }, [state.business_idea, state.enhanced_persona, state.target_audience]);

  const handleRegenerateEnhanced = async () => {
    if (!state.business_idea) {
      toast({
        title: "Business idea missing",
        description: "Please go back and define your business idea first.",
        variant: "destructive",
      });
      return;
    }

    setRegenerationCount((prev) => prev + 1);
    await regenerateEnhanced(state.business_idea, regenerationCount + 1);
  };

  const handleRegenerateRegular = async () => {
    if (!state.business_idea) {
      toast({
        title: "Business idea missing",
        description: "Please go back and define your business idea first.",
        variant: "destructive",
      });
      return;
    }

    await regenerateRegular(state.business_idea, regenerationCount + 1);
  };

  const handleSelectEnhancedPersona = (persona: EnhancedPersona) => {
    setSelectedPersona(persona);
  };

  const handleSelectRegularAudience = (index: number) => {
    setSelectedRegularAudience(index);
  };

  const handleContinue = async () => {
    if (viewMode === "enhanced" && selectedPersona) {
      await update({
        enhanced_persona: selectedPersona,
        current_step: step + 1,
      });
    } else if (viewMode === "regular" && selectedRegularAudience !== null) {
      await update({
        target_audience: audiences[selectedRegularAudience],
        current_step: step + 1,
      });
    } else {
      toast({
        title: "Selection required",
        description: "Please select a target audience to continue.",
        variant: "destructive",
      });
      return;
    }

    await saveProject();
    goToStep(step + 1);
  };

  const handleGoBack = () => {
    goToStep(step - 1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Select Your Target Audience</h2>
      </div>

      <Card>
        <CardContent className="p-6">
          <Tabs
            defaultValue="enhanced"
            value={viewMode}
            onValueChange={(v) => setViewMode(v as "enhanced" | "regular")}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="enhanced">Enhanced Personas (9)</TabsTrigger>
              <TabsTrigger value="regular">Standard Personas (3)</TabsTrigger>
            </TabsList>

            <TabsContent value="enhanced" className="space-y-4">
              {enhancedLoading && (
                <div className="space-y-4 py-8">
                  <Progress value={45} className="w-full" />
                  <p className="text-center text-muted-foreground">
                    Generating enhanced audience personas...
                  </p>
                </div>
              )}

              {!enhancedLoading && personas.length > 0 && (
                <EnhancedPersonaGrid
                  personas={personas}
                  onSelectPersona={handleSelectEnhancedPersona}
                  selectedPersonaId={selectedPersona?.id}
                  onRegenerateRequest={handleRegenerateEnhanced}
                  isLoading={enhancedLoading}
                />
              )}

              {!enhancedLoading && personas.length === 0 && enhancedError && (
                <div className="text-center py-8">
                  <p className="text-red-500 mb-4">{enhancedError.message}</p>
                  <Button onClick={() => generateEnhancedPersonas(state.business_idea)}>
                    Try Again
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="regular" className="space-y-4">
              {regularLoading && (
                <div className="space-y-4 py-8">
                  <Progress value={45} className="w-full" />
                  <p className="text-center text-muted-foreground">
                    Generating standard audience personas...
                  </p>
                </div>
              )}

              {!regularLoading && audiences.length > 0 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {audiences.map((audience, index) => (
                      <AudienceCard
                        key={index}
                        audience={audience}
                        onSelect={() => handleSelectRegularAudience(index)}
                        isSelected={selectedRegularAudience === index}
                      />
                    ))}
                  </div>
                  <div className="flex justify-end mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRegenerateRegular}
                      disabled={regularLoading}
                    >
                      <RefreshCw
                        className={`mr-2 h-4 w-4 ${regularLoading ? "animate-spin" : ""}`}
                      />
                      Regenerate
                    </Button>
                  </div>
                </div>
              )}

              {!regularLoading && audiences.length === 0 && regularError && (
                <div className="text-center py-8">
                  <p className="text-red-500 mb-4">{regularError.message}</p>
                  <Button onClick={() => generateAudiences(state.business_idea)}>
                    Try Again
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={handleGoBack}>
          <ChevronLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Button onClick={handleContinue} disabled={isLoading}>
          Continue <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
