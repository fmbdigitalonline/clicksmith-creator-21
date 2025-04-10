
import { Button } from "@/components/ui/button";
import { Download, Save, FileVideo, FileImage } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

interface DownloadControlsProps {
  downloadFormat: string;
  onFormatChange: (value: string) => void;
  onSave: () => void;
  onDownload: () => void;
  isSaving: boolean;
  isVideo?: boolean;
}

const DownloadControls = ({ 
  downloadFormat, 
  onFormatChange, 
  onSave, 
  onDownload, 
  isSaving,
  isVideo = false
}: DownloadControlsProps) => {
  return (
    <TooltipProvider>
      <div className="mt-4 space-y-3">
        <div className="flex space-x-3">
          <Button 
            onClick={onSave} 
            className="w-full" 
            disabled={isSaving}
          >
            {isSaving ? (
              "Saving..."
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save {isVideo ? 'Video' : 'Ad'}
              </>
            )}
          </Button>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={onDownload}
              >
                <Download className="w-4 h-4 mr-2" />
                Download {isVideo ? 'Video' : 'Ad'}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Download this {isVideo ? 'video' : 'image'} to your device</p>
            </TooltipContent>
          </Tooltip>
        </div>
        
        {!isVideo && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Format:</span>
            <Select value={downloadFormat} onValueChange={onFormatChange}>
              <SelectTrigger className="w-[80px]">
                <SelectValue placeholder="JPG" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="jpg">JPG</SelectItem>
                <SelectItem value="png">PNG</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="docx">DOCX</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex items-center">
          {isVideo ? (
            <FileVideo className="w-4 h-4 mr-2 text-gray-500" />
          ) : (
            <FileImage className="w-4 h-4 mr-2 text-gray-500" />
          )}
          <span className="text-sm text-gray-500">
            {isVideo ? 'Video ads ready for cross-platform sharing' : 'High-quality image ready for ad networks'}
          </span>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default DownloadControls;
