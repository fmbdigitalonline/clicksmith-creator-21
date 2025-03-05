
import { Card, CardContent } from "@/components/ui/card";
import { Facebook } from "lucide-react";

interface AdPreviewProps {
  ad: {
    headline: string;
    description: string;
    imageUrl?: string;
    platform: string;
  };
}

export const AdPreview = ({ ad }: AdPreviewProps) => {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="p-3 bg-gray-50 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Facebook className="h-4 w-4 text-facebook" />
            <span className="text-xs font-medium">Facebook Ad</span>
          </div>
          <span className="text-xs text-muted-foreground">Preview</span>
        </div>
        
        <div className="p-3 space-y-2">
          {ad.imageUrl && (
            <div className="relative w-full h-[120px] rounded overflow-hidden bg-gray-100">
              <img 
                src={ad.imageUrl} 
                alt={ad.headline}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          <div className="space-y-1">
            <h4 className="text-sm font-medium text-facebook truncate">{ad.headline}</h4>
            <p className="text-xs text-gray-600 line-clamp-3">{ad.description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
