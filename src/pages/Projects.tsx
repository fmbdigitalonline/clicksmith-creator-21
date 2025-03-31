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
import { Json } from "@/integrations/supabase/types"; 
import { useTranslation } from "react-i18next";

interface ProjectData {
  id: string;
  title: string;
  description?: string | null;
  business_idea: Json | null;
  target_audience: Json | null;
  audience_analysis: Json | null;
  marketing_campaign: Json | null;
  status?: string;
  current_step?: number;
  updated_at: string;
  tags?: string[];
  generated_ads?: Json | null;
}

interface ProjectForTable {
  id: string;
  title: string;
  description: string | null;
  business_idea?: any;
  target_audience?: any;
  audience_analysis?: any;
  status: string;
  current_step: number;
  updated_at: string;
  tags?: string[];
  generated_ads?: any[];
}

const Projects = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const [view, setView] = useState<"grid" | "table">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { t } = useTranslation('projects');

  const { data: projects, isError, isLoading: isProjectLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      if (!projectId) {
        const { data, error } = await supabase
          .from("projects")
          .select("*")
          .order("updated_at", { ascending: false });
          
        if (error) throw error;
        return data as ProjectData[];
      }
      return null;
    },
  });

  const { data: singleProject } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      if (projectId) {
        const { data, error } = await supabase
          .from("projects")
          .select("*")
          .eq("id", projectId)
          .maybeSingle();
          
        if (error) throw error;
        return data as ProjectData;
      }
      return null;
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

  const filteredProjects = projects?.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (project.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      project.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === "all" ||
      (statusFilter === "completed" && 
        project.generated_ads !== null && 
        typeof project.generated_ads === 'object' && 
        Array.isArray(project.generated_ads) && 
        project.generated_ads.length > 0) ||
      (statusFilter === "active" && 
        (project.current_step ?? 0) > 1 && 
        (project.generated_ads === null || 
         !Array.isArray(project.generated_ads) || 
         project.generated_ads.length === 0)) ||
      (statusFilter === "not_started" && (project.current_step === 1 || project.current_step === undefined));

    return matchesSearch && matchesStatus;
  }) ?? [];

  if (projectId && !singleProject && !isProjectLoading) {
    return (
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col items-center justify-center py-12">
          <h1 className="text-2xl font-bold mb-4">{t('not_found.title')}</h1>
          <p className="text-muted-foreground mb-6">{t('not_found.description')}</p>
          <Button onClick={() => navigate("/projects")} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('actions.back_to_projects')}
          </Button>
        </div>
      </div>
    );
  }

  if (isProjectLoading) {
    return (
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-center h-64">
          <p className="text-lg text-muted-foreground">{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-4">
      {projectId && singleProject ? (
        <div>
          <div className="flex items-center gap-4 mb-6">
            <Button onClick={() => navigate("/projects")} variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('actions.back')}
            </Button>
            <h1 className="text-2xl font-bold">{singleProject.title}</h1>
          </div>
          
          <Tabs defaultValue="details" className="space-y-6">
            <TabsList>
              <TabsTrigger value="details">{t('details')}</TabsTrigger>
              <TabsTrigger value="ads" className="flex items-center">
                <FileImage className="w-4 h-4 mr-2" />
                {t('saved_ads')}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="space-y-6">
              <div className="flex items-center gap-2">
                <Button 
                  onClick={() => handleStartAdWizard(singleProject.id)}
                  className="w-full sm:w-auto"
                >
                  {singleProject.business_idea ? t('continue_wizard') : t('start_wizard')}
                </Button>
              </div>
              <ProjectProgressDetails
                businessIdea={singleProject.business_idea as BusinessIdea | undefined}
                targetAudience={singleProject.target_audience as TargetAudience | undefined}
                audienceAnalysis={singleProject.audience_analysis as AudienceAnalysis | undefined}
              />
            </TabsContent>
            
            <TabsContent value="ads">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">{t('project_ads')}</h2>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate("/gallery/saved")}
                  >
                    {t('view_all_saved')}
                  </Button>
                </div>
                <Separator />
                <ProjectAdsGallery projectId={singleProject.id} />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h1 className="text-2xl font-bold">{t('title')}</h1>
            <ProjectViewSwitcher view={view} onChange={setView} />
          </div>
          
          <ProjectFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
          />

          {view === "grid" ? (
            <ProjectList 
              onStartAdWizard={handleStartAdWizard}
              searchQuery={searchQuery}
              statusFilter={statusFilter}
            />
          ) : (
            <ProjectTable
              projects={filteredProjects.map(p => ({
                id: p.id,
                title: p.title,
                description: p.description || "",
                business_idea: p.business_idea,
                target_audience: p.target_audience,
                audience_analysis: p.audience_analysis,
                status: p.status || "draft",
                current_step: p.current_step || 1,
                updated_at: p.updated_at,
                tags: p.tags,
                generated_ads: Array.isArray(p.generated_ads) ? p.generated_ads : []
              }))}
              onProjectClick={(id) => navigate(`/projects/${id}`)}
              onStartAdWizard={handleStartAdWizard}
            />
          )}
        </div>
      )}
    </div>
  );
};

const ProjectAdsGallery = ({ projectId }: { projectId: string }) => {
  const { t } = useTranslation('projects');
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
    return <div className="py-8 text-center">{t('loading_ads')}</div>;
  }

  if (error) {
    return <div className="py-8 text-center text-red-500">{t('error_loading')}</div>;
  }

  if (!projectAds || projectAds.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-muted-foreground">{t('no_ads')}</p>
        <p className="mt-2">
          <Button 
            variant="link" 
            onClick={() => window.location.href = "/gallery/saved"}
          >
            {t('go_to_gallery')}
          </Button>
        </p>
      </div>
    );
  }

  return <SavedAdsGallery projectFilter={projectId} />;
};

export default Projects;
