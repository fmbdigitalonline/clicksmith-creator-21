
import { Button } from "@/components/ui/button";
import { Save, Download } from "lucide-react";
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
  onSave: () => void;
  onDownload: () => void;
  isSaving: boolean;
}

const DownloadControls = ({ 
  downloadFormat, 
  onFormatChange, 
  onSave,
  onDownload,
  isSaving 
}: DownloadControlsProps) => {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Select
          value={downloadFormat}
          onValueChange={onFormatChange}
        >
          <SelectTrigger className="w-18 md:w-24 h-9 text-xs md:text-sm">
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
          onClick={onDownload}
          className="flex-1 h-9 text-xs md:text-sm"
          variant="outline"
          disabled={isSaving}
        >
          <Download className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
          <span className="whitespace-nowrap">Download</span>
        </Button>
      </div>
      
      <Button
        onClick={onSave}
        className="w-full bg-facebook hover:bg-facebook/90 h-9 text-xs md:text-sm"
        disabled={isSaving}
      >
        {isSaving ? (
          "Saving..."
        ) : (
          <>
            <Save className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
            <span>Save Ad</span>
          </>
        )}
      </Button>
    </div>
  );
};

export default DownloadControls;
