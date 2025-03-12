
import { TableIcon, GridIcon } from "lucide-react";
import { Toggle } from "@/components/ui/toggle";

interface ProjectViewSwitcherProps {
  view: "grid" | "table";
  onChange: (view: "grid" | "table") => void;
}

const ProjectViewSwitcher = ({ view, onChange }: ProjectViewSwitcherProps) => {
  return (
    <div className="flex gap-2 items-center">
      <Toggle
        pressed={view === "grid"}
        onPressedChange={() => onChange("grid")}
        aria-label="Grid view"
      >
        <GridIcon className="h-4 w-4" />
      </Toggle>
      <Toggle
        pressed={view === "table"}
        onPressedChange={() => onChange("table")}
        aria-label="Table view"
      >
        <TableIcon className="h-4 w-4" />
      </Toggle>
    </div>
  );
};

export default ProjectViewSwitcher;
