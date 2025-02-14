
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
    <CardHeader className="p-3 pb-0">
      <CardTitle className="flex items-center justify-between text-base">
        <span className="truncate">{title}</span>
        <Badge variant={getStatusVariant()} className="text-[10px] px-2 py-0.5 ml-2 shrink-0">
          {`${validationProgress}% Validated`}
        </Badge>
      </CardTitle>
    </CardHeader>
  );
};

export default ProjectCardHeader;
