
import { useState, useEffect } from "react";
import { Check, Folder, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useProjectTitle } from "@/hooks/useProjectTitle";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { title: selectedProjectTitle } = useProjectTitle(selectedProjectId || null);

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
  };

  // Determine if there's an error condition
  const hasError = required && !selectedProjectId && errorMessage;

  // Determine what text to show on the button
  const getButtonText = () => {
    if (loading) {
      return "Loading projects...";
    }
    
    return required 
      ? "Select a project (required)" 
      : "Select project...";
  };

  return (
    <div className="space-y-2">
      <Select
        value={selectedProjectId}
        onValueChange={handleSelectProject}
        disabled={loading}
      >
        <SelectTrigger 
          className={cn(
            "w-full transition-all",
            hasError ? "border-red-500 text-red-600" : 
            selectedProjectId ? "border-green-500 bg-green-50/50 text-green-800" : 
            "hover:bg-slate-100"
          )}
        >
          <div className="flex items-center">
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Folder className={cn(
                "mr-2 h-4 w-4 shrink-0", 
                selectedProjectId ? "text-green-600" : "text-slate-500"
              )} />
            )}
            <SelectValue placeholder={getButtonText()}>
              {selectedProjectTitle}
            </SelectValue>
          </div>
        </SelectTrigger>
        <SelectContent className="max-h-[300px] overflow-auto">
          <SelectGroup>
            {projects.length === 0 ? (
              <div className="py-6 text-center px-4">
                <p className="text-sm text-slate-500 mb-2">No projects available</p>
                <p className="text-xs text-slate-400">Create a project first</p>
              </div>
            ) : (
              projects.map((project) => (
                <SelectItem 
                  key={project.id} 
                  value={project.id}
                  className="flex items-center py-2"
                >
                  <div className="flex items-center">
                    <Folder className="h-4 w-4 mr-2 text-slate-400" />
                    <span className="truncate">{project.title}</span>
                    {selectedProjectId === project.id && (
                      <Check className="ml-2 h-4 w-4 text-green-600" />
                    )}
                  </div>
                </SelectItem>
              ))
            )}
          </SelectGroup>
        </SelectContent>
      </Select>
      
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
