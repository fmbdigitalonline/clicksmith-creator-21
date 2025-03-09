
import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, AlertCircle } from "lucide-react";
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

  // Log when component mounts with props
  useEffect(() => {
    console.log("ProjectSelector mounted with selectedProjectId:", selectedProjectId);
  }, [selectedProjectId]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        console.log("Fetching projects...");
        setLoading(true);
        setError(null);
        
        const { data: userData } = await supabase.auth.getUser();
        if (!userData?.user) {
          console.error("No user found when fetching projects");
          setProjects([]);
          setLoading(false);
          return;
        }

        console.log("User found, fetching projects for user:", userData.user.id);
        const { data, error } = await supabase
          .from('projects')
          .select('id, title')
          .eq('user_id', userData.user.id)
          .order('updated_at', { ascending: false });

        if (error) {
          console.error("Supabase error:", error);
          throw error;
        }
        
        // Ensure data is an array before setting it
        const projectsArray = Array.isArray(data) ? data : [];
        console.log("Projects fetched successfully:", projectsArray);
        setProjects(projectsArray);
      } catch (error) {
        console.error('Error fetching projects:', error);
        setError('Failed to load projects');
        toast({
          title: "Error",
          description: "Failed to load projects. Please try again.",
          variant: "destructive",
        });
        // Ensure we set an empty array on error
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [toast]);

  // Find the selected project safely
  const selectedProject = selectedProjectId 
    ? projects.find(project => project?.id === selectedProjectId) 
    : undefined;

  console.log("Current selected project:", selectedProject);

  // This function explicitly handles selection with console logs for debugging
  const handleSelectProject = (projectId: string) => {
    console.log("handleSelectProject called with:", projectId);
    
    // Call onSelect with the selected project ID
    onSelect(projectId);
    
    // Close the popover after a short delay to ensure the selection is visible
    setTimeout(() => {
      setOpen(false);
    }, 100);
  };

  // Determine if there's an error condition based on required and errorMessage props
  const hasError = required && !selectedProjectId && errorMessage;

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant={hasError ? "destructive" : "outline"}
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between", 
              hasError && "border-red-500 text-red-600"
            )}
            disabled={loading}
          >
            {selectedProject ? selectedProject.title : loading ? "Loading projects..." : required ? "Select a project (required)" : "Select project..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-[300px] p-0 bg-white border border-gray-200 shadow-lg rounded-md"
          align="start"
          sideOffset={5}
          style={{ zIndex: 9999 }} // Ensure high z-index
        >
          <Command className="rounded-md border-0">
            <CommandInput placeholder="Search projects..." className="h-9" />
            <CommandList className="max-h-[300px] overflow-auto">
              <CommandEmpty className="py-3 text-center text-sm">No projects found.</CommandEmpty>
              <CommandGroup>
                {projects.length === 0 && loading ? (
                  <CommandItem disabled className="py-3 text-center">
                    Loading projects...
                  </CommandItem>
                ) : projects.length === 0 ? (
                  <CommandItem disabled className="py-3 text-center">
                    No projects available
                  </CommandItem>
                ) : (
                  projects.map((project) => (
                    <CommandItem
                      key={project.id}
                      value={project.id}
                      className="flex items-center py-2 cursor-pointer hover:bg-gray-100"
                      onSelect={() => handleSelectProject(project.id)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedProjectId === project.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <span>{project.title}</span>
                    </CommandItem>
                  ))
                )}
              </CommandGroup>
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
