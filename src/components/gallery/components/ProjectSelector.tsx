
import { useState, useEffect, useRef } from "react";
import { Check, ChevronsUpDown, AlertCircle, Folder, Search, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useProjectTitle } from "@/hooks/useProjectTitle";

interface Project {
  id: string;
  title: string;
}

interface ProjectSelectorProps {
  onSelect: (projectId: string) => void;
  selectedProjectId?: string;
  required?: boolean;
  errorMessage?: string;
}

export function ProjectSelector({ 
  onSelect, 
  selectedProjectId, 
  required = false,
  errorMessage
}: ProjectSelectorProps) {
  const [open, setOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { title: selectedProjectTitle } = useProjectTitle(selectedProjectId || null);
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Fetch projects when component mounts
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const { data: userData } = await supabase.auth.getUser();
        if (!userData?.user) {
          console.error("No user found when fetching projects");
          setProjects([]);
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('projects')
          .select('id, title')
          .eq('user_id', userData.user.id)
          .order('updated_at', { ascending: false });

        if (error) {
          throw error;
        }
        
        const projectsArray = Array.isArray(data) ? data : [];
        setProjects(projectsArray);
      } catch (error) {
        console.error('Error fetching projects:', error);
        setError('Failed to load projects');
        toast({
          title: "Error",
          description: "Failed to load projects. Please try again.",
          variant: "destructive",
        });
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [toast]);

  // Focus the search input when popover opens
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [open]);

  // Handle selection
  const handleSelectProject = (currentValue: string) => {
    // Find the selected project
    const project = projects.find(p => p.id === currentValue);
    if (project) {
      onSelect(currentValue);
      
      // Show success toast
      toast({
        title: "Project Selected",
        description: `"${project.title}" has been selected`,
        variant: "default",
      });
    }
    
    // Close the popover
    setOpen(false);
  };

  // Determine if there's an error condition
  const hasError = required && !selectedProjectId && errorMessage;

  // Determine what text to show on the button
  const getButtonText = () => {
    if (selectedProjectId && selectedProjectTitle) {
      return selectedProjectTitle;
    }
    
    if (loading) {
      return "Loading projects...";
    }
    
    return required 
      ? "Select a project (required)" 
      : "Select project...";
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={triggerRef}
            variant={hasError ? "destructive" : "outline"}
            role="combobox"
            aria-expanded={open}
            aria-label="Select project"
            className={cn(
              "w-full justify-between relative transition-all",
              hasError ? "border-red-500 text-red-600" : 
              selectedProjectId ? "border-green-500 bg-green-50/50 text-green-800" : 
              "hover:bg-slate-100"
            )}
            disabled={loading}
          >
            <div className="flex items-center overflow-hidden mr-2">
              <Folder className={cn(
                "mr-2 h-4 w-4 shrink-0", 
                selectedProjectId ? "text-green-600" : "text-slate-500"
              )} />
              <span className="truncate">{getButtonText()}</span>
            </div>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin opacity-70" />
            ) : (
              <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-[300px] p-0 bg-white border border-slate-200 shadow-lg rounded-md"
          align="start"
          sideOffset={5}
        >
          <Command className="rounded-md border-0">
            <div className="flex items-center px-3 border-b">
              <Search className="h-4 w-4 shrink-0 text-slate-500 mr-2" />
              <CommandInput 
                ref={inputRef}
                placeholder="Search projects..." 
                className="h-9 border-0 focus:ring-0"
              />
            </div>
            <CommandList className="max-h-[300px] overflow-auto py-2">
              <CommandEmpty className="py-3 text-center text-sm text-slate-500">
                No projects found.
              </CommandEmpty>
              {loading ? (
                <div className="py-6 text-center">
                  <Loader2 className="h-6 w-6 animate-spin text-slate-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">Loading projects...</p>
                </div>
              ) : (
                <CommandGroup>
                  {projects.length === 0 ? (
                    <div className="py-6 text-center px-4">
                      <p className="text-sm text-slate-500 mb-2">No projects available</p>
                      <p className="text-xs text-slate-400">Create a project first</p>
                    </div>
                  ) : (
                    projects.map((project) => (
                      <CommandItem
                        key={project.id}
                        value={project.id}
                        className="flex items-center py-2 px-2 cursor-pointer data-[selected=true]:bg-slate-100 rounded-sm mx-1"
                        onSelect={handleSelectProject}
                        onMouseDown={(e) => {
                          e.preventDefault();
                        }}
                      >
                        <div className="flex items-center flex-1 gap-2">
                          <Folder className={cn(
                            "h-4 w-4", 
                            selectedProjectId === project.id ? "text-green-600" : "text-slate-400"
                          )} />
                          <span className="truncate">{project.title}</span>
                        </div>
                        <Check
                          className={cn(
                            "ml-auto h-4 w-4 text-green-600",
                            selectedProjectId === project.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                      </CommandItem>
                    ))
                  )}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      
      {hasError && (
        <Alert variant="destructive" className="py-2 px-3">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            {errorMessage}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
