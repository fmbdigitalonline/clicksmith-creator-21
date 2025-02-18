
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Share2, Twitter, Facebook, Linkedin, Copy } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const Share = () => {
  const { toast } = useToast();
  const shareUrl = "https://yourdomain.com";
  const shareTexts = {
    twitter: "🚀 Transform your marketing with AI! I'm using this amazing tool to create high-converting ads in minutes. Save time and boost ROI with @AdWizard. Try it now!",
    facebook: "🎯 Game-changing AI tool alert! I've been using this incredible platform to create professional ads that actually convert. It's revolutionized my marketing workflow. Check it out and see the difference for yourself!",
    linkedin: "🔥 Excited to share this innovative AI-powered advertising platform that's transforming how businesses create ads. Perfect for marketers, entrepreneurs, and agencies looking to scale their ad creation process efficiently. #AI #DigitalMarketing #Innovation"
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
