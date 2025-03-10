
export interface SavedAd {
  id: string;
  headline?: string;
  primary_text?: string;
  imageUrl?: string;
  imageurl?: string;
  storage_url?: string; // New field for permanent storage URL
  original_url?: string; // New field for original image URL
  image_status?: 'ready' | 'pending' | 'processing' | 'failed'; // New field for image processing status
  platform?: string;
  feedback?: string;
  rating?: number;
  saved_images?: string[];
  created_at?: string;
  project_id?: string;
  size?: {
    width: number;
    height: number;
    label: string;
  };
}
