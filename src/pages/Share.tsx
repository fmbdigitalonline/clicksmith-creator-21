
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Share2, Twitter, Facebook, Linkedin, Copy } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const Share = () => {
  const { toast } = useToast();
  const shareUrl = "https://yourdomain.com";
  const shareTexts = {
    twitter: "🎯 Validate your business idea before investing time and money! Using AI to test market fit in minutes. Save months of uncertainty with @Viable. Try it now!",
    facebook: "🚀 Found this game-changing platform that helps validate business ideas before investing! Test your concept with real market data and save months of uncertainty. Perfect for entrepreneurs and innovators looking to validate their next big idea.",
    linkedin: "💡 Excited to share this innovative platform that's transforming how entrepreneurs validate business ideas. Using AI to test market fit before investing time and resources. Perfect for founders who want to validate their concepts quickly and efficiently. #Entrepreneurship #Innovation #StartupValidation"
  };

  const handleShare = (platform: string) => {
    let url = "";
    switch (platform) {
      case "twitter":
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTexts.twitter)}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case "facebook":
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareTexts.facebook)}`;
        break;
      case "linkedin":
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}&summary=${encodeURIComponent(shareTexts.linkedin)}`;
        break;
    }
    window.open(url, "_blank");
  };

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: "Link copied!",
      description: "The link has been copied to your clipboard.",
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-6 flex items-center gap-2">
        <Share2 className="h-8 w-8 text-primary" />
        Share with Your Network
      </h1>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Share on Social Media</CardTitle>
            <CardDescription>Choose your preferred platform to share</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={() => handleShare("twitter")}
            >
              <Twitter className="h-5 w-5 text-[#1DA1F2]" />
              Share on Twitter
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={() => handleShare("facebook")}
            >
              <Facebook className="h-5 w-5 text-[#1877F2]" />
              Share on Facebook
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={() => handleShare("linkedin")}
            >
              <Linkedin className="h-5 w-5 text-[#0A66C2]" />
              Share on LinkedIn
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Direct Link</CardTitle>
            <CardDescription>Copy and share the link directly</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 p-2 border rounded-md bg-muted"
              />
              <Button onClick={copyLink}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Share;
