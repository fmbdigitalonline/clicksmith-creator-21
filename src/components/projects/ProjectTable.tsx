
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, CheckCircle, Clock } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface ProjectTableProps {
  projects: Array<{
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
    generated_ads?: any[]; // Keep this property
  }>;
  onProjectClick: (projectId: string) => void;
  onStartAdWizard: (projectId: string) => void;
}

const ProjectTable = ({ projects, onProjectClick, onStartAdWizard }: ProjectTableProps) => {
  const getValidationProgress = (project: any) => {
    let progress = 0;
    if (project.business_idea) progress += 25;
    if (project.target_audience) progress += 25;
    if (project.audience_analysis) progress += 25;
    if (project.marketing_campaign) progress += 25;
    return progress;
  };

  const getStepStatusIcon = (project: any) => {
    if (Array.isArray(project.generated_ads) && project.generated_ads.length > 0) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    if (project.current_step > 1) {
      return <Clock className="h-4 w-4 text-yellow-500" />;
    }
    return <Play className="h-4 w-4 text-blue-500" />;
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Project</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Progress</TableHead>
          <TableHead>Last Updated</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {projects.map((project) => (
          <TableRow key={project.id} className="cursor-pointer hover:bg-muted/50">
            <TableCell className="font-medium">
              <div className="space-y-1">
                <div>{project.title}</div>
                {project.tags && project.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {project.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-[10px]">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                {getStepStatusIcon(project)}
                <span className="text-sm text-muted-foreground">
                  {Array.isArray(project.generated_ads) && project.generated_ads.length > 0
                    ? "Complete"
                    : project.current_step > 1
                    ? `Step ${project.current_step} of 4`
                    : "Not Started"}
                </span>
              </div>
            </TableCell>
            <TableCell>
              <div className="w-[160px] space-y-2">
                <Progress value={getValidationProgress(project)} className="h-2" />
                <div className="text-[10px] text-muted-foreground">
                  {getValidationProgress(project)}% Validated
                </div>
              </div>
            </TableCell>
            <TableCell>
              <span className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(project.updated_at), { addSuffix: true })}
              </span>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onProjectClick(project.id)}
                >
                  View <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  onClick={() => onStartAdWizard(project.id)}
                >
                  {project.business_idea ? 'Continue' : 'Start'}
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default ProjectTable;
