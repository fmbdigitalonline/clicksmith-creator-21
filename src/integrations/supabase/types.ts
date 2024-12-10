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
      documents: {
        Row: {
          content: string | null
          created_at: string
          id: string
          project_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          project_id?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          project_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
      }
      projects: {
        Row: {
          created_at: string
          description: string | null
          id: string
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
          ad_format: string | null
          ad_dimensions: Json | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
          ad_format?: string | null
          ad_dimensions?: Json | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
          ad_format?: string | null
          ad_dimensions?: Json | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}