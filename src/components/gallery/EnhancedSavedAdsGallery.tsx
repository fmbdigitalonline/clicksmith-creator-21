import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, LayoutGrid, Table as TableIcon, PenLine, Calendar, 
  Filter, Search, CheckSquare, Square, Trash2, Copy, FolderOpen,
  Download, Share2, ArrowUpWideNarrow, ArrowDownWideNarrow } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { SavedAdCard } from "./components/SavedAdCard";
import { SavedAdsTable } from "./components/SavedAdsTable";
import { EmptyState } from "./components/EmptyState";
import { ProjectSelector } from "./components/ProjectSelector";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, 
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter, 
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useTranslation } from "react-i18next";
import { Pagination } from "@/components/ui/pagination";
import { SavedAd, AdSize } from "@/types/campaignTypes";

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
  storage_url?: string;
  image_status?: string;
  platform?: string;
  project_id?: string;
  size?: Json;
  media_type?: string;
}

interface EnhancedSavedAdsGalleryProps {
  projectFilter?: string;
}

export const EnhancedSavedAdsGallery = ({ projectFilter }: EnhancedSavedAdsGalleryProps) => {
  // State management
  const [savedAds, setSavedAds] = useState<SavedAd[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAdIds, setSelectedAdIds] = useState<string[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [isAssigning, setIsAssigning] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [view, setView] = useState<"grid" | "table">("grid");
  const [activeTab, setActiveTab] = useState<"all" | "images" | "videos" | "projects">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [mediaTypeFilter, setMediaTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [batchActionOpen, setBatchActionOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState<string | null>(null);
  
  const itemsPerPage = 12;
  const { toast } = useToast();
  const { t } = useTranslation(["gallery", "common", "dashboard"]);

  // Fetch ads from Supabase
  const fetchSavedAds = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      console.log('Fetching saved ads for user:', user.id, projectFilter ? `with project filter: ${projectFilter}` : 'without project filter');

      let query = supabase
        .from('ad_feedback')
        .select('id, saved_images, headline, primary_text, rating, feedback, created_at, imageurl, imageUrl, storage_url, image_status, platform, project_id, size, media_type')
        .eq('user_id', user.id);
      
      if (projectFilter) {
        query = query.eq('project_id', projectFilter);
      }
      
      // Apply tab filters
      if (activeTab === "images") {
        query = query.eq('media_type', 'image');
      } else if (activeTab === "videos") {
        query = query.eq('media_type', 'video');
      } else if (activeTab === "projects" && !projectFilter) {
        query = query.not('project_id', 'is', null);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Map data to SavedAd type with proper conversions
      const formatAdData = (ad: AdFeedbackRow): SavedAd => {
        let savedImages: string[] = [];
        
        // Process the saved_images field
        if (ad.saved_images) {
          if (Array.isArray(ad.saved_images)) {
            savedImages = ad.saved_images.map(img => 
              typeof img === 'string' ? img : String(img)
            );
          } else if (typeof ad.saved_images === 'string') {
            savedImages = [ad.saved_images];
          }
        }
        
        // Handle the size field with proper type checking
        let sizeObj: AdSize = { width: 1200, height: 628, label: "Default" };
        if (ad.size) {
          // Check if size is an object first
          if (typeof ad.size === 'object' && ad.size !== null && !Array.isArray(ad.size)) {
            const sizeData = ad.size as Record<string, Json>;
            
            // Check if width property exists and is a number
            const width = sizeData.width;
            if (typeof width === 'number') {
              sizeObj.width = width;
            }
            
            // Check if height property exists and is a number
            const height = sizeData.height;
            if (typeof height === 'number') {
              sizeObj.height = height;
            }
            
            // Check if label property exists and is a string
            const label = sizeData.label;
            if (typeof label === 'string') {
              sizeObj.label = label;
            }
          }
        }

        // Get best available image URL
        const imageUrl = ad.imageUrl || ad.imageurl || ad.storage_url || (savedImages.length > 0 ? savedImages[0] : undefined);
        
        return {
          ...ad,
          saved_images: savedImages,
          imageUrl,
          imageurl: imageUrl,
          storage_url: ad.storage_url,
          size: sizeObj,
          media_type: (ad.media_type || 'image') as 'image' | 'video',
          image_status: ad.image_status as 'pending' | 'processing' | 'ready' | 'failed'
        };
      };

      const processedAds: SavedAd[] = (data as AdFeedbackRow[] || []).map(formatAdData);

      console.log(`Retrieved ${processedAds.length} ads`);
      
      // Deduplicate ads based on image URL
      const uniqueImageUrls = new Set<string>();
      const uniqueAds = processedAds.filter(ad => {
        const imageUrl = ad.imageUrl || ad.imageurl || (ad.saved_images && ad.saved_images[0]);
        if (!imageUrl || uniqueImageUrls.has(imageUrl)) {
          return false;
        }
        uniqueImageUrls.add(imageUrl);
        return true;
      });

      console.log(`After deduplication: ${uniqueAds.length} unique ads`);
      setSavedAds(uniqueAds);
      
      const filteredCount = getFilteredAds(uniqueAds).length;
      setTotalPages(Math.max(1, Math.ceil(filteredCount / itemsPerPage)));
      
      if (currentPage > Math.max(1, Math.ceil(filteredCount / itemsPerPage))) {
        setCurrentPage(1);
      }
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

  // Effect to fetch ads when dependencies change
  useEffect(() => {
    fetchSavedAds();
  }, [toast, projectFilter, activeTab, t]);

  // Handle selection of individual ads
  const handleAdSelect = (adId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedAdIds(prev => [...prev, adId]);
    } else {
      setSelectedAdIds(prev => prev.filter(id => id !== adId));
    }
  };

  // Select or deselect all visible ads
  const handleSelectAll = () => {
    const filteredAds = getFilteredAds();
    
    if (selectedAdIds.length === filteredAds.length) {
      setSelectedAdIds([]);
    } else {
      setSelectedAdIds(filteredAds.map(ad => ad.id));
    }
  };

  // Handle project selection for assigning ads
  const handleProjectSelect = (projectId: string) => {
    console.log("Project selected:", projectId);
    setSelectedProjectId(projectId);
    
    if (projectId) {
      toast({
        title: t("project.selected", { ns: "projects" }),
        description: t("project.selected_success", "Project has been selected successfully", { ns: "projects" }),
      });
    }
  };

  // Handle assigning selected ads to a project
  const handleAssignToProject = async () => {
    if (!selectedProjectId || selectedAdIds.length === 0) {
      toast({
        title: t("errors.title", { ns: "common" }),
        description: t("errors.required_field", { ns: "common" }),
        variant: "destructive",
      });
      return;
    }

    setIsAssigning(true);
    try {
      console.log("Assigning ads to project:", selectedProjectId, "Ads:", selectedAdIds);

      for (const adId of selectedAdIds) {
        const { error } = await supabase
          .from('ad_feedback')
          .update({ project_id: selectedProjectId })
          .eq('id', adId);
          
        if (error) {
          console.error("Error assigning to project:", error);
          throw error;
        }
      }

      toast({
        title: t("success", { ns: "common" }),
        description: t("confirm_add.success", "{count} ad(s) assigned to project successfully", { count: selectedAdIds.length }),
      });
      
      await fetchSavedAds();
      setSelectedAdIds([]);
      setIsConfirmDialogOpen(false);
    } catch (error) {
      console.error('Error assigning ads to project:', error);
      toast({
        title: t("error", { ns: "common" }),
        description: t("errors.occurred", { ns: "common" }),
        variant: "destructive",
      });
    } finally {
      setIsAssigning(false);
    }
  };

  // Handle removing selected ads from their projects
  const handleRemoveFromProject = async () => {
    setIsAssigning(true);
    try {
      const { error } = await supabase
        .from('ad_feedback')
        .update({ project_id: null })
        .in('id', selectedAdIds);

      if (error) throw error;

      toast({
        title: t("success", { ns: "common" }),
        description: t("confirm_remove.success", "{count} ad(s) removed from project successfully", { count: selectedAdIds.length }),
      });
      
      await fetchSavedAds();
      setSelectedAdIds([]);
      setIsConfirmDialogOpen(false);
    } catch (error) {
      console.error('Error removing ads from project:', error);
      toast({
        title: t("error", { ns: "common" }),
        description: t("errors.occurred", { ns: "common" }),
        variant: "destructive",
      });
    } finally {
      setIsAssigning(false);
    }
  };

  // Handle deleting selected ads
  const handleDeleteSelectedAds = async () => {
    if (selectedAdIds.length === 0) return;
    
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('ad_feedback')
        .delete()
        .in('id', selectedAdIds);
        
      if (error) throw error;
      
      toast({
        title: t("success", { ns: "common" }),
        description: t("deleted_ads", "Successfully deleted {count} ad(s)", { count: selectedAdIds.length, ns: "gallery" }),
      });
      
      await fetchSavedAds();
      setSelectedAdIds([]);
      setBatchActionOpen(false);
    } catch (error) {
      console.error('Error deleting ads:', error);
      toast({
        title: t("error", { ns: "common" }),
        description: t("errors.delete_failed", { ns: "common" }),
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle duplicating selected ads
  const handleDuplicateSelectedAds = async () => {
    if (selectedAdIds.length === 0) return;
    
    setIsProcessing(true);
    try {
      const { data: originalAds } = await supabase
        .from('ad_feedback')
        .select('*')
        .in('id', selectedAdIds);
        
      if (!originalAds) throw new Error("Failed to fetch ads to duplicate");
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");
      
      const duplicates = originalAds.map(ad => ({
        ...ad,
        id: undefined, // Remove ID so Supabase generates a new one
        created_at: new Date().toISOString(),
        headline: ad.headline ? `${ad.headline} (Copy)` : "Untitled Ad (Copy)",
      }));
      
      const { error } = await supabase
        .from('ad_feedback')
        .insert(duplicates);
        
      if (error) throw error;
      
      toast({
        title: t("success", { ns: "common" }),
        description: t("duplicated_ads", "Successfully duplicated {count} ad(s)", { count: selectedAdIds.length, ns: "gallery" }),
      });
      
      await fetchSavedAds();
      setBatchActionOpen(false);
    } catch (error) {
      console.error('Error duplicating ads:', error);
      toast({
        title: t("error", { ns: "common" }),
        description: t("errors.duplicate_failed", "Failed to duplicate ads", { ns: "gallery" }),
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Apply filters to the ads list
  const getFilteredAds = (adsToFilter = savedAds) => {
    return adsToFilter.filter(ad => {
      // Apply search filter
      const matchesSearch = searchQuery === "" || 
        (ad.headline?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
        (ad.primary_text?.toLowerCase().includes(searchQuery.toLowerCase()) || false);
      
      // Apply platform filter
      const matchesPlatform = platformFilter === 'all' || ad.platform === platformFilter;
      
      // Apply media type filter if not already filtered by tab
      const matchesMediaType = mediaTypeFilter === 'all' || ad.media_type === mediaTypeFilter;
      
      return matchesSearch && matchesPlatform && matchesMediaType;
    }).sort((a, b) => {
      // Apply sorting
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
  };

  // Get the current page of ads for display
  const filteredAds = getFilteredAds();
  const paginatedAds = filteredAds.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Update total pages when filters change
  useEffect(() => {
    setTotalPages(Math.max(1, Math.ceil(filteredAds.length / itemsPerPage)));
    setCurrentPage(1);
  }, [searchQuery, platformFilter, mediaTypeFilter, sortBy, activeTab]);

  // Check if any selected ads have projects assigned
  const hasProjectAssigned = selectedAdIds.some(id => 
    savedAds.find(ad => ad.id === id)?.project_id !== undefined
  );

  // Loading state UI
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-gray-600">{t("loading.saved_ads", { ns: "dashboard" })}</p>
        <p className="text-sm text-gray-500">{t("loading.please_wait", { ns: "common" })}</p>
      </div>
    );
  }

  // Empty state UI
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

  // Determine tab content data
  const getTabStats = () => {
    const imageCount = savedAds.filter(ad => ad.media_type === 'image').length;
    const videoCount = savedAds.filter(ad => ad.media_type === 'video').length;
    
    // Get count of unique project IDs
    const projectIds = new Set();
    savedAds.forEach(ad => {
      if (ad.project_id) projectIds.add(ad.project_id);
    });
    const projectCount = projectIds.size;
    
    return { imageCount, videoCount, projectCount, total: savedAds.length };
  };
  
  const stats = getTabStats();

  return (
    <div className="space-y-6">
      {/* Tabs navigation */}
      <Tabs 
        value={activeTab} 
        onValueChange={(value) => setActiveTab(value as "all" | "images" | "videos" | "projects")}
        className="w-full"
      >
        <TabsList className="grid grid-cols-4">
          <TabsTrigger value="all" className="flex items-center gap-2">
            <LayoutGrid className="h-4 w-4" />
            <span>All ({stats.total})</span>
          </TabsTrigger>
          <TabsTrigger value="images" className="flex items-center gap-2">
            <PenLine className="h-4 w-4" />
            <span>Images ({stats.imageCount})</span>
          </TabsTrigger>
          <TabsTrigger value="videos" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>Videos ({stats.videoCount})</span>
          </TabsTrigger>
          <TabsTrigger value="projects" className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            <span>Projects ({stats.projectCount})</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-6">
          {/* Filters and search */}
          <div className="flex flex-col gap-4 bg-gray-50 p-4 rounded-lg shadow-sm">
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <div className="flex items-center space-x-2">
                <Button
                  variant={view === "grid" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setView("grid")}
                  className="flex items-center"
                >
                  <LayoutGrid className="h-4 w-4 mr-2" />
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
              
              <div className="flex gap-2">
                <Select value={platformFilter} onValueChange={setPlatformFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder={t("filters.platform")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("filters.all_platforms")}</SelectItem>
                    <SelectItem value="facebook">{t("filters.facebook")}</SelectItem>
                    <SelectItem value="instagram">{t("filters.instagram")}</SelectItem>
                    <SelectItem value="google">{t("filters.google")}</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={mediaTypeFilter} onValueChange={setMediaTypeFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Media Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Media</SelectItem>
                    <SelectItem value="image">Images</SelectItem>
                    <SelectItem value="video">Videos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Batch Actions Bar */}
          <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  className="flex items-center"
                >
                  {selectedAdIds.length === filteredAds.length && filteredAds.length > 0 ? (
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
                
                {selectedAdIds.length > 0 && (
                  <Badge variant="secondary">
                    {t("selected", { count: selectedAdIds.length })}
                  </Badge>
                )}
              </div>
              
              <div className="flex flex-wrap gap-2">
                {selectedAdIds.length > 0 && (
                  <>
                    <AlertDialog open={batchActionOpen} onOpenChange={setBatchActionOpen}>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="flex items-center">
                          <Filter className="h-4 w-4 mr-2" />
                          Batch Actions
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Batch Actions</AlertDialogTitle>
                          <AlertDialogDescription>
                            Choose an action to perform on {selectedAdIds.length} selected ad(s).
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="grid grid-cols-2 gap-4 py-4">
                          <Button
                            variant="outline"
                            onClick={handleDuplicateSelectedAds}
                            disabled={isProcessing}
                            className="flex items-center justify-center"
                          >
                            {isProcessing ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Copy className="h-4 w-4 mr-2" />
                            )}
                            Duplicate
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={handleDeleteSelectedAds}
                            disabled={isProcessing}
                            className="flex items-center justify-center"
                          >
                            {isProcessing ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4 mr-2" />
                            )}
                            Delete
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setBatchActionOpen(false)}
                            disabled={isProcessing}
                            className="flex items-center justify-center col-span-2"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Export
                          </Button>
                        </div>
                        <AlertDialogFooter>
                          <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

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
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Filters Tags */}
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
            
            {mediaTypeFilter !== 'all' && (
              <Badge 
                variant="secondary" 
                className="flex items-center gap-1"
              >
                Media: {mediaTypeFilter}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-4 w-4 p-0 ml-1" 
                  onClick={() => setMediaTypeFilter("all")}
                >
                  ×
                </Button>
              </Badge>
            )}
          </div>

          {/* Main content - Ads display */}
          {filteredAds.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
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
                  setMediaTypeFilter("all");
                  setSortBy("newest");
                }}
              >
                {t("no_results.clear_filters")}
              </Button>
            </div>
          ) : (
            <>
              {view === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {paginatedAds.map((ad) => (
                    <SavedAdCard
                      key={ad.id}
                      id={ad.id}
                      primaryText={ad.primary_text}
                      headline={ad.headline}
                      imageUrl={ad.imageUrl || ad.imageurl || (ad.saved_images && ad.saved_images[0])}
                      storage_url={ad.storage_url}
                      image_status={ad.image_status}
                      platform={ad.platform}
                      size={ad.size}
                      projectId={ad.project_id}
                      onFeedbackSubmit={fetchSavedAds}
                      selectable={!projectFilter}
                      selected={selectedAdIds.includes(ad.id)}
                      onSelect={handleAdSelect}
                      media_type={ad.media_type}
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

              {/* Pagination */}
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
        </TabsContent>
        
        <TabsContent value="images" className="space-y-4">
          {/* Re-use the same content structure as "all" tab but with prefiltered data for images */}
          {/* Same structure as "all" tab with image-specific content */}
          <div className="flex flex-col gap-4">
            {/* Filter bar for images tab */}
            <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium">Image Ads</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <ArrowDownWideNarrow className="h-4 w-4 mr-2" />
                  Sort
                </Button>
                <Button variant="outline" size="sm">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>
            
            {/* Content will be auto-filtered by the tab selection */}
            {filteredAds.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedAds.map((ad) => (
                  <SavedAdCard
                    key={ad.id}
                    id={ad.id}
                    primaryText={ad.primary_text}
                    headline={ad.headline}
                    imageUrl={ad.imageUrl || ad.imageurl || (ad.saved_images && ad.saved_images[0])}
                    storage_url={ad.storage_url}
                    image_status={ad.image_status}
                    platform={ad.platform}
                    size={ad.size}
                    projectId={ad.project_id}
                    onFeedbackSubmit={fetchSavedAds}
                    selectable={!projectFilter}
                    selected={selectedAdIds.includes(ad.id)}
                    onSelect={handleAdSelect}
                    media_type="image"
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900">No image ads found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Try clearing your filters or creating new image ads
                </p>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="videos" className="space-y-4">
          {/* Video-specific content */}
          <div className="flex flex-col gap-4">
            {/* Filter bar for videos tab */}
            <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium">Video Ads</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <ArrowDownWideNarrow className="h-4 w-4 mr-2" />
                  Sort
                </Button>
                <Button variant="outline" size="sm">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>
            
            {/* Content will be auto-filtered by the tab selection */}
            {filteredAds.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedAds.map((ad) => (
                  <SavedAdCard
                    key={ad.id}
                    id={ad.id}
                    primaryText={ad.primary_text}
                    headline={ad.headline}
                    imageUrl={ad.imageUrl || ad.imageurl || (ad.saved_images && ad.saved_images[0])}
                    storage_url={ad.storage_url}
                    image_status={ad.image_status}
                    platform={ad.platform}
                    size={ad.size}
                    projectId={ad.project_id}
                    onFeedbackSubmit={fetchSavedAds}
                    selectable={!projectFilter}
                    selected={selectedAdIds.includes(ad.id)}
                    onSelect={handleAdSelect}
                    media_type="video"
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900">No video ads found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Try clearing your filters or uploading new video ads
                </p>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="projects" className="space-y-4">
          {/* Projects-specific content */}
          <div className="flex flex-col gap-4">
            {/* Filter bar for projects tab */}
            <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium">Project Ads</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <ArrowUpWideNarrow className="h-4 w-4 mr-2" />
                  Group by Project
                </Button>
              </div>
            </div>
            
            {/* Content will be auto-filtered by the tab selection */}
            {filteredAds.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedAds.map((ad) => (
                  <SavedAdCard
                    key={ad.id}
                    id={ad.id}
                    primaryText={ad.primary_text}
                    headline={ad.headline}
                    imageUrl={ad.imageUrl || ad.imageurl || (ad.saved_images && ad.saved_images[0])}
                    storage_url={ad.storage_url}
                    image_status={ad.image_status}
                    platform={ad.platform}
                    size={ad.size}
                    projectId={ad.project_id}
                    onFeedbackSubmit={fetchSavedAds}
                    selectable={!projectFilter}
                    selected={selectedAdIds.includes(ad.id)}
                    onSelect={handleAdSelect}
                    media_type={ad.media_type}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900">No ads assigned to projects</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Assign ads to projects to see them here
                </p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
