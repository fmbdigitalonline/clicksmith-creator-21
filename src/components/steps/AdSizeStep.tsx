import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdFormat } from "@/types/adWizard";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const AD_FORMATS: Record<string, AdFormat[]> = {
  facebook: [
    {
      format: "Facebook News Feed Single Image",
      dimensions: { width: 1080, height: 1080 },
      aspectRatio: "1:1 to 1.91:1",
      description: "Best for standard feed posts"
    },
    {
      format: "Facebook News Feed Single Video",
      dimensions: { width: 1080, height: 1080 },
      aspectRatio: "1:1, 4:5 (mobile)",
      description: "Optimized for desktop and mobile"
    },
    {
      format: "Facebook Video Feeds",
      dimensions: { width: 1080, height: 1080 },
      aspectRatio: "4:5",
      description: "Supports ratios from 16:9 to 9:16"
    },
    {
      format: "Facebook Story",
      dimensions: { width: 1080, height: 1920 },
      aspectRatio: "9:16",
      description: "Full-screen vertical format"
    }
  ],
  instagram: [
    {
      format: "Instagram Feed Single Image",
      dimensions: { width: 1080, height: 1080 },
      aspectRatio: "1:1",
      description: "Square format, supports 16:9 to 9:16"
    },
    {
      format: "Instagram Feed Single Video",
      dimensions: { width: 1080, height: 1350 },
      aspectRatio: "4:5",
      description: "Supports ratios from 1.91:1 to 4:5"
    },
    {
      format: "Instagram Story",
      dimensions: { width: 1080, height: 1920 },
      aspectRatio: "9:16",
      description: "Full-screen vertical format"
    }
  ],
  reels: [
    {
      format: "Facebook & Instagram Reels Video",
      dimensions: { width: 500, height: 888 },
      aspectRatio: "9:16",
      description: "Vertical video format"
    },
    {
      format: "Facebook & Instagram Reels Image",
      dimensions: { width: 1080, height: 1080 },
      aspectRatio: "1:1",
      description: "Square format for static content"
    }
  ],
  messenger: [
    {
      format: "Messenger Sponsored Messages",
      dimensions: { width: 1200, height: 628 },
      aspectRatio: "1.91:1",
      description: "Supports ratios from 9:16 to 16:9"
    },
    {
      format: "Messenger Inbox Ads",
      dimensions: { width: 1080, height: 1080 },
      aspectRatio: "1:1",
      description: "Square format for inbox placement"
    }
  ]
};

const AdSizeStep = ({
  onNext,
  onBack,
}: {
  onNext: (format: AdFormat) => void;
  onBack: () => void;
}) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
        <Button
          variant="outline"
          onClick={onBack}
          className="space-x-2 w-full md:w-auto"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Previous Step</span>
        </Button>
      </div>

      <div>
        <h2 className="text-xl md:text-2xl font-semibold mb-2">Choose Ad Format</h2>
        <p className="text-gray-600 mb-6">
          Select the format that best fits your campaign goals and platform.
        </p>
      </div>

      <Tabs defaultValue="facebook" className="w-full">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-transparent h-auto">
          <TabsTrigger value="facebook" className="data-[state=active]:bg-facebook data-[state=active]:text-white">
            Facebook
          </TabsTrigger>
          <TabsTrigger value="instagram" className="data-[state=active]:bg-[#E1306C] data-[state=active]:text-white">
            Instagram
          </TabsTrigger>
          <TabsTrigger value="reels" className="data-[state=active]:bg-gradient-to-r from-[#405DE6] to-[#E1306C] data-[state=active]:text-white">
            Reels
          </TabsTrigger>
          <TabsTrigger value="messenger" className="data-[state=active]:bg-[#0084FF] data-[state=active]:text-white">
            Messenger
          </TabsTrigger>
        </TabsList>

        {Object.entries(AD_FORMATS).map(([platform, formats]) => (
          <TabsContent key={platform} value={platform} className="mt-6">
            <div className="grid gap-6">
              {formats.map((format) => (
                <Card
                  key={format.format}
                  className="relative group cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-facebook"
                  onClick={() => onNext(format)}
                >
                  <CardHeader>
                    <CardTitle>{format.format}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-gray-600">
                        {format.dimensions.width} x {format.dimensions.height}px
                      </p>
                      <p className="text-gray-600">
                        Aspect Ratio: {format.aspectRatio}
                      </p>
                      <p className="text-gray-500 text-sm">
                        {format.description}
                      </p>
                    </div>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowRight className="w-5 h-5 text-facebook" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default AdSizeStep;