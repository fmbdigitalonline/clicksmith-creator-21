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
        title: "Error",
        description: "Failed to load saved ads. Please try again.",
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
        title: "Project Selected",
        description: "Project has been selected successfully",
        variant: "default",
      });
    }
  };

  const handleAssignToProject = async () => {
    setIsAssigning(true);
    try {
      if (!selectedProjectId || selectedAdIds.length === 0) {
        toast({
          title: "Selection required",
          description: "Please select both ads and a project.",
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
        title: "Ads assigned",
        description: `${selectedAdIds.length} ad(s) assigned to project successfully.`,
      });
      
      await fetchSavedAds();
      setSelectedAdIds([]);
      setIsConfirmDialogOpen(false);
    } catch (error) {
      console.error('Error assigning ads to project:', error);
      toast({
        title: "Error",
        description: "Failed to assign ads to project. Please try again.",
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
          title: "Selection required",
          description: "Please select ads to remove from project.",
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
        title: "Ads removed",
        description: `${selectedAdIds.length} ad(s) removed from project successfully.`,
      });
      fetchSavedAds();
      setSelectedAdIds([]);
      setIsConfirmDialogOpen(false);
    } catch (error) {
      console.error('Error removing ads from project:', error);
      toast({
        title: "Error",
        description: "Failed to remove ads from project. Please try again.",
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
        <p className="text-gray-600">Loading your saved ads...</p>
        <p className="text-sm text-gray-500">We're retrieving your saved ad content</p>
      </div>
    );
  }

  if (savedAds.length === 0) {
    if (projectFilter) {
      return (
        <div className="py-8 text-center">
          <p className="text-muted-foreground">No ads have been assigned to this project yet.</p>
          <p className="mt-2">
            <Button 
              variant="link" 
              onClick={() => window.location.href = "/gallery/saved"}
            >
              Go to your saved ads gallery to assign ads to this project
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
              Grid
            </Button>
            <Button
              variant={view === "table" ? "default" : "outline"}
              size="sm"
              onClick={() => setView("table")}
              className="flex items-center"
            >
              <TableIcon className="h-4 w-4 mr-2" />
              Table
            </Button>
          </div>
          
          <div className="flex items-center space-x-2">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="rating-high">Highest Rating</SelectItem>
                <SelectItem value="rating-low">Lowest Rating</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search ads by text..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          
          <Select value={platformFilter} onValueChange={setPlatformFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Platform" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Platforms</SelectItem>
              <SelectItem value="facebook">Facebook</SelectItem>
              <SelectItem value="instagram">Instagram</SelectItem>
              <SelectItem value="google">Google</SelectItem>
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
                  Deselect All
                </>
              ) : (
                <>
                  <SquareCheckIcon className="h-4 w-4 mr-2" />
                  Select All
                </>
              )}
            </Button>
            {selectedAdIds.length > 0 && (
              <Badge variant="secondary">
                {selectedAdIds.length} selected
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
                  Add to Project
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Assign Ads to Project</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to add {selectedAdIds.length} ad(s) to the selected project?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleAssignToProject}>Continue</AlertDialogAction>
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
                    Remove from Project
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remove Ads from Project</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to remove these {selectedAdIds.length} ad(s) from their projects?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleRemoveFromProject}>Continue</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <Badge variant="outline" className="bg-gray-50">
          {filteredAds.length} ads found
        </Badge>
        
        {searchQuery && (
          <Badge 
            variant="secondary" 
            className="flex items-center gap-1"
          >
            Search: {searchQuery}
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
            Platform: {platformFilter}
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
            Showing ads for selected project
          </Badge>
        </div>
      )}

      {filteredAds.length === 0 && (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <AlertCircle className="mx-auto h-8 w-8 text-gray-400 mb-2" />
          <h3 className="text-lg font-medium text-gray-900">No ads found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your search or filter criteria
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
            Clear all filters
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
