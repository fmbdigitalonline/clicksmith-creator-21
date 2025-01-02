import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DownloadControlsProps {
  downloadFormat: "jpg" | "png" | "pdf" | "docx";
  onFormatChange: (value: "jpg" | "png" | "pdf" | "docx") => void;
  onSaveAndDownload: () => void;
  isSaving: boolean;
}

const DownloadControls = ({ 
  downloadFormat, 
  onFormatChange, 
  onSaveAndDownload, 
  isSaving 
}: DownloadControlsProps) => {
  return (
    <div className="flex gap-2">
      <Select
        value={downloadFormat}
        onValueChange={onFormatChange}
      >
        <SelectTrigger className="w-24">
          <SelectValue placeholder="Format" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="jpg">JPG</SelectItem>
          <SelectItem value="png">PNG</SelectItem>
          <SelectItem value="pdf">PDF</SelectItem>
          <SelectItem value="docx">Word</SelectItem>
        </SelectContent>
      </Select>

      <Button
        onClick={onSaveAndDownload}
        className="flex-1 bg-facebook hover:bg-facebook/90"
        disabled={isSaving}
      >
        {isSaving ? (
          "Saving..."
        ) : (
          <>
            <Save className="w-4 h-4 mr-2" />
            Save & Download
          </>
        )}
      </Button>
    </div>
  );
};

export default DownloadControls;