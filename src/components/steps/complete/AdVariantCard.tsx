import { Card, CardContent } from "@/components/ui/card";
import { AdHook, AdImage } from "@/types/adWizard";
import AdFeedbackForm from "./AdFeedbackForm";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { SaveAdButton } from "./SaveAdButton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AdVariantCardProps {
  image: AdImage;
  hook: AdHook;
  index: number;
  onCreateProject?: () => void;
}

const AD_SIZES = [
  { width: 1200, height: 628, label: "Landscape (1.91:1)" },
  { width: 1080, height: 1080, label: "Square (1:1)" },
  { width: 1080, height: 1920, label: "Vertical (9:16)" }
];

const AdVariantCard = ({ image, hook, index, onCreateProject }: AdVariantCardProps) => {
  const [rating, setRating] = useState("");
  const [feedback, setFeedback] = useState("");
  const [selectedSize, setSelectedSize] = useState(`${AD_SIZES[0].width}x${AD_SIZES[0].height}`);
  const { projectId } = useParams();

  const handleDownload = async () => {
    try {
      const imageUrl = image.variants?.[selectedSize] || image.url;
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ad-variant-${index + 1}-${selectedSize}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading image:', error);
    }
  };

  const currentImageUrl = image.variants?.[selectedSize] || image.url;
  const [width, height] = selectedSize.split('x').map(Number);

  return (
    <Card className="overflow-hidden">
      <div className="p-4 space-y-4">
        <Select value={selectedSize} onValueChange={setSelectedSize}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select size" />
          </SelectTrigger>
          <SelectContent>
            {AD_SIZES.map((size) => (
              <SelectItem key={`${size.width}x${size.height}`} value={`${size.width}x${size.height}`}>
                {size.label} ({size.width}x{size.height})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div 
          className="relative bg-gray-100 rounded-lg overflow-hidden"
          style={{ 
            aspectRatio: `${width}/${height}`,
            maxHeight: '400px'
          }}
        >
          <img
            src={currentImageUrl}
            alt={`Ad variant ${index + 1}`}
            className="object-cover w-full h-full"
          />
        </div>
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