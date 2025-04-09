
import { useState, useEffect } from 'react';
import AdPreviewCard from './components/AdPreviewCard';
import { Button } from '@/components/ui/button';
import { CheckSquare, Square, Download, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { convertImage } from '@/utils/imageUtils';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';

interface PlatformContentProps {
  platformName: string;
  adVariants: any[];
  onCreateProject?: () => void;
  videoAdsEnabled?: boolean;
  selectedFormat?: {
    width: number;
    height: number;
    label: string;
  };
  selectable?: boolean;
  selectedAdIds?: string[];
  onAdSelect?: (id: string, selected: boolean) => void;
  onRegenerateImage?: (prompt: string) => Promise<void>;
}

const PlatformContent = ({
  platformName,
  adVariants,
  onCreateProject,
  videoAdsEnabled = false,
  selectedFormat,
  selectable = false,
  selectedAdIds = [],
  onAdSelect,
  onRegenerateImage,
}: PlatformContentProps) => {
  const [downloadFormat, setDownloadFormat] = useState<"jpg" | "png" | "pdf" | "docx">("jpg");
  const [isDownloading, setIsDownloading] = useState(false);
  const [isRegeneratingImage, setIsRegeneratingImage] = useState(false);
  const [regeneratingImageId, setRegeneratingImageId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSelectToggle = (id: string, selected: boolean) => {
    if (onAdSelect) {
      onAdSelect(id, selected);
    }
  };

  const handleBulkDownload = async () => {
    if (selectedAdIds.length === 0) return;
    
    setIsDownloading(true);
    try {
      const zip = new JSZip();
      
      for (let i = 0; i < selectedAdIds.length; i++) {
        const id = selectedAdIds[i];
        const variant = adVariants.find(v => v.id === id);
        
        if (!variant) continue;
        
        const imageUrl = variant.image?.url || variant.imageUrl;
        if (!imageUrl) continue;
        
        try {
          const blob = await convertImage(imageUrl, downloadFormat, variant);
          
          // Add file to zip with appropriate name and extension
          const fileName = `${platformName}-ad-${i + 1}.${downloadFormat}`;
          zip.file(fileName, blob);
        } catch (error) {
          console.error(`Error processing image ${i + 1}:`, error);
        }
      }
      
      // Generate the zip file
      const content = await zip.generateAsync({ type: "blob" });
      
      // Save the zip file
      saveAs(content, `${platformName}-ads.zip`);
      
      toast({
        title: "Download complete",
        description: `${selectedAdIds.length} files have been downloaded.`,
      });
    } catch (error) {
      console.error('Error downloading images:', error);
      toast({
        title: "Download failed",
        description: "Failed to download images. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleRegenerateImage = async (variant: any, prompt: string) => {
    if (isRegeneratingImage || !onRegenerateImage) return;
    
    setIsRegeneratingImage(true);
    setRegeneratingImageId(variant.id);
    
    try {
      await onRegenerateImage(prompt);
      
      toast({
        title: "Image regeneration started",
        description: "Your new image is being generated. This may take a moment."
      });
    } catch (error) {
      console.error('Error regenerating image:', error);
      toast({
        title: "Regeneration failed",
        description: "Could not regenerate the image. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsRegeneratingImage(false);
      setRegeneratingImageId(null);
    }
  };

  if (!adVariants || adVariants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
        <p className="text-gray-500 mb-4">No ad variants available for {platformName}.</p>
        <Button onClick={() => window.location.reload()}>Refresh</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {selectable && selectedAdIds.length > 0 && (
        <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg">
          <div className="text-sm font-medium">{selectedAdIds.length} ad(s) selected</div>
          <Button 
            variant="outline" 
            onClick={handleBulkDownload}
            disabled={isDownloading}
            className="text-sm"
          >
            {isDownloading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Downloading...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Download Selected
              </>
            )}
          </Button>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {adVariants.map((variant: any, index: number) => {
          const isSelected = selectedAdIds.includes(variant.id);
          
          return (
            <AdPreviewCard
              key={variant.id || index}
              variant={variant}
              adVariants={adVariants}
              onCreateProject={onCreateProject}
              isVideo={variant.type === 'video' || (videoAdsEnabled && index % 3 === 0)}
              selectedFormat={selectedFormat}
              selectable={selectable}
              selected={isSelected}
              onSelect={(id, selected) => handleSelectToggle(id, selected)}
              onRegenerateImage={(prompt) => handleRegenerateImage(variant, prompt)}
            />
          );
        })}
      </div>
    </div>
  );
};

export default PlatformContent;
