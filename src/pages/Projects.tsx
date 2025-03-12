import { useState } from "react";
import ProjectList from "@/components/projects/ProjectList";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileImage } from "lucide-react";
import ProjectProgressDetails from "@/components/projects/ProjectProgressDetails";
import { BusinessIdea, TargetAudience, AudienceAnalysis } from "@/types/adWizard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SavedAdsGallery } from "@/components/gallery/SavedAdsGallery";
import { Separator } from "@/components/ui/separator";
import ProjectViewSwitcher from "@/components/projects/ProjectViewSwitcher";
import ProjectTable from "@/components/projects/ProjectTable";
import ProjectFilters from "@/components/projects/ProjectFilters";

interface Project {
  id: string;
  title: string;
  business_idea: BusinessIdea | null;
  target_audience: TargetAudience | null;
  audience_analysis: AudienceAnalysis | null;
  marketing_campaign: any | null;
}

const Projects = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const [view, setView] = useState<"grid" | "table">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: project, isError, isLoading: isProjectLoading } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      if (!projectId) return null;
      
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .maybeSingle();
        
      if (error) throw error;
      
      // First cast to unknown, then to Project
      const typedData = data as unknown as Project;
      return typedData;
    },
    enabled: !!projectId
  });

  const handleStartAdWizard = (projectId?: string) => {
    if (projectId) {
      navigate(`/ad-wizard/${projectId}`, { replace: true });
    } else {
      navigate("/ad-wizard/new", { replace: true });
    }
  };

  if (projectId && !project && !isProjectLoading) {
    return (
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col items-center justify-center py-12">
          <h1 className="text-2xl font-bold mb-4">Project Not Found</h1>
          <p className="text-muted-foreground mb-6">The project you're looking for doesn't exist or you don't have permission to view it.</p>
          <Button onClick={() => navigate("/projects")} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Projects
          </Button>
        </div>
      </div>
    );
  }

  if (isProjectLoading) {
    return (
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-center h-64">
          <p className="text-lg text-muted-foreground">Loading project...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-4">
      {projectId && project ? (
        <div>
          <div className="flex items-center gap-4 mb-6">
            <Button onClick={() => navigate("/projects")} variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-bold">{project.title}</h1>
          </div>
          
          <Tabs defaultValue="details" className="space-y-6">
            <TabsList>
              <TabsTrigger value="details">Project Details</TabsTrigger>
              <TabsTrigger value="ads" className="flex items-center">
                <FileImage className="w-4 h-4 mr-2" />
                Saved Ads
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="space-y-6">
              <div className="flex items-center gap-2">
                <Button 
                  onClick={() => handleStartAdWizard(project.id)}
                  className="w-full sm:w-auto"
                >
                  {project.business_idea ? 'Continue Idea Wizard' : 'Start Idea Wizard'}
                </Button>
              </div>
              <ProjectProgressDetails
                businessIdea={project.business_idea || undefined}
                targetAudience={project.target_audience || undefined}
                audienceAnalysis={project.audience_analysis || undefined}
              />
            </TabsContent>
            
            <TabsContent value="ads">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Project Ads</h2>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate("/gallery/saved")}
                  >
                    View All Saved Ads
                  </Button>
                </div>
                <Separator />
                <ProjectAdsGallery projectId={project.id} />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h1 className="text-2xl font-bold">Projects</h1>
            <ProjectViewSwitcher view={view} onChange={setView} />
          </div>
          
          <ProjectFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
          />

          {view === "grid" ? (
            <ProjectList onStartAdWizard={handleStartAdWizard} />
          ) : (
            <ProjectTable
              projects={filteredProjects}
              onProjectClick={(id) => navigate(`/projects/${id}`)}
              onStartAdWizard={handleStartAdWizard}
            />
          )}
        </div>
      )}
    </div>
  );
};

// Component to display ads for a specific project
const ProjectAdsGallery = ({ projectId }: { projectId: string }) => {
  const { data: projectAds, isLoading, error } = useQuery({
    queryKey: ["projectAds", projectId],
    queryFn: async () => {
      console.log("Fetching ads for project:", projectId);
      const { data, error } = await supabase
        .from('ad_feedback')
        .select('*')
        .eq('project_id', projectId);
        
      if (error) {
        console.error("Error fetching project ads:", error);
        throw error;
      }
      
      console.log("Fetched ads:", data);
      return data || [];
    }
  });

  if (isLoading) {
    return <div className="py-8 text-center">Loading project ads...</div>;
  }

  if (error) {
    return <div className="py-8 text-center text-red-500">Error loading ads. Please try again.</div>;
  }

  if (!projectAds || projectAds.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-muted-foreground">No ads have been assigned to this project yet.</p>
        <p className="mt-2">
          <Button 
            variant="link" 
            onClick={() => window.location.href = "/gallery/saved"}
          >
            Go to your saved ads gallery to assign ads to this project
          </Button>
        </p>
      </div>
    );
  }

  return <SavedAdsGallery projectFilter={projectId} />;
};

export default Projects;
