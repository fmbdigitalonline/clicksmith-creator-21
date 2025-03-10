
import { useState, useEffect } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Facebook } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import FacebookAdSettingsForm from "@/components/integrations/FacebookAdSettings";
import { FacebookAdSettings } from "@/types/campaignTypes";

interface FacebookAdSettingsPanelProps {
  selectedAdIds: string[];
  projectId?: string;
  projectUrl?: string;
  onSettingsSaved?: (settings: FacebookAdSettings) => void;
}

export default function FacebookAdSettingsPanel({
  selectedAdIds,
  projectId,
  projectUrl,
  onSettingsSaved
}: FacebookAdSettingsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasInitialOpened, setHasInitialOpened] = useState(false);

  // Auto-open settings panel when ads are first selected
  useEffect(() => {
    if (selectedAdIds.length > 0 && !hasInitialOpened) {
      setIsOpen(true);
      setHasInitialOpened(true);
    }
  }, [selectedAdIds, hasInitialOpened]);

  // Close panel if no ads are selected
  useEffect(() => {
    if (selectedAdIds.length === 0) {
      setIsOpen(false);
      setHasInitialOpened(false);
    }
  }, [selectedAdIds]);

  if (selectedAdIds.length === 0) {
    return null;
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="border rounded-lg bg-white mb-6">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center">
          <Facebook className="h-5 w-5 mr-2 text-facebook" />
          <h3 className="font-medium">Facebook Ad Settings</h3>
          {!isOpen && !hasInitialOpened && (
            <Alert variant="warning" className="ml-4 py-1 px-2 h-8">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle className="text-xs">Required settings needed</AlertTitle>
            </Alert>
          )}
        </div>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm">
            {isOpen ? 
              <ChevronUp className="h-4 w-4" /> : 
              <ChevronDown className="h-4 w-4" />
            }
          </Button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className="p-4">
        {selectedAdIds.length > 0 ? (
          <FacebookAdSettingsForm 
            adIds={selectedAdIds}
            projectUrl={projectUrl}
            onSettingsSaved={onSettingsSaved}
          />
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            <p>Select ads to configure Facebook ad settings</p>
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
