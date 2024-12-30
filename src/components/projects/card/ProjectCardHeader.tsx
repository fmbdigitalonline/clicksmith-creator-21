import { CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ProjectCardHeaderProps {
  title: string;
  validationProgress: number;
}

const ProjectCardHeader = ({ title, validationProgress }: ProjectCardHeaderProps) => {
  const getStatusVariant = () => {
    if (validationProgress === 100) return "default";
    if (validationProgress > 50) return "secondary";
    return "outline";
  };

  return (
    <CardHeader>
      <CardTitle className="flex items-center justify-between">
        <span>{title}</span>
        <Badge variant={getStatusVariant()}>{`${validationProgress}% Validated`}</Badge>
      </CardTitle>
    </CardHeader>
  );
};

export default ProjectCardHeader;