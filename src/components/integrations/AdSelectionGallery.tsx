import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types";
import { Card, CardContent } from "@/components/ui/card";
import { SavedAdCard } from "@/components/gallery/components/SavedAdCard";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, CheckSquare, Square, Filter, LayoutGrid, MapPin, Facebook } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SavedAd, AdSelectionGalleryProps, AdSize, FacebookAdSettings } from "@/types/campaignTypes";
import { AD_FORMATS } from "@/components/steps/gallery/components/AdSizeSelector";

export default function AdSelectionGallery({ 
  projectId, 
  onAdsSelected, 
  selectedAdIds = [],
  maxSelection = 5
}: AdSelectionGalleryProps) {
  const [savedAds, setSavedAds] = useState<SavedAd[]>([]);
  const [selectedAds, setSelectedAds] = useState<string[]>(selectedAdIds);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [formatFilter, setFormatFilter] = useState<string>("all");
  const [projectUrl, setProjectUrl] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    fetchSavedAds();
    if (projectId) {
      fetchProjectUrl();
    }
  }, [projectId]);

  // Update internal state when external selection changes
  useEffect(() => {
    setSelectedAds(selectedAdIds);
  }, [selectedAdIds]);

  const fetchProjectUrl = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, title')
        .eq('id', projectId)
        .single();
        
      if (error) throw error;
      
      if (data) {
        const formattedUrl = `https://lovable.dev/projects/${data.id}`;
        setProjectUrl(formattedUrl);
      }
    } catch (error) {
      console.error('Error fetching project details:', error);
    }
  };

  const fetchSavedAds = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setIsLoading(false);
        return;
      }

      let query = supabase
        .from('ad_feedback')
        .select('id, saved_images, headline, primary_text, rating, feedback, created_at, imageurl, imageUrl, platform, project_id, size, fb_ad_settings, storage_url');
      
      // If projectId is provided, only show ads for that project
      if (projectId) {
        query = query.eq('project_id', projectId);
      }
      
      const { data, error } = await query
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Convert database response to SavedAd type with proper type handling
      const formattedAds: SavedAd[] = (data || []).map(ad => {
        // Handle the saved_images field which could be a variety of types
        let savedImages: string[] = [];
        
        if (ad.saved_images) {
          if (Array.isArray(ad.saved_images)) {
            // Try to convert each item to string if possible
            savedImages = (ad.saved_images as Json[]).map(img => 
              typeof img === 'string' ? img : String(img)
            );
          } else if (typeof ad.saved_images === 'string') {
            savedImages = [ad.saved_images];
          }
        }
        
        // Handle the size field which is JSON
        let sizeObj: AdSize = { width: 1200, height: 628, label: "Default" };
        if (ad.size) {
          // First ensure we're dealing with an object
          if (typeof ad.size === 'object' && ad.size !== null) {
            const sizeData = ad.size as Record<string, Json>;
            
            // Now we can safely access properties with type checking
            sizeObj = {
              width: typeof sizeData.width === 'number' ? sizeData.width : 1200,
              height: typeof sizeData.height === 'number' ? sizeData.height : 628,
              label: typeof sizeData.label === 'string' ? sizeData.label : "Default"
            };
          }
        }

        // Handle Facebook ad settings
        let fbAdSettings: FacebookAdSettings | undefined = undefined;
        if (ad.fb_ad_settings) {
          // Create a proper FacebookAdSettings object with required fields
          const fbSettings = ad.fb_ad_settings as Record<string, unknown>;
          fbAdSettings = {
            website_url: typeof fbSettings.website_url === 'string' ? fbSettings.website_url : "",
            visible_link: typeof fbSettings.visible_link === 'string' ? fbSettings.visible_link : "",
            call_to_action: typeof fbSettings.call_to_action === 'string' ? fbSettings.call_to_action : "LEARN_MORE",
            ad_language: typeof fbSettings.ad_language === 'string' ? fbSettings.ad_language : "en_US",
            url_parameters: typeof fbSettings.url_parameters === 'string' ? fbSettings.url_parameters : "",
            browser_addon: typeof fbSettings.browser_addon === 'string' ? fbSettings.browser_addon : "",
          };
        }
        
        return {
          ...ad,
          saved_images: savedImages,
          size: sizeObj,
          fb_ad_settings: fbAdSettings
        };
      });

      setSavedAds(formattedAds);
    } catch (error) {
      console.error('Error fetching saved ads:', error);
      toast({
        title: "Error",
        description: "Failed to load saved ads. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdSelect = (adId: string, isSelected: boolean) => {
    if (isSelected) {
      // Check if we've hit the selection limit
      if (selectedAds.length >= maxSelection) {
        toast({
          title: "Selection limit reached",
          description: `You can select a maximum of ${maxSelection} ads.`,
        });
        return;
      }
      setSelectedAds(prev => [...prev, adId]);
    } else {
      setSelectedAds(prev => prev.filter(id => id !== adId));
    }
  };

  // Handle Facebook ad settings saved
  const handleAdSettingsSaved = async (settings: FacebookAdSettings, adId: string, applyToAll: boolean = false) => {
    try {
      if (applyToAll) {
        // Apply to all selected ads
        const adsToUpdate = applyToAll ? selectedAdIds : [adId];
        
        for (const id of adsToUpdate) {
          await supabase
            .from('ad_feedback')
            .update({ fb_ad_settings: settings as unknown as Json })
            .eq('id', id);
        }
        
        // Update local state
        setSavedAds(prevAds => 
          prevAds.map(ad => 
            (applyToAll && selectedAdIds.includes(ad.id)) || ad.id === adId
              ? { ...ad, fb_ad_settings: settings }
              : ad
          )
        );
        
        toast({
          title: "Settings Applied",
          description: `Facebook ad settings applied to ${adsToUpdate.length} ads.`,
        });
      } else {
        // Update just this ad
        await supabase
          .from('ad_feedback')
          .update({ fb_ad_settings: settings as unknown as Json })
          .eq('id', adId);
          
        // Update local state
        setSavedAds(prevAds => 
          prevAds.map(ad => 
            ad.id === adId ? { ...ad, fb_ad_settings: settings } : ad
          )
        );
      }
      
      // Refresh the ads to ensure everything is up to date
      await fetchSavedAds();
      
    } catch (error) {
      console.error('Error saving ad settings:', error);
      toast({
        title: "Error",
        description: "Failed to save ad settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    // Notify parent component when selection changes
    onAdsSelected(selectedAds);
  }, [selectedAds, onAdsSelected]);

  const handleSelectAll = () => {
    // Either select all (up to max) or deselect all
    if (selectedAds.length > 0) {
      setSelectedAds([]);
    } else {
      const filteredAds = getFilteredAds();
      const adsToSelect = filteredAds.slice(0, maxSelection).map(ad => ad.id);
      setSelectedAds(adsToSelect);
      
      if (filteredAds.length > maxSelection) {
        toast({
          title: "Selection limit applied",
          description: `Selected first ${maxSelection} ads (maximum allowed).`,
        });
      }
    }
  };

  const getFilteredAds = () => {
    return savedAds.filter(ad => {
      // Apply search filter
      const matchesSearch = searchTerm === "" || 
        (ad.headline?.toLowerCase().includes(searchTerm.toLowerCase()) || 
         ad.primary_text?.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Apply rating filter
      const matchesRating = ratingFilter === "all" || 
        (ad.rating && ad.rating >= parseInt(ratingFilter));
      
      // Apply format/size filter
      const matchesFormat = formatFilter === "all" || 
        (ad.size && formatLabelToString(ad.size) === formatFilter);
      
      return matchesSearch && matchesRating && matchesFormat;
    });
  };

  // Helper to convert size object to string representation for filtering
  const formatLabelToString = (size: AdSize): string => {
    return `${size.width}x${size.height}`;
  };

  // Get unique formats from available ads
  const getUniqueFormats = (): {value: string, label: string}[] => {
    const formatMap = new Map<string, AdSize>();
    
    savedAds.forEach(ad => {
      if (ad.size) {
        const formatKey = formatLabelToString(ad.size);
        if (!formatMap.has(formatKey)) {
          formatMap.set(formatKey, ad.size);
        }
      }
    });
    
    // Convert map to array of format options
    return Array.from(formatMap.entries()).map(([value, size]) => ({
      value,
      label: size.label || `${size.width}x${size.height}`
    }));
  };

  const filteredAds = getFilteredAds();
  const uniqueFormats = getUniqueFormats();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading your saved ads...</p>
      </div>
    );
  }

  if (savedAds.length === 0) {
    return (
      <div className="text-center py-8 border rounded-lg bg-gray-50">
        <p className="text-lg font-medium mb-2">No saved ads found</p>
        <p className="text-muted-foreground mb-4">
          You need to create and save some ads before you can use them in campaigns.
        </p>
        <Button 
          variant="outline"
          onClick={() => window.location.href = "/gallery/saved"}
        >
          Go to Saved Ads Gallery
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters and Selection Controls */}
      <div className="p-4 bg-gray-50 rounded-lg border flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-wrap gap-3 items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSelectAll}
            className="flex items-center"
          >
            {selectedAds.length > 0 ? (
              <>
                <CheckSquare className="h-4 w-4 mr-2" />
                Deselect All
              </>
            ) : (
              <>
                <Square className="h-4 w-4 mr-2" />
                Select All
              </>
            )}
          </Button>
          
          {selectedAds.length > 0 && (
            <Badge variant="secondary" className="px-2 py-1">
              {selectedAds.length} of {maxSelection} selected
            </Badge>
          )}
        </div>
        
        <div className="flex flex-wrap gap-3 items-center">
          <div className="w-full sm:w-auto">
            <Input
              placeholder="Search ads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Label htmlFor="rating-filter" className="whitespace-nowrap text-sm">
              Min Rating:
            </Label>
            <Select
              value={ratingFilter}
              onValueChange={setRatingFilter}
            >
              <SelectTrigger id="rating-filter" className="w-24 h-9">
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any</SelectItem>
                <SelectItem value="3">★★★+</SelectItem>
                <SelectItem value="4">★★★★+</SelectItem>
                <SelectItem value="5">★★★★★</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Format/Size Filter */}
          <div className="flex items-center gap-2">
            <Label htmlFor="format-filter" className="whitespace-nowrap text-sm">
              Format:
            </Label>
            <Select
              value={formatFilter}
              onValueChange={setFormatFilter}
            >
              <SelectTrigger id="format-filter" className="w-40 h-9">
                <SelectValue placeholder="Any format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Formats</SelectItem>
                {uniqueFormats.map(format => (
                  <SelectItem key={format.value} value={format.value}>
                    {format.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      {/* Removed FacebookAdSettingsPanel from here */}
      
      {/* No results after filtering */}
      {filteredAds.length === 0 && (
        <div className="text-center py-6 border rounded-lg">
          <p className="text-muted-foreground">No ads match your filters</p>
        </div>
      )}
      
      {/* Selected Ads Preview Section */}
      {selectedAds.length > 0 && (
        <div className="border rounded-lg p-4 bg-blue-50/50">
          <h3 className="text-lg font-medium mb-3 flex items-center">
            <CheckSquare className="mr-2 h-5 w-5" />
            Selected Ads Preview
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {selectedAds.map(adId => {
              const ad = savedAds.find(a => a.id === adId);
              if (!ad) return null;
              
              return (
                <div 
                  key={ad.id} 
                  className="relative border rounded-md p-2 bg-white shadow-sm cursor-pointer"
                  onClick={() => handleAdSelect(ad.id, false)}
                >
                  {/* Image */}
                  <div 
                    style={{ 
                      aspectRatio: ad.size ? `${ad.size.width} / ${ad.size.height}` : "1.91 / 1",
                    }} 
                    className="overflow-hidden rounded mb-1"
                  >
                    <img
                      src={ad.imageUrl || ad.imageurl || (ad.saved_images && ad.saved_images[0])}
                      alt={ad.headline || "Ad creative"}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  
                  {/* Size Badge */}
                  {ad.size && (
                    <div className="absolute top-1 right-1 bg-black/70 text-white text-xs rounded px-1 py-0.5 flex items-center">
                      <LayoutGrid className="h-3 w-3 mr-1" />
                      {ad.size.label}
                    </div>
                  )}
                  
                  {/* Headline (truncated) */}
                  <p className="text-xs font-medium truncate">{ad.headline}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Ads Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAds.map((ad) => (
          <SavedAdCard 
            key={ad.id}
            id={ad.id}
            primaryText={ad.primary_text}
            headline={ad.headline}
            imageUrl={ad.imageUrl || ad.imageurl || (ad.saved_images && ad.saved_images[0])}
            storage_url={ad.storage_url}
            image_status={ad.image_status}
            onFeedbackSubmit={fetchSavedAds}
            platform={ad.platform}
            size={ad.size}
            projectId={ad.project_id}
            selected={selectedAdIds.includes(ad.id)}
            onSelect={handleAdSelect}
            selectable={true}
            fb_ad_settings={ad.fb_ad_settings}
            projectUrl={projectUrl}
            onSettingsSaved={handleAdSettingsSaved}
          />
        ))}
      </div>
    </div>
  );
}
