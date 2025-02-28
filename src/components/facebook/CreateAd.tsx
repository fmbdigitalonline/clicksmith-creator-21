
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { facebookAdsService, FacebookCreativeData } from "@/services/facebookAdsService";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Image as ImageIcon, Loader2 } from "lucide-react";
import FacebookConnect from "./FacebookConnect";

interface CreateAdProps {
  projectId: string;
  adsetId: string;
  onSuccess?: (adId: string) => void;
  generatedAd?: any;
}

const CALL_TO_ACTIONS = [
  { value: "LEARN_MORE", label: "Learn More" },
  { value: "SHOP_NOW", label: "Shop Now" },
  { value: "SIGN_UP", label: "Sign Up" },
  { value: "BOOK_TRAVEL", label: "Book Now" },
  { value: "DOWNLOAD", label: "Download" },
];

const CreateAd = ({ projectId, adsetId, onSuccess, generatedAd }: CreateAdProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [pages, setPages] = useState<any[]>([]);
  const [formData, setFormData] = useState<Partial<FacebookCreativeData>>({
    name: "",
    pageId: "",
    primaryText: "",
    headline: "",
    description: "",
    websiteUrl: "",
    imageUrl: "",
    callToAction: "LEARN_MORE",
    status: "PAUSED",
  });
  const { toast } = useToast();

  useEffect(() => {
    checkConnection();
    fetchPages();
    
    // Populate form with generated ad data if available
    if (generatedAd) {
      setFormData(prev => ({
        ...prev,
        name: generatedAd.headline || "New Ad",
        primaryText: generatedAd.primary_text || generatedAd.content || "",
        headline: generatedAd.headline || "",
        description: generatedAd.description || "",
        imageUrl: generatedAd.imageUrl || generatedAd.image_url || "",
      }));
    }
  }, [generatedAd]);

  const checkConnection = async () => {
    try {
      setIsLoading(true);
      const connections = await facebookAdsService.getConnections();
      setIsConnected(Array.isArray(connections) && connections.length > 0);
    } catch (error) {
      console.error("Error checking Facebook connection:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPages = async () => {
    // This would normally fetch pages from Facebook
    // For now we'll use a placeholder
    setPages([{ id: "123456789", name: "Your Facebook Page" }]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.pageId) {
      toast({
        title: "Page required",
        description: "Please select a Facebook page for your ad",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsCreating(true);
      
      const result = await facebookAdsService.createAd(
        projectId, 
        adsetId, 
        formData as FacebookCreativeData
      );
      
      toast({
        title: "Ad created!",
        description: "Your Facebook ad has been created successfully.",
      });
      
      if (onSuccess && result.ad && result.ad.id) {
        onSuccess(result.ad.id);
      }
    } catch (error) {
      console.error("Error creating Facebook ad:", error);
      toast({
        title: "Ad creation failed",
        description: error instanceof Error ? error.message : "Failed to create ad",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-facebook" />
      </div>
    );
  }

  if (!isConnected) {
    return <FacebookConnect onConnected={() => setIsConnected(true)} />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Facebook Ad</CardTitle>
        <CardDescription>
          Create an ad using your generated content
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Ad Name</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter ad name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pageId">Facebook Page</Label>
            <Select
              value={formData.pageId}
              onValueChange={(value) => handleSelectChange("pageId", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a page" />
              </SelectTrigger>
              <SelectContent>
                {pages.map((page) => (
                  <SelectItem key={page.id} value={page.id}>
                    {page.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="websiteUrl">Website URL</Label>
            <Input
              id="websiteUrl"
              name="websiteUrl"
              value={formData.websiteUrl}
              onChange={handleInputChange}
              placeholder="https://yourwebsite.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="headline">Headline</Label>
            <Input
              id="headline"
              name="headline"
              value={formData.headline}
              onChange={handleInputChange}
              placeholder="Enter headline"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="primaryText">Primary Text</Label>
            <Textarea
              id="primaryText"
              name="primaryText"
              value={formData.primaryText}
              onChange={handleInputChange}
              placeholder="Enter primary text"
              required
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Enter description"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="imageUrl">Image URL</Label>
            <Input
              id="imageUrl"
              name="imageUrl"
              value={formData.imageUrl}
              onChange={handleInputChange}
              placeholder="https://example.com/image.jpg"
            />
            {formData.imageUrl && (
              <div className="mt-2 border rounded-md p-2 relative">
                <img 
                  src={formData.imageUrl} 
                  alt="Ad preview" 
                  className="w-full h-32 object-cover rounded"
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="callToAction">Call to Action</Label>
            <Select
              value={formData.callToAction}
              onValueChange={(value) => handleSelectChange("callToAction", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a call to action" />
              </SelectTrigger>
              <SelectContent>
                {CALL_TO_ACTIONS.map((cta) => (
                  <SelectItem key={cta.value} value={cta.value}>
                    {cta.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </form>
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleSubmit}
          disabled={isCreating}
          className="w-full bg-facebook hover:bg-facebook/90 text-white"
        >
          {isCreating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Ad...
            </>
          ) : (
            <>
              Create Ad
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CreateAd;
