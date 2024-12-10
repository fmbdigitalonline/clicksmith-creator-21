import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, ArrowRight } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type AdFormat = {
  format: string;
  dimensions: {
    width: number;
    height: number;
  };
};

const AD_FORMATS = [
  { label: "Image Ad (Landscape)", value: "image_landscape", width: 1200, height: 628 },
  { label: "Video Ad (Landscape)", value: "video_landscape", width: 1200, height: 628 },
  { label: "Video Ad (Square)", value: "video_square", width: 1080, height: 1080 },
  { label: "Video Ad (Vertical)", value: "video_vertical", width: 1080, height: 1920 },
  { label: "Carousel Ad", value: "carousel", width: 1080, height: 1080 },
  { label: "Stories Ad", value: "stories", width: 1080, height: 1920 },
  { label: "Reels Ad", value: "reels", width: 1080, height: 1920 },
];

interface AdFormatStepProps {
  onNext: (format: AdFormat) => void;
  onBack: () => void;
}

const AdFormatStep = ({ onNext, onBack }: AdFormatStepProps) => {
  const handleFormatSelect = (value: string) => {
    const format = AD_FORMATS.find((f) => f.value === value);
    if (format) {
      onNext({
        format: format.value,
        dimensions: {
          width: format.width,
          height: format.height,
        },
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Choose Ad Format</h2>
        <p className="text-gray-600">
          Select the format that best suits your advertising needs
        </p>
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Ad Format</label>
            <Select onValueChange={handleFormatSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Select ad format" />
              </SelectTrigger>
              <SelectContent>
                {AD_FORMATS.map((format) => (
                  <SelectItem key={format.value} value={format.value}>
                    {format.label} ({format.width}x{format.height})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="text-sm text-gray-500">
            <p>Your ad will be optimized for the selected format and dimensions.</p>
          </div>
        </div>
      </Card>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack} className="space-x-2">
          <ArrowLeft className="w-4 h-4" />
          <span>Previous Step</span>
        </Button>
      </div>
    </div>
  );
};

export default AdFormatStep;