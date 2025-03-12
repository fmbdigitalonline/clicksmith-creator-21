
import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Star, Pencil, Download, Eye, Facebook, Instagram, Image } from "lucide-react";
import { SavedAdCard } from "./SavedAdCard";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface SavedAdsTableProps {
  ads: Array<{
    id: string;
    headline?: string;
    primary_text?: string;
    imageUrl?: string;
    imageurl?: string;
    saved_images?: string[];
    platform?: string;
    size?: {
      width: number;
      height: number;
      label: string;
    };
    projectId?: string;
    created_at: string;
    rating: number;
    project_id?: string;
  }>;
  selectedAdIds: string[];
  onAdSelect: (adId: string, isSelected: boolean) => void;
  onSelectAll: () => void;
  selectable: boolean;
  onFeedbackSubmit: () => void;
}

export const SavedAdsTable = ({
  ads,
  selectedAdIds,
  onAdSelect,
  onSelectAll,
  selectable,
  onFeedbackSubmit
}: SavedAdsTableProps) => {
  const [activeAdId, setActiveAdId] = useState<string | null>(null);

  const renderPlatformIcon = (platform?: string) => {
    switch (platform) {
      case 'facebook':
        return <Facebook className="h-4 w-4 text-[#1877F2]" />;
      case 'instagram':
        return <Instagram className="h-4 w-4 text-[#E1306C]" />;
      default:
        return <Image className="h-4 w-4 text-gray-500" />;
    }
  };

  const truncateText = (text?: string, length: number = 50) => {
    if (!text) return "";
    return text.length > length ? `${text.substring(0, length)}...` : text;
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            {selectable && (
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedAdIds.length === ads.length && ads.length > 0}
                  onCheckedChange={onSelectAll}
                />
              </TableHead>
            )}
            <TableHead>Ad Preview</TableHead>
            <TableHead>Headline</TableHead>
            <TableHead className="hidden md:table-cell">Text</TableHead>
            <TableHead className="hidden lg:table-cell">Platform/Size</TableHead>
            <TableHead className="hidden lg:table-cell">Rating</TableHead>
            <TableHead className="hidden md:table-cell">Created</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ads.map((ad) => (
            <TableRow key={ad.id} className="hover:bg-muted/50">
              {selectable && (
                <TableCell>
                  <Checkbox
                    checked={selectedAdIds.includes(ad.id)}
                    onCheckedChange={(checked) => onAdSelect(ad.id, !!checked)}
                  />
                </TableCell>
              )}
              <TableCell>
                <div className="w-16 h-16 relative rounded overflow-hidden border">
                  <img
                    src={ad.imageUrl || ad.imageurl || (ad.saved_images && ad.saved_images[0])}
                    alt={ad.headline || "Ad image"}
                    className="object-cover w-full h-full"
                  />
                  {ad.project_id && (
                    <div className="absolute top-0 right-0 bg-primary text-white text-[8px] px-1 py-0.5">
                      Project
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell className="font-medium">
                {truncateText(ad.headline, 30) || <span className="text-gray-400 italic">No headline</span>}
              </TableCell>
              <TableCell className="hidden md:table-cell max-w-[200px]">
                {truncateText(ad.primary_text, 60) || <span className="text-gray-400 italic">No text</span>}
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                <div className="flex flex-col space-y-1">
                  <div className="flex items-center">
                    {renderPlatformIcon(ad.platform)}
                    <span className="ml-1 text-xs">{ad.platform || "Unknown"}</span>
                  </div>
                  {ad.size && (
                    <Badge variant="outline" className="text-[10px]">
                      {ad.size.label}
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                {renderStars(ad.rating)}
              </TableCell>
              <TableCell className="hidden md:table-cell text-xs text-gray-500">
                {format(new Date(ad.created_at), "MMM d, yyyy")}
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-1">
                  <Dialog open={activeAdId === ad.id} onOpenChange={(open) => setActiveAdId(open ? ad.id : null)}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
                      <DialogTitle>Ad Details</DialogTitle>
                      <SavedAdCard
                        id={ad.id}
                        primaryText={ad.primary_text}
                        headline={ad.headline}
                        imageUrl={ad.imageUrl || ad.imageurl || (ad.saved_images && ad.saved_images[0])}
                        platform={ad.platform}
                        size={ad.size}
                        projectId={ad.project_id}
                        onFeedbackSubmit={() => {
                          onFeedbackSubmit();
                          setActiveAdId(null);
                        }}
                        selectable={false}
                      />
                    </DialogContent>
                  </Dialog>
                  
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Download className="h-4 w-4" />
                  </Button>
                  
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
