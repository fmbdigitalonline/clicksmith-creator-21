import { AdHook } from "@/types/adWizard";
import { AdFeedbackControls } from "./components/AdFeedbackControls";
import { Card, CardContent } from "@/components/ui/card";
import { useParams } from "react-router-dom";

interface PlatformContentProps {
  platformName: string;
  adVariants: any[];
  onCreateProject: () => void;
  videoAdsEnabled?: boolean;
}

const PlatformContent = ({ 
  platformName, 
  adVariants = [], 
  onCreateProject, 
  videoAdsEnabled = false 
}: PlatformContentProps) => {
  const { projectId } = useParams();
  const filteredVariants = Array.isArray(adVariants) ? adVariants : [];

  if (filteredVariants.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No ad variants available. Please try regenerating the ads.</p>
      </div>
    );
  }

  const platformSpecificMessage = {
    facebook: "Perfect for Facebook Feed, Stories, and Instagram",
    google: "Optimized for Google Display Network and YouTube",
    linkedin: "Professional format for LinkedIn Feed and Sponsored Content",
    tiktok: "Engaging format for TikTok For Business"
  }[platformName] || "";

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-600 mb-4">{platformSpecificMessage}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredVariants.map((variant, index) => (
          <Card key={`${index}-${variant.size?.label || 'default'}`} className="overflow-hidden">
            <CardContent className="p-4 space-y-4">
              {/* Description Section */}
              <div className="bg-facebook/5 p-3 rounded-lg">
                <p className="text-sm font-medium text-facebook mb-1">Description:</p>
                <p className="text-gray-800">{variant.description}</p>
              </div>

              {/* Image Section */}
              <div className="aspect-video relative">
                <img
                  src={variant.imageUrl}
                  alt={`Ad variant ${index + 1}`}
                  className="object-cover w-full h-full rounded-lg"
                />
              </div>

              {/* Headline Section */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm font-medium text-gray-600 mb-1">Headline:</p>
                <h3 className="text-lg font-medium text-gray-800">{variant.headline}</h3>
              </div>

              {/* Feedback and Save Controls */}
              <div className="pt-4 border-t">
                <AdFeedbackControls
                  adId={variant.id}
                  projectId={projectId}
                  onFeedbackSubmit={() => {
                    // Optionally refresh the gallery or show a success message
                  }}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PlatformContent;