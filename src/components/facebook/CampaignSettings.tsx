
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { TargetAudience } from "@/types/adWizard";

interface CampaignSettingsProps {
  settings: {
    dailyBudget: number;
    startDate: Date;
    endDate: Date;
    objective: string;
    ageMin: number;
    ageMax: number;
    genders: string[];
    locations: string[];
    interests: string[];
  };
  onSettingsChange: (settings: any) => void;
  targetAudience?: TargetAudience;
}

export const CampaignSettings = ({ 
  settings, 
  onSettingsChange,
  targetAudience
}: CampaignSettingsProps) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  
  // Derived from target audience if available
  const suggestedInterests = targetAudience ? extractInterestsFromAudience(targetAudience) : [];

  const handleSettingChange = (key: string, value: any) => {
    onSettingsChange({
      ...settings,
      [key]: value
    });
  };

  const toggleGender = (gender: string) => {
    const currentGenders = [...settings.genders];
    if (currentGenders.includes(gender)) {
      handleSettingChange('genders', currentGenders.filter(g => g !== gender));
    } else {
      handleSettingChange('genders', [...currentGenders, gender]);
    }
  };

  const addInterest = (interest: string) => {
    if (!interest.trim() || settings.interests.includes(interest)) return;
    handleSettingChange('interests', [...settings.interests, interest]);
    setSuggestions([]);
  };

  const removeInterest = (interest: string) => {
    handleSettingChange('interests', settings.interests.filter(i => i !== interest));
  };

  const addSuggestedInterest = (interest: string) => {
    if (settings.interests.includes(interest)) return;
    handleSettingChange('interests', [...settings.interests, interest]);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Budget & Schedule</h3>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label htmlFor="daily-budget">Daily Budget: ${settings.dailyBudget}</Label>
          </div>
          <Slider
            id="daily-budget"
            min={5}
            max={100}
            step={5}
            value={[settings.dailyBudget]}
            onValueChange={(value) => handleSettingChange('dailyBudget', value[0])}
          />
          <p className="text-xs text-muted-foreground">
            Minimum: $5 / Maximum: $100 per day
          </p>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Start Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !settings.startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {settings.startDate ? format(settings.startDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={settings.startDate}
                  onSelect={(date) => date && handleSettingChange('startDate', date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="space-y-2">
            <Label>End Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !settings.endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {settings.endDate ? format(settings.endDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={settings.endDate}
                  onSelect={(date) => date && handleSettingChange('endDate', date)}
                  initialFocus
                  disabled={(date) => date < settings.startDate}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>
      
      <Separator />
      
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Audience Targeting</h3>
        
        <div className="space-y-2">
          <Label>Age Range: {settings.ageMin} - {settings.ageMax}</Label>
          <div className="pt-4">
            <Slider
              min={13}
              max={65}
              step={1}
              value={[settings.ageMin, settings.ageMax]}
              onValueChange={(value) => {
                handleSettingChange('ageMin', value[0]);
                handleSettingChange('ageMax', value[1]);
              }}
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label>Gender</Label>
          <div className="flex gap-4 pt-2">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="male" 
                checked={settings.genders.includes('male')} 
                onCheckedChange={() => toggleGender('male')}
              />
              <label htmlFor="male" className="text-sm">Male</label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="female" 
                checked={settings.genders.includes('female')} 
                onCheckedChange={() => toggleGender('female')}
              />
              <label htmlFor="female" className="text-sm">Female</label>
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label>Interests</Label>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Add interests (e.g. fitness, travel)"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  addInterest(e.currentTarget.value);
                  e.currentTarget.value = '';
                }
              }}
            />
            <Button 
              variant="outline" 
              onClick={(e) => {
                const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                addInterest(input.value);
                input.value = '';
              }}
            >
              Add
            </Button>
          </div>
          
          {/* Display target audience suggested interests */}
          {suggestedInterests.length > 0 && (
            <div className="pt-2">
              <p className="text-sm font-medium mb-2">Suggested interests from your target audience:</p>
              <div className="flex flex-wrap gap-2">
                {suggestedInterests.map((interest) => (
                  <Button
                    key={interest}
                    variant="outline"
                    size="sm"
                    className={`text-xs ${settings.interests.includes(interest) ? 'bg-primary/10' : ''}`}
                    onClick={() => addSuggestedInterest(interest)}
                  >
                    {interest}
                  </Button>
                ))}
              </div>
            </div>
          )}
          
          {/* Display selected interests */}
          {settings.interests.length > 0 && (
            <div className="pt-2">
              <p className="text-sm font-medium mb-2">Selected interests:</p>
              <div className="flex flex-wrap gap-2">
                {settings.interests.map((interest) => (
                  <div key={interest} className="flex items-center bg-primary/10 rounded-md px-2 py-1">
                    <span className="text-xs">{interest}</span>
                    <button
                      className="ml-1 text-gray-500 hover:text-gray-700"
                      onClick={() => removeInterest(interest)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper function to extract interests from target audience
function extractInterestsFromAudience(audience: TargetAudience): string[] {
  const interests: string[] = [];
  
  // Extract from demographics
  if (audience.demographics) {
    const matches = audience.demographics.match(/\b(?:interested in|enjoys|likes|loves|prefers)\b[^.]*\b(\w+(?:, \w+)*)\b/gi);
    if (matches) {
      matches.forEach(match => {
        const words = match.split(/\s+/);
        const interestWords = words.slice(words.findIndex(w => 
          ['interested', 'enjoys', 'likes', 'loves', 'prefers'].includes(w.toLowerCase())
        ) + 1);
        
        const interestPhrase = interestWords.join(' ')
          .replace(/^(in|on|for|about)\s+/, '')
          .replace(/[,.;:].*$/, '');
          
        if (interestPhrase && interestPhrase.length > 2) {
          interests.push(interestPhrase);
        }
      });
    }
  }
  
  // Extract from pain points
  if (audience.painPoints && audience.painPoints.length > 0) {
    audience.painPoints.forEach(point => {
      const keywords = point
        .replace(/^(Lacks|Wants|Needs|Seeking|Looking for|Interested in|Concerned about)\s+/, '')
        .split(/\s+/)
        .filter(word => word.length > 3 && !['their', 'they', 'them', 'have', 'want', 'need'].includes(word.toLowerCase()));
      
      if (keywords.length > 0) {
        interests.push(keywords[0]);
      }
    });
  }
  
  // Make interests unique and return
  return [...new Set(interests)].slice(0, 8);
}
