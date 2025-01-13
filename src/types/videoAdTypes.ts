export interface VideoAdPreferences {
  format: 'landscape' | 'portrait' | 'square';
  duration: number;
}

export interface VideoAdVariant {
  id: string;
  platform: string;
  videoUrl?: string;
  prompt?: string;
  headline: string;
  description: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  error?: string;
}