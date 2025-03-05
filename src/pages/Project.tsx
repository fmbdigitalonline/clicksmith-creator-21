
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ProjectOverview from "@/components/projects/ProjectOverview";

const Project = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [project, setProject] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (projectId) {
      loadProject();
    }
  }, [projectId]);

  const loadProject = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        setProject(data);
      } else {
        toast({
          title: "Project not found",
          description: "The requested project could not be found.",
          variant: "destructive",
        });
        navigate('/projects');
      }
    } catch (error) {
      console.error("Error loading project:", error);
      toast({
        title: "Error",
        description: "Failed to load project details.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNavigateToAdWizard = () => {
    navigate(`/ad-wizard/${projectId}`);
  };

  const handleBackToProjects = () => {
    navigate('/projects');
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-12 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container mx-auto py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Project Not Found</h1>
        <p className="mb-8">The project you're looking for doesn't exist or has been deleted.</p>
        <Button onClick={() => navigate('/projects')}>Back to Projects</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <ProjectOverview 
        projectId={projectId || ''}
        onNavigateToAdWizard={handleNavigateToAdWizard}
        onBackToProjects={handleBackToProjects}
      />
    </div>
  );
};

export default Project;
