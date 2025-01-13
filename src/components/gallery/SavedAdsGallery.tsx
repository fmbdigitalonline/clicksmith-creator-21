import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { SavedAdsList } from "./components/SavedAdsList";
import { EmptyState } from "./components/EmptyState";
import { WizardHook } from "@/types/wizardProgress";
import { SavedAd, AdFeedbackRow } from "./types";

export const SavedAdsGallery = () => {
  const [savedAds, setSavedAds] = useState<SavedAd[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchSavedAds = async () => {
    try {
      console.log("Fetching saved ads...");
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log("No user found");
        setIsLoading(false);
        return;
      }

      console.log("User found:", user.id);

      // First try to get ads from wizard progress
      const { data: wizardData, error: wizardError } = await supabase
        .from('wizard_progress')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (wizardError) {
        console.error('Error fetching wizard data:', wizardError);
      }

      let generatedAds: SavedAd[] = [];
      
      if (wizardData?.selected_hooks) {
        console.log("Found wizard data with hooks:", wizardData.selected_hooks);
        const hooksData = Array.isArray(wizardData.selected_hooks) 
          ? (wizardData.selected_hooks as WizardHook[])
          : [];
          
        generatedAds = hooksData
          .filter(hook => Boolean(hook.imageUrl))
          .map((hook: WizardHook, index: number) => ({
            id: `wizard-${index}`,
            saved_images: hook.imageUrl ? [hook.imageUrl] : [],
            headline: hook.description,
            primary_text: hook.text,
            rating: 0,
            feedback: '',
            created_at: new Date().toISOString()
          }));
      }

      // Then get saved ad feedback
      const { data: feedbackData, error: feedbackError } = await supabase
        .from('ad_feedback')
        .select('*')
        .eq('user_id', user.id)
        .not('saved_images', 'is', null)
        .order('created_at', { ascending: false });

      if (feedbackError) {
        console.error('Error fetching feedback data:', feedbackError);
        throw feedbackError;
      }

      console.log("Fetched feedback data:", feedbackData);

      // Convert feedback data
      const feedbackAds: SavedAd[] = (feedbackData as AdFeedbackRow[])
        .filter(ad => {
          const hasImages = ad.saved_images !== null && 
            (Array.isArray(ad.saved_images) ? ad.saved_images.length > 0 : typeof ad.saved_images === 'string');
          return hasImages;
        })
        .map(ad => {
          let images: string[] = [];
          if (Array.isArray(ad.saved_images)) {
            images = ad.saved_images.filter((img): img is string => 
              typeof img === 'string' && img.length > 0
            );
          } else if (typeof ad.saved_images === 'string' && ad.saved_images.length > 0) {
            images = [ad.saved_images];
          }
          
          return {
            id: ad.id,
            saved_images: images,
            headline: ad.headline || undefined,
            primary_text: ad.primary_text || undefined,
            rating: ad.rating,
            feedback: ad.feedback,
            created_at: ad.created_at
          };
        });

      // Combine both sources of ads
      const allAds = [...generatedAds, ...feedbackAds].filter(ad => ad.saved_images.length > 0);
      console.log("Final combined ads:", allAds);
      setSavedAds(allAds);
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
    let isMounted = true;

    const loadAds = async () => {
      if (isMounted) {
        await fetchSavedAds();
      }
    };

    loadAds();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">
      <div className="text-gray-500">Loading saved ads...</div>
    </div>;
  }

  if (savedAds.length === 0) {
    return <EmptyState />;
  }

  return <SavedAdsList ads={savedAds} onFeedbackSubmit={fetchSavedAds} />;
};