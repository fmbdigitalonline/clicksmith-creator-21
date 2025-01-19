export interface SavedAd {
  id: string;
  saved_images: string[];
  headline?: string;
  primary_text?: string;
  rating: number;
  feedback: string;
  created_at: string;
}

export interface AdFeedbackRow {
  id: string;
  saved_images: any;
  headline?: string;
  primary_text?: string;
  rating: number;
  feedback: string;
  created_at: string;
}

export interface GeneratedAd {
  imageUrl?: string;
  headline?: string;
  description?: string;
}