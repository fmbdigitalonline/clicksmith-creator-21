import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types";
import { Card, CardContent } from "@/components/ui/card";
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
import { SavedAdCard } from "./SavedAdCard";
import { SavedAd, AdSize, FacebookAdSettings } from "@/types/campaignTypes";
import { useTranslation } from "react-i18next";

interface SavedAdsGalleryProps {
  projectId?: string;
  view?: "grid" | "table";
  allowSelection?: boolean;
  onAdsSelected?: (adIds: string[]) => void;
}

export function SavedAdsGallery({ 
  projectId, 
  view = "grid",
  allowSelection = false,
  onAdsSelected
}: SavedAdsGalleryProps) {
  const [savedAds, setSavedAds] = useState<SavedAd[]>([]);
  const [selectedAdIds, setSelectedAdIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState<string>("newest");
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { toast } = useToast();
  const { t } = useTranslation(["gallery", "common"]);
  const { projectId: currentProjectId } = useParams();

  // Force refresh when any ad's feedback or image is updated
  const handleFeedbackSubmit = useCallback(() => {
    console.log('Feedback submitted, refreshing ads');
    setRefreshTrigger(prev => prev + 1); // This will trigger a re-fetch
  }, []);

  useEffect(() => {
    fetchSavedAds();
  }, [projectId, searchTerm, sortOption, platformFilter, refreshTrigger]);

  const fetchSavedAds = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setIsLoading(false);
        return;
      }

      console.log('Fetching saved ads, refresh trigger:', refreshTrigger);

      let query = supabase
        .from('ad_feedback')
        .select('id, saved_images, headline, primary_text, rating, feedback, created_at, imageurl, imageUrl, platform, project_id, size, fb_ad_settings, storage_url')
        .eq('user_id', user.id);
      
      if (projectId) {
        query = query.eq('project_id', projectId);
      }
      
      if (searchTerm) {
        query = query.ilike('headline', `%${searchTerm}%`);
      }
      
      if (platformFilter !== 'all') {
        query = query.eq('platform', platformFilter);
      }
      
      switch (sortOption) {
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        case 'oldest':
          query = query.order('created_at', { ascending: true });
          break;
        case 'rating_high':
          query = query.order('rating', { ascending: false });
          break;
        case 'rating_low':
          query = query.order('rating', { ascending: true });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }
      
      const { data, error } = await query;

      if (error) throw error;

      const formattedAds: SavedAd[] = (data || []).map(ad => {
        let savedImages: string[] = [];
        
        if (ad.saved_images) {
          if (Array.isArray(ad.saved_images)) {
            savedImages = (ad.saved_images as Json[]).map(img => 
              typeof img === 'string' ? img : String(img)
            );
          } else if (typeof ad.saved_images === 'string') {
            savedImages = [ad.saved_images];
          }
        }
        
        let sizeObj: AdSize = { width: 1200, height: 628, label: "Default" };
        if (ad.size) {
          if (typeof ad.size === 'object' && ad.size !== null) {
            const sizeData = ad.size as Record<string, Json>;
            
            sizeObj = {
              width: typeof sizeData.width === 'number' ? sizeData.width : 1200,
              height: typeof sizeData.height === 'number' ? sizeData.height : 628,
              label: typeof sizeData.label === 'string' ? sizeData.label : "Default"
            };
          }
        }

        let fbAdSettings: FacebookAdSettings | undefined = undefined;
        if (ad.fb_ad_settings) {
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

      const uniqueImageUrls = new Set<string>();
      const uniqueAds = formattedAds.filter(ad => {
        const imageUrl = ad.imageUrl || ad.imageurl || (ad.saved_images && ad.saved_images[0]) || ad.storage_url;
        
        if (!imageUrl || uniqueImageUrls.has(imageUrl)) {
          return false;
        }
        
        uniqueImageUrls.add(imageUrl);
        return true;
      });

      setSavedAds(uniqueAds);
    } catch (error) {
      console.error('Error fetching saved ads:', error);
      toast({
        title: t("error", { ns: "common" }),
        description: t("load_error"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdSelect = (adId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedAdIds(prev => [...prev, adId]);
    } else {
      setSelectedAdIds(prev => prev.filter(id => id !== adId));
    }
    if (onAdsSelected) {
      onAdsSelected(isSelected ? [...selectedAdIds, adId] : selectedAdIds.filter(id => id !== adId));
    }
  };

  const handleSelectAll = () => {
    if (selectedAdIds.length === savedAds.length) {
      setSelectedAdIds([]);
      if (onAdsSelected) {
        onAdsSelected([]);
      }
    } else {
      const allAdIds = savedAds.map(ad => ad.id);
      setSelectedAdIds(allAdIds);
      if (onAdsSelected) {
        onAdsSelected(allAdIds);
      }
    }
  };

  const filteredAds = savedAds.filter(ad => {
    const matchesSearch = searchTerm === "" || 
      (ad.headline?.toLowerCase().includes(searchTerm.toLowerCase()) || 
       ad.primary_text?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesPlatform = platformFilter === "all" || ad.platform === platformFilter;
    
    return matchesSearch && matchesPlatform;
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">{t("loading.saved_ads", { ns: "dashboard" })}</p>
      </div>
    );
  }

  if (savedAds.length === 0) {
    return (
      <div className="text-center py-8 border rounded-lg bg-gray-50">
        <p className="text-lg font-medium mb-2">{t("empty_state")}</p>
        {currentProjectId && (
          <p className="text-muted-foreground">
            {t("project.not_assigned")}
            <Link to="/gallery/saved" className="ml-1 text-blue-500 hover:underline">
              {t("project.go_to_gallery")}
            </Link>
          </p>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border">
        <div className="flex items-center">
          {allowSelection && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              className="mr-4"
            >
              {selectedAdIds.length === savedAds.length ? (
                <>
                  <CheckSquare className="h-4 w-4 mr-2" />
                  {t("deselect_all")}
                </>
              ) : (
                <>
                  <Square className="h-4 w-4 mr-2" />
                  {t("select_all")}
                </>
              )}
            </Button>
          )}
          <Input
            placeholder={t("filters.search")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-xs mr-4"
          />
          <Select value={sortOption} onValueChange={setSortOption}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t("sort.newest")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">{t("sort.newest")}</SelectItem>
              <SelectItem value="oldest">{t("sort.oldest")}</SelectItem>
              <SelectItem value="rating_high">{t("sort.rating_high")}</SelectItem>
              <SelectItem value="rating_low">{t("sort.rating_low")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center">
          <Select value={platformFilter} onValueChange={setPlatformFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t("filters.all_platforms")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("filters.all_platforms")}</SelectItem>
              <SelectItem value="facebook">{t("filters.facebook")}</SelectItem>
              <SelectItem value="instagram">{t("filters.instagram")}</SelectItem>
              <SelectItem value="google">{t("filters.google")}</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="ghost" size="icon" className="ml-2">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {view === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAds.map((ad) => (
            <SavedAdCard 
              key={ad.id}
              id={ad.id}
              primaryText={ad.primary_text}
              headline={ad.headline}
              imageUrl={ad.imageUrl || (ad.saved_images && ad.saved_images[0])}
              storage_url={ad.storage_url}
              image_status={ad.image_status}
              onFeedbackSubmit={handleFeedbackSubmit}
              platform={ad.platform}
              size={ad.size}
              projectId={ad.project_id}
              selected={selectedAdIds.includes(ad.id)}
              onSelect={allowSelection ? handleAdSelect : undefined}
              selectable={allowSelection}
              fb_ad_settings={ad.fb_ad_settings}
            />
          ))}
        </div>
      ) : (
        <div>Table View</div>
      )}
    </div>
  );
}
