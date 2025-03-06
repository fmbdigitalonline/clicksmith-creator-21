
import { useState, useEffect } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Project {
  id: string;
  title: string;
}

interface ProjectSelectorProps {
  onSelect: (projectId: string) => void;
  selectedProjectId?: string;
}

export function ProjectSelector({ onSelect, selectedProjectId }: ProjectSelectorProps) {
  const [open, setOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
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

        if (error) throw error;
        
        // Ensure data is an array before setting it
        const projectsArray = Array.isArray(data) ? data : [];
        console.log("Projects fetched:", projectsArray);
        setProjects(projectsArray);
      } catch (error) {
        console.error('Error fetching projects:', error);
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

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={loading}
        >
          {selectedProject ? selectedProject.title : loading ? "Loading projects..." : "Select project..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[300px] p-0 bg-white border border-gray-200 shadow-lg rounded-md z-50 animate-in fade-in-0 zoom-in-95 duration-100"
        align="start"
        sideOffset={5}
      >
        <Command className="rounded-md border-0">
          <CommandInput placeholder="Search projects..." className="h-9" />
          <CommandEmpty className="py-3 text-center text-sm">No projects found.</CommandEmpty>
          <CommandGroup className="max-h-[200px] overflow-auto">
            {projects && projects.length > 0 ? (
              projects.map((project) => (
                <CommandItem
                  key={project.id}
                  value={project.id}
                  onSelect={(currentValue) => {
                    onSelect(currentValue);
                    setOpen(false);
                  }}
                  className="flex items-center py-2"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedProjectId === project.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {project.title}
                </CommandItem>
              ))
            ) : (
              <CommandItem disabled className="py-3 text-center">
                {loading ? "Loading projects..." : "No projects available"}
              </CommandItem>
            )}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
