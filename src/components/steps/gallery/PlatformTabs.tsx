import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Linkedin } from "lucide-react";
import { SiTiktok } from "react-icons/si";

interface PlatformTabsProps {
  platform: string;
  onPlatformChange: (value: string) => void;
  children: React.ReactNode;
}

const PlatformTabs = ({ platform, onPlatformChange, children }: PlatformTabsProps) => {
  return (
    <Tabs defaultValue={platform} className="w-full" onValueChange={onPlatformChange}>
      <TabsList className="grid w-full grid-cols-4 mb-6">
        <TabsTrigger value="facebook">Facebook Ads</TabsTrigger>
        <TabsTrigger value="google">Google Ads</TabsTrigger>
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