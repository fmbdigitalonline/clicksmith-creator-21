import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface FacebookAdPreviewProps {
  variant: any;
  onCreateProject: () => void;
  isVideo?: boolean;
}

const FacebookAdPreview = ({ variant, onCreateProject, isVideo = false }: FacebookAdPreviewProps) => {
  return (
    <Card className="overflow-hidden">
      <div className="p-4 space-y-4">
        {/* Primary Text Section */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-600">Primary Text:</p>
          <p className="text-gray-800">{variant.primaryText || variant.description}</p>
        </div>

        {/* Image Preview */}
        <div className="aspect-video relative rounded-lg overflow-hidden bg-gray-100">
          {isVideo ? (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
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

        {/* Headline Section */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-600">Headline:</p>
          <h3 className="text-lg font-semibold text-facebook">{variant.headline || variant.hook?.text}</h3>
        </div>

        {/* Action Button */}
        <Button 
          className="w-full bg-facebook hover:bg-facebook/90"
          onClick={onCreateProject}
        >
          <Download className="w-4 h-4 mr-2" />
          Save Ad
        </Button>
      </div>
    </Card>
  );
};

export default FacebookAdPreview;