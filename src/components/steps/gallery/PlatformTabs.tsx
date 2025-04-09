
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Linkedin } from "lucide-react";
import { SiTiktok } from "react-icons/si";

interface PlatformTabsProps {
  selectedPlatform: string;
  onPlatformChange: (value: string) => void;
  children?: React.ReactNode;
}

const PlatformTabs = ({ selectedPlatform, onPlatformChange, children }: PlatformTabsProps) => {
  return (
    <Tabs defaultValue={selectedPlatform} className="w-full" onValueChange={onPlatformChange}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Your Generated Ads</h3>
        <p className="text-gray-600 mb-4">
          These ads are designed to work across all major social media platforms. Preview how they'll look on each platform:
        </p>
      </div>
      <TabsList className="grid w-full grid-cols-4 mb-6">
        <TabsTrigger value="facebook">Facebook</TabsTrigger>
        <TabsTrigger value="google">Google</TabsTrigger>
        <TabsTrigger value="linkedin" className="flex items-center gap-2">
          <Linkedin className="h-4 w-4" />
          LinkedIn
        </TabsTrigger>
        <TabsTrigger value="tiktok" className="flex items-center gap-2">
          <SiTiktok className="h-4 w-4" />
          TikTok
        </TabsTrigger>
      </TabsList>
      {children}
    </Tabs>
  );
};

export default PlatformTabs;
