export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      wizard_progress: {
        Row: {
          id: string
          user_id: string
          business_idea: Json
          target_audience: Json
          audience_analysis: Json
          selected_hooks: Json
          ad_format: Json
          created_at: string
          updated_at: string
          video_ad_preferences: Json
          generated_ads: Json | null
        }
        Insert: {
          id?: string
          user_id: string
          business_idea?: Json
          target_audience?: Json
          audience_analysis?: Json
          selected_hooks?: Json
          ad_format?: Json
          created_at?: string
          updated_at?: string
          video_ad_preferences?: Json
          generated_ads?: Json | null
        }
        Update: {
          id?: string
          user_id?: string
          business_idea?: Json
          target_audience?: Json
          audience_analysis?: Json
          selected_hooks?: Json
          ad_format?: Json
          created_at?: string
          updated_at?: string
          video_ad_preferences?: Json
          generated_ads?: Json | null
        }
      }
      projects: {
        Row: {
          id: string
          name: string
          description: string | null
          user_id: string
          created_at: string
          updated_at: string
          business_idea: Json | null
          target_audience: Json | null
          audience_analysis: Json | null
          selected_hooks: Json | null
          ad_format: Json | null
          video_ads_enabled: boolean
          video_ad_preferences: Json | null
          generated_ads: Json | null
          status: string
          archived: boolean
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          user_id: string
          created_at?: string
          updated_at?: string
          business_idea?: Json | null
          target_audience?: Json | null
          audience_analysis?: Json | null
          selected_hooks?: Json | null
          ad_format?: Json | null
          video_ads_enabled?: boolean
          video_ad_preferences?: Json | null
          generated_ads?: Json | null
          status?: string
          archived?: boolean
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          user_id?: string
          created_at?: string
          updated_at?: string
          business_idea?: Json | null
          target_audience?: Json | null
          audience_analysis?: Json | null
          selected_hooks?: Json | null
          ad_format?: Json | null
          video_ads_enabled?: boolean
          video_ad_preferences?: Json | null
          generated_ads?: Json | null
          status?: string
          archived?: boolean
        }
      }
      saved_ads: {
        Row: {
          id: string
          user_id: string
          project_id: string | null
          image_url: string
          primary_text: string | null
          headline: string | null
          description: string | null
          platform: string
          format: Json | null
          created_at: string
          updated_at: string
          rating: number | null
          feedback: string | null
          status: string
          archived: boolean
        }
        Insert: {
          id?: string
          user_id: string
          project_id?: string | null
          image_url: string
          primary_text?: string | null
          headline?: string | null
          description?: string | null
          platform: string
          format?: Json | null
          created_at?: string
          updated_at?: string
          rating?: number | null
          feedback?: string | null
          status?: string
          archived?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          project_id?: string | null
          image_url?: string
          primary_text?: string | null
          headline?: string | null
          description?: string | null
          platform?: string
          format?: Json | null
          created_at?: string
          updated_at?: string
          rating?: number | null
          feedback?: string | null
          status?: string
          archived?: boolean
        }
      }
      user_credits: {
        Row: {
          id: string
          user_id: string
          credits: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          credits: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          credits?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
    Functions: {
      check_user_credits: {
        Args: {
          p_user_id: string
          required_credits: number
        }
        Returns: {
          has_credits: boolean
          error_message: string
        }[]
      }
      deduct_user_credits: {
        Args: {
          input_user_id: string
          credits_to_deduct: number
        }
        Returns: {
          success: boolean
          error_message: string
        }[]
      }
    }
    Enums: {
      project_status: 'draft' | 'active' | 'completed' | 'archived'
      ad_status: 'draft' | 'active' | 'paused' | 'archived'
    }
  }
}