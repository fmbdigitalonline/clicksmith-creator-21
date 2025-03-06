import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types";
import { SavedAdCard } from "./components/SavedAdCard";
import { EmptyState } from "./components/EmptyState";
import { Loader2, SquareCheckIcon, CheckSquare } from "lucide-react";
import { AD_FORMATS } from "@/components/steps/gallery/components/AdSizeSelector";
import { Button } from "@/components/ui/button";
import { ProjectSelector } from "./components/ProjectSelector";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface SavedAd {
  id: string;
  saved_images: string[];
  headline?: string;
  primary_text?: string;
  rating: number;
  feedback: string;
  created_at: string;
  imageurl?: string;  // Keep lowercase for database compatibility
  imageUrl?: string;  // Add camelCase version
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
  imageurl?: string;  // Keep lowercase for database compatibility
  imageUrl?: string;  // Add camelCase version
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
      
      // If projectFilter is provided, filter ads by that project
      if (projectFilter) {
        query = query.eq('project_id', projectFilter);
        console.log("Filtering ads for project:", projectFilter);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Find the default format (square 1:1)
      const defaultFormat = AD_FORMATS.find(format => format.width === 1080 && format.height === 1080) || AD_FORMATS[0];

      const convertedAds: SavedAd[] = (data as AdFeedbackRow[]).map(ad => ({
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
      }));

      console.log("Fetched ads count:", convertedAds.length);
      setSavedAds(convertedAds);
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
    if (selectedAdIds.length === savedAds.length) {
      setSelectedAdIds([]);
    } else {
      setSelectedAdIds(savedAds.map(ad => ad.id));
    }
  };

  const handleProjectSelect = (projectId: string) => {
    console.log("Project selected:", projectId);
    setSelectedProjectId(projectId);
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

      const { error } = await supabase
        .from('ad_feedback')
        .update({ project_id: selectedProjectId })
        .in('id', selectedAdIds);

      if (error) {
        console.error("Error assigning to project:", error);
        throw error;
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

  // Only show action bar when not filtering by project
  const showActionBar = !projectFilter;

  return (
    <div className="space-y-6">
      {/* Action Bar - Only show when not filtering by project */}
      {showActionBar && (
        <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                className="flex items-center"
              >
                {selectedAdIds.length === savedAds.length ? (
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
              <div className="w-full sm:w-64">
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
                      {hasProjectAssigned && (
                        <p className="mt-2 text-amber-600">
                          Warning: Some of the selected ads are already assigned to a project and will be reassigned.
                        </p>
                      )}
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
      )}

      {/* Project Filter Info - Show when filtering by project */}
      {projectFilter && (
        <div className="mb-4">
          <Badge variant="outline" className="text-sm font-normal">
            Showing ads for selected project
          </Badge>
        </div>
      )}

      {/* Ads Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {savedAds.map((ad) => (
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
    </div>
  );
};
