
import { Button } from "@/components/ui/button";
import { ArrowLeft, Rocket } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ProjectActionsProps {
  onGenerateAds: () => void;
  onBackToProjects: () => void;
}

const ProjectActions = ({ onGenerateAds, onBackToProjects }: ProjectActionsProps) => {
  const { t } = useTranslation('projects');
  
  return (
    <div className="space-y-4">
      <p className="text-center text-muted-foreground">
        {t('actions.what_next')}
      </p>
      <div className="flex flex-col gap-3">
        <Button
          onClick={onGenerateAds}
          className="w-full"
          size="lg"
        >
          <Rocket className="mr-2" />
          {t('actions.generate_ads')}
        </Button>
        <Button
          onClick={onBackToProjects}
          variant="outline"
          className="w-full"
          size="lg"
        >
          <ArrowLeft className="mr-2" />
          {t('actions.back_to_projects')}
        </Button>
      </div>
    </div>
  );
};

export default ProjectActions;
