import { Card, CardContent } from "@/components/ui/card";
import { AdHook, AdImage } from "@/types/adWizard";
import AdFeedbackForm from "./AdFeedbackForm";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { SaveAdButton } from "./SaveAdButton";

interface AdVariantCardProps {
  image: AdImage;
  hook: AdHook;
  index: number;
  onCreateProject?: () => void;
}

const AdVariantCard = ({ image, hook, index, onCreateProject }: AdVariantCardProps) => {
  const [rating, setRating] = useState("");
  const [feedback, setFeedback] = useState("");
  const { projectId } = useParams();

  const handleDownload = async () => {
    try {
      const response = await fetch(image.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ad-variant-${index + 1}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading image:', error);
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="aspect-video relative">
        <img
          src={image.url}
          alt={`Ad variant ${index + 1}`}
          className="object-cover w-full h-full"
        />
      </div>
      <CardContent className="p-4 space-y-4">
        <h3 className="font-medium text-lg">Variant {index + 1}</h3>
        <div className="space-y-2">
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm font-medium text-gray-600 mb-1">Marketing Angle:</p>
            <p className="text-gray-800">{hook.description}</p>
          </div>
          <div className="bg-facebook/5 p-3 rounded-lg">
            <p className="text-sm font-medium text-facebook mb-1">Ad Copy:</p>
            <p className="text-gray-800 font-medium">{hook.text}</p>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t">
          <AdFeedbackForm
            rating={rating}
            feedback={feedback}
            onRatingChange={setRating}
            onFeedbackChange={setFeedback}
          />

          <SaveAdButton
            image={image}
            hook={hook}
            primaryText={hook.text}
            headline={hook.description}
            rating={rating}
            feedback={feedback}
            projectId={projectId}
            onCreateProject={onCreateProject}
            onSaveSuccess={handleDownload}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default AdVariantCard;