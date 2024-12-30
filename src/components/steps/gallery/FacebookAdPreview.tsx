import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Save } from "lucide-react";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useParams } from "react-router-dom";

const AD_FORMATS = [
  { width: 1200, height: 628, label: "Facebook Feed" },
  { width: 1080, height: 1080, label: "Facebook Square" },
  { width: 1080, height: 1350, label: "Facebook Portrait" },
];

interface FacebookAdPreviewProps {
  variant: any;
  onCreateProject: () => void;
  isVideo?: boolean;
}

const FacebookAdPreview = ({ variant, onCreateProject, isVideo = false }: FacebookAdPreviewProps) => {
  const [selectedFormat, setSelectedFormat] = useState(AD_FORMATS[0]);
  const [downloadFormat, setDownloadFormat] = useState<"jpg" | "png">("jpg");
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { projectId } = useParams();

  const handleDownload = async () => {
    try {
      const response = await fetch(variant.imageUrl || variant.image?.url);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `facebook-ad-${selectedFormat.width}x${selectedFormat.height}.${downloadFormat}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading image:', error);
    }
  };

  const handleSaveToProject = async () => {
    if (!projectId) {
      toast({
        title: "No Project Selected",
        description: "Please create a project first to save your ad.",
        action: (
          <Button variant="outline" onClick={onCreateProject}>
            Create Project
          </Button>
        ),
      });
      return;
    }

    setIsSaving(true);
    try {
      // First, get the current project's generated_ads
      const { data: project, error: fetchError } = await supabase
        .from('projects')
        .select('generated_ads')
        .eq('id', projectId)
        .single();

      if (fetchError) throw fetchError;

      // Prepare the new ad data
      const newAd = {
        image: {
          url: variant.imageUrl || variant.image?.url,
          width: selectedFormat.width,
          height: selectedFormat.height,
        },
        hook: variant.hook,
        savedAt: new Date().toISOString(),
      };

      // Combine existing ads with the new one
      const existingAds = Array.isArray(project?.generated_ads) ? project.generated_ads : [];
      const updatedAds = [...existingAds, newAd];

      // Update the project with the new ad
      const { error: updateError } = await supabase
        .from('projects')
        .update({
          generated_ads: updatedAds,
        })
        .eq('id', projectId);

      if (updateError) throw updateError;

      toast({
        title: "Success!",
        description: "Ad saved to project successfully.",
      });
    } catch (error) {
      console.error('Error saving ad to project:', error);
      toast({
        title: "Error",
        description: "Failed to save ad to project. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="aspect-video relative">
        {isVideo ? (
          <div className="flex items-center justify-center h-full bg-gray-100">
            <p className="text-gray-500">Video Preview</p>
          </div>
        ) : (
          variant.imageUrl && (
            <img
              src={variant.imageUrl}
              alt="Ad preview"
              className="object-cover w-full h-full"
            />
          )
        )}
      </div>

      <div className="p-4 space-y-4">
        <div className="space-y-2">
          <Select
            value={selectedFormat.label}
            onValueChange={(value) => 
              setSelectedFormat(AD_FORMATS.find(format => format.label === value) || AD_FORMATS[0])
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select format" />
            </SelectTrigger>
            <SelectContent>
              {AD_FORMATS.map((format) => (
                <SelectItem key={format.label} value={format.label}>
                  {format.label} ({format.width}x{format.height})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <h3 className="font-medium text-lg">
            {variant.hook?.description || "Marketing Angle"}
          </h3>
          <p className="text-gray-600">
            {variant.hook?.text || variant.text || "Ad copy not available"}
          </p>
        </div>

        {/* Download Controls */}
        <div className="flex gap-2">
          <Select
            value={downloadFormat}
            onValueChange={(value: "jpg" | "png") => setDownloadFormat(value)}
          >
            <SelectTrigger className="w-24">
              <SelectValue placeholder="Format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="jpg">JPG</SelectItem>
              <SelectItem value="png">PNG</SelectItem>
            </SelectContent>
          </Select>

          <Button 
            className="flex-1 bg-facebook hover:bg-facebook/90"
            onClick={handleDownload}
          >
            <Download className="w-4 h-4 mr-2" />
            Download Ad
          </Button>
        </div>

        {/* Save to Project Button */}
        <Button 
          className="w-full"
          onClick={handleSaveToProject}
          disabled={isSaving}
        >
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? "Saving..." : "Save to Project"}
        </Button>
      </div>
    </Card>
  );
};

export default FacebookAdPreview;