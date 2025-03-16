
import { useState } from "react";
import { EnhancedPersona } from "@/types/adWizard";
import EnhancedPersonaCard from "./EnhancedPersonaCard";
import { Button } from "@/components/ui/button";
import { RefreshCw, Filter } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuGroup, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

interface EnhancedPersonaGridProps {
  personas: EnhancedPersona[];
  onSelectPersona: (persona: EnhancedPersona) => void;
  selectedPersonaId?: string;
  onRegenerateRequest?: () => void;
  isLoading?: boolean;
}

export default function EnhancedPersonaGrid({
  personas,
  onSelectPersona,
  selectedPersonaId,
  onRegenerateRequest,
  isLoading = false,
}: EnhancedPersonaGridProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  
  const handleFilter = (type: string) => {
    setFilterType(type);
  };

  const filteredPersonas = personas.filter(persona => {
    const matchesSearch = 
      persona.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      persona.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      persona.demographics.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Apply filter based on filter type
    if (filterType === "all") return matchesSearch;
    
    if (filterType === "demographics") {
      return matchesSearch && (
        // Example demographic filtering logic - customize as needed
        persona.demographics.toLowerCase().includes("millennial") ||
        persona.demographics.toLowerCase().includes("gen z") ||
        persona.demographics.toLowerCase().includes("high income")
      );
    }
    
    if (filterType === "behavior") {
      return matchesSearch && (
        // Example behavior filtering - customize as needed
        persona.behavioralTraits.some(trait => 
          trait.toLowerCase().includes("online") || 
          trait.toLowerCase().includes("research")
        )
      );
    }
    
    return matchesSearch;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-64">
          <Input
            placeholder="Search personas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
          />
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1">
                <Filter className="h-4 w-4" /> Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => handleFilter("all")}>
                  All Personas
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleFilter("demographics")}>
                  By Demographics
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleFilter("behavior")}>
                  By Behavior
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {onRegenerateRequest && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRegenerateRequest}
              disabled={isLoading}
              className="gap-1"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              Regenerate
            </Button>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPersonas.map((persona) => (
          <EnhancedPersonaCard
            key={persona.id}
            persona={persona}
            onSelect={() => onSelectPersona(persona)}
            isSelected={selectedPersonaId === persona.id}
          />
        ))}
      </div>
      
      {filteredPersonas.length === 0 && (
        <div className="text-center py-8 border rounded-md bg-background">
          <p className="text-muted-foreground">
            {personas.length === 0 
              ? "No personas generated yet." 
              : "No personas match your search criteria."}
          </p>
        </div>
      )}
    </div>
  );
}
