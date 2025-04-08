
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types";
import { SavedAdCard } from "./components/SavedAdCard";
import { EmptyState } from "./components/EmptyState";
import { Loader2, SquareCheckIcon, CheckSquare, Image, AlertCircle, Grid, Table as TableIcon, ViewIcon, Search } from "lucide-react";
import { AD_FORMATS } from "@/components/steps/gallery/components/AdSizeSelector";
import { Button } from "@/components/ui/button";
import { ProjectSelector } from "./components/ProjectSelector";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SavedAdsTable } from "./components/SavedAdsTable";
import { Pagination } from "@/components/ui/pagination";
import { useTranslation } from "react-i18next";

interface SavedAd {
  id: string;
  saved_images: string[];
  headline?: string;
  primary_text?: string;
  rating: number;
  feedback: string;
  created_at: string;
  imageurl?: string;
  imageUrl?: string;
  platform?: string;
  project_id?: string;
  size?: {
    width: number;
    height: number;
    label: string;
  };
}

interface AdFeedbackRow {
  id: string;
  saved_images: Json;
  headline?: string;
  primary_text?: string;
  rating: number;
  feedback: string;
  created_at: string;
  imageurl?: string;
  imageUrl?: string;
  platform?: string;
  project_id?: string;
  size?: Json;
}

interface SavedAdsGalleryProps {
  projectFilter?: string;
}

export const SavedAdsGallery = ({ projectFilter }: SavedAdsGalleryProps) => {
  const [savedAds, setSavedAds] = useState<SavedAd[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAdIds, setSelectedAdIds] = useState<string[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [isAssigning, setIsAssigning] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [view, setView] = useState<"grid" | "table">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 12;
  const { toast } = useToast();
  const { t } = useTranslation(["gallery", "common", "dashboard"]);

  const fetchSavedAds = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      let query = supabase
        .from('ad_feedback')
        .select('id, saved_images, headline, primary_text, rating, feedback, created_at, imageurl, imageUrl, platform, project_id, size')
        .eq('user_id', user.id);
      
      if (projectFilter) {
        query = query.eq('project_id', projectFilter);
        console.log("Filtering ads for project:", projectFilter);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      const defaultFormat = AD_FORMATS.find(format => format.width === 1080 && format.height === 1080) || AD_FORMATS[0];

      const uniqueAdsMap = new Map();
      
      (data as AdFeedbackRow[] || []).forEach(ad => {
        const imageUrls = [
          ad.imageurl,
          ad.imageUrl,
          ...(Array.isArray(ad.saved_images) ? ad.saved_images as string[] : 
             typeof ad.saved_images === 'string' ? [ad.saved_images as string] : [])
        ].filter(Boolean);
        
        const primaryImageUrl = imageUrls[0];
        
        if (primaryImageUrl && !uniqueAdsMap.has(primaryImageUrl)) {
          uniqueAdsMap.set(primaryImageUrl, {
            ...ad,
            saved_images: Array.isArray(ad.saved_images) 
              ? (ad.saved_images as string[])
              : typeof ad.saved_images === 'string'
                ? [ad.saved_images as string]
                : [],
            platform: ad.platform || 'facebook',
            size: ad.size 
              ? (ad.size as { width: number; height: number; label: string }) 
              : defaultFormat
          });
        }
      });
      
      const convertedAds = Array.from(uniqueAdsMap.values());

      console.log("Fetched ads count:", data?.length, "Unique ads count:", convertedAds.length);
      setSavedAds(convertedAds);
      setTotalPages(Math.ceil(convertedAds.length / itemsPerPage));
    } catch (error) {
      console.error('Error fetching saved ads:', error);
      toast({
        title: t("error"),
        description: t("load_error"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSavedAds();
  }, [projectFilter]);

  const handleAdSelect = (adId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedAdIds(prev => [...prev, adId]);
    } else {
      setSelectedAdIds(prev => prev.filter(id => id !== adId));
    }
  };

  const handleSelectAll = () => {
    if (selectedAdIds.length === filteredAds.length) {
      setSelectedAdIds([]);
    } else {
      setSelectedAdIds(filteredAds.map(ad => ad.id));
    }
  };

  const handleProjectSelect = (projectId: string) => {
    console.log("Project selected:", projectId);
    setSelectedProjectId(projectId);
    
    if (projectId) {
      toast({
        title: t("project.selected", { ns: "projects" }),
        description: t("project.selected_success", "Project has been selected successfully", { ns: "projects" }),
        variant: "default",
      });
    }
  };

  const handleAssignToProject = async () => {
    setIsAssigning(true);
    try {
      if (!selectedProjectId || selectedAdIds.length === 0) {
        toast({
          title: t("errors.title", { ns: "common" }),
          description: t("errors.required_field", { ns: "common" }),
          variant: "destructive",
        });
        return;
      }

      console.log("Assigning ads to project:", selectedProjectId, "Ads:", selectedAdIds);

      for (const adId of selectedAdIds) {
        const { error } = await supabase
          .from('ad_feedback')
          .update({ 
            project_id: selectedProjectId 
          })
          .eq('id', adId)
          .is('project_id', null);
          
        if (error) {
          console.error("Error assigning to project:", error);
          throw error;
        }
      }

      toast({
        title: t("saved", { ns: "common" }),
        description: t("confirm_add.success", "{count} ad(s) assigned to project successfully", { count: selectedAdIds.length }),
      });
      
      await fetchSavedAds();
      setSelectedAdIds([]);
      setIsConfirmDialogOpen(false);
    } catch (error) {
      console.error('Error assigning ads to project:', error);
      toast({
        title: t("error"),
        description: t("errors.occurred", { ns: "common" }),
        variant: "destructive",
      });
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRemoveFromProject = async () => {
    setIsAssigning(true);
    try {
      if (selectedAdIds.length === 0) {
        toast({
          title: t("errors.title", { ns: "common" }),
          description: t("errors.required_field", { ns: "common" }),
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('ad_feedback')
        .update({ project_id: null })
        .in('id', selectedAdIds);

      if (error) throw error;

      toast({
        title: t("saved", { ns: "common" }),
        description: t("confirm_remove.success", "{count} ad(s) removed from project successfully", { count: selectedAdIds.length }),
      });
      fetchSavedAds();
      setSelectedAdIds([]);
      setIsConfirmDialogOpen(false);
    } catch (error) {
      console.error('Error removing ads from project:', error);
      toast({
        title: t("error"),
        description: t("errors.occurred", { ns: "common" }),
        variant: "destructive",
      });
    } finally {
      setIsAssigning(false);
    }
  };

  const filteredAds = savedAds.filter(ad => {
    const matchesSearch = 
      (ad.headline?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
      (ad.primary_text?.toLowerCase().includes(searchQuery.toLowerCase()) || false);
    
    const matchesPlatform = platformFilter === 'all' || ad.platform === platformFilter;
    
    return matchesSearch && matchesPlatform;
  }).sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    } else if (sortBy === 'oldest') {
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    } else if (sortBy === 'rating-high') {
      return b.rating - a.rating;
    } else if (sortBy === 'rating-low') {
      return a.rating - b.rating;
    }
    return 0;
  });

  const paginatedAds = filteredAds.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setTotalPages(Math.max(1, Math.ceil(filteredAds.length / itemsPerPage)));
    setCurrentPage(1);
  }, [filteredAds.length, itemsPerPage]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-facebook mb-4" />
        <p className="text-gray-600">{t("loading.saved_ads", { ns: "dashboard" })}</p>
        <p className="text-sm text-gray-500">{t("loading.please_wait", { ns: "common" })}</p>
      </div>
    );
  }

  if (savedAds.length === 0) {
    if (projectFilter) {
      return (
        <div className="py-8 text-center">
          <p className="text-muted-foreground">{t("project.not_assigned")}</p>
          <p className="mt-2">
            <Button 
              variant="link" 
              onClick={() => window.location.href = "/gallery/saved"}
            >
              {t("project.go_to_gallery")}
            </Button>
          </p>
        </div>
      );
    }
    return <EmptyState />;
  }

  const hasProjectAssigned = selectedAdIds.some(id => 
    savedAds.find(ad => ad.id === id)?.project_id !== undefined
  );

  const showActionBar = !projectFilter;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 bg-gray-50 p-4 rounded-lg shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex items-center space-x-2">
            <Button
              variant={view === "grid" ? "default" : "outline"}
              size="sm"
              onClick={() => setView("grid")}
              className="flex items-center"
            >
              <Grid className="h-4 w-4 mr-2" />
              {t("view.grid")}
            </Button>
            <Button
              variant={view === "table" ? "default" : "outline"}
              size="sm"
              onClick={() => setView("table")}
              className="flex items-center"
            >
              <TableIcon className="h-4 w-4 mr-2" />
              {t("view.table")}
            </Button>
          </div>
          
          <div className="flex items-center space-x-2">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t("sort.newest")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">{t("sort.newest")}</SelectItem>
                <SelectItem value="oldest">{t("sort.oldest")}</SelectItem>
                <SelectItem value="rating-high">{t("sort.rating_high")}</SelectItem>
                <SelectItem value="rating-low">{t("sort.rating_low")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={t("filters.search")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          
          <Select value={platformFilter} onValueChange={setPlatformFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder={t("filters.platform")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("filters.all_platforms")}</SelectItem>
              <SelectItem value="facebook">{t("filters.facebook")}</SelectItem>
              <SelectItem value="instagram">{t("filters.instagram")}</SelectItem>
              <SelectItem value="google">{t("filters.google")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              className="flex items-center"
            >
              {selectedAdIds.length === filteredAds.length ? (
                <>
                  <CheckSquare className="h-4 w-4 mr-2" />
                  {t("deselect_all")}
                </>
              ) : (
                <>
                  <SquareCheckIcon className="h-4 w-4 mr-2" />
                  {t("select_all")}
                </>
              )}
            </Button>
            {selectedAdIds.length > 0 && (
              <Badge variant="secondary">
                {t("selected", { count: selectedAdIds.length })}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
            <div className="w-full sm:w-64 relative" style={{ zIndex: 60 }}>
              <ProjectSelector
                selectedProjectId={selectedProjectId}
                onSelect={handleProjectSelect}
              />
            </div>
            
            <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="default" 
                  disabled={selectedAdIds.length === 0 || !selectedProjectId || isAssigning}
                  className="whitespace-nowrap"
                  onClick={() => {
                    if (selectedAdIds.length > 0 && selectedProjectId) {
                      setIsConfirmDialogOpen(true);
                    }
                  }}
                >
                  {isAssigning ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  {t("add_to_project")}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("confirm_add.title")}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t("confirm_add.description", { count: selectedAdIds.length })}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t("cancel", { ns: "common" })}</AlertDialogCancel>
                  <AlertDialogAction onClick={handleAssignToProject}>{t("continue", { ns: "common" })}</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            
            {hasProjectAssigned && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    disabled={selectedAdIds.length === 0 || isAssigning}
                    className="whitespace-nowrap"
                  >
                    {t("remove_from_project")}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t("confirm_remove.title")}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t("confirm_remove.description", { count: selectedAdIds.length })}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t("cancel", { ns: "common" })}</AlertDialogCancel>
                    <AlertDialogAction onClick={handleRemoveFromProject}>{t("continue", { ns: "common" })}</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <Badge variant="outline" className="bg-gray-50">
          {t("stats.ads_found", { count: filteredAds.length })}
        </Badge>
        
        {searchQuery && (
          <Badge 
            variant="secondary" 
            className="flex items-center gap-1"
          >
            {t("stats.search", { query: searchQuery })}
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-4 w-4 p-0 ml-1" 
              onClick={() => setSearchQuery("")}
            >
              ×
            </Button>
          </Badge>
        )}
        
        {platformFilter !== 'all' && (
          <Badge 
            variant="secondary" 
            className="flex items-center gap-1"
          >
            {t("stats.platform", { platform: platformFilter })}
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-4 w-4 p-0 ml-1" 
              onClick={() => setPlatformFilter("all")}
            >
              ×
            </Button>
          </Badge>
        )}
      </div>

      {projectFilter && (
        <div className="mb-4">
          <Badge variant="outline" className="text-sm font-normal">
            {t("project.selected")}
          </Badge>
        </div>
      )}

      {filteredAds.length === 0 && (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <AlertCircle className="mx-auto h-8 w-8 text-gray-400 mb-2" />
          <h3 className="text-lg font-medium text-gray-900">{t("no_results.title")}</h3>
          <p className="mt-1 text-sm text-gray-500">
            {t("no_results.description")}
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-4"
            onClick={() => {
              setSearchQuery("");
              setPlatformFilter("all");
              setSortBy("newest");
            }}
          >
            {t("no_results.clear_filters")}
          </Button>
        </div>
      )}

      {filteredAds.length > 0 && (
        <>
          {view === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedAds.map((ad) => (
                <SavedAdCard
                  key={ad.id}
                  id={ad.id}
                  primaryText={ad.primary_text}
                  headline={ad.headline}
                  imageUrl={ad.imageUrl || ad.imageurl || ad.saved_images[0]}
                  platform={ad.platform}
                  size={ad.size}
                  projectId={ad.project_id}
                  onFeedbackSubmit={fetchSavedAds}
                  selectable={!projectFilter}
                  selected={selectedAdIds.includes(ad.id)}
                  onSelect={handleAdSelect}
                />
              ))}
            </div>
          ) : (
            <SavedAdsTable 
              ads={paginatedAds}
              selectedAdIds={selectedAdIds}
              onAdSelect={handleAdSelect}
              onSelectAll={handleSelectAll}
              selectable={!projectFilter}
              onFeedbackSubmit={fetchSavedAds}
            />
          )}

          {totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <Pagination
                totalPages={totalPages}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};
