export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      ad_campaigns: {
        Row: {
          ai_suggestions_used: Json | null
          budget: number | null
          campaign_data: Json | null
          created_at: string | null
          creation_mode: string | null
          end_date: string | null
          id: string
          image_url: string | null
          is_template: boolean | null
          last_synced_at: string | null
          name: string
          performance_metrics: Json | null
          platform: Database["public"]["Enums"]["ad_platform"]
          platform_ad_id: string | null
          platform_ad_set_id: string | null
          platform_campaign_id: string | null
          project_id: string | null
          start_date: string | null
          status: string
          targeting: Json | null
          template_id: string | null
          template_name: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          ai_suggestions_used?: Json | null
          budget?: number | null
          campaign_data?: Json | null
          created_at?: string | null
          creation_mode?: string | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          is_template?: boolean | null
          last_synced_at?: string | null
          name: string
          performance_metrics?: Json | null
          platform: Database["public"]["Enums"]["ad_platform"]
          platform_ad_id?: string | null
          platform_ad_set_id?: string | null
          platform_campaign_id?: string | null
          project_id?: string | null
          start_date?: string | null
          status: string
          targeting?: Json | null
          template_id?: string | null
          template_name?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          ai_suggestions_used?: Json | null
          budget?: number | null
          campaign_data?: Json | null
          created_at?: string | null
          creation_mode?: string | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          is_template?: boolean | null
          last_synced_at?: string | null
          name?: string
          performance_metrics?: Json | null
          platform?: Database["public"]["Enums"]["ad_platform"]
          platform_ad_id?: string | null
          platform_ad_set_id?: string | null
          platform_campaign_id?: string | null
          project_id?: string | null
          start_date?: string | null
          status?: string
          targeting?: Json | null
          template_id?: string | null
          template_name?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_campaigns_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_feedback: {
        Row: {
          ad_id: string | null
          browser_addons: Json | null
          call_to_action: string | null
          created_at: string
          created_by: string | null
          fb_ad_settings: Json | null
          fb_language: string | null
          feedback: string | null
          headline: string | null
          id: string
          image_status: string | null
          imageurl: string | null
          imageUrl: string | null
          original_url: string | null
          platform: string | null
          primary_text: string | null
          project_data: Json | null
          project_id: string | null
          rating: number | null
          saved_images: Json | null
          size: Json | null
          storage_url: string | null
          updated_at: string
          url_parameters: string | null
          user_id: string | null
          visible_link: string | null
          website_url: string | null
        }
        Insert: {
          ad_id?: string | null
          browser_addons?: Json | null
          call_to_action?: string | null
          created_at?: string
          created_by?: string | null
          fb_ad_settings?: Json | null
          fb_language?: string | null
          feedback?: string | null
          headline?: string | null
          id?: string
          image_status?: string | null
          imageurl?: string | null
          imageUrl?: string | null
          original_url?: string | null
          platform?: string | null
          primary_text?: string | null
          project_data?: Json | null
          project_id?: string | null
          rating?: number | null
          saved_images?: Json | null
          size?: Json | null
          storage_url?: string | null
          updated_at?: string
          url_parameters?: string | null
          user_id?: string | null
          visible_link?: string | null
          website_url?: string | null
        }
        Update: {
          ad_id?: string | null
          browser_addons?: Json | null
          call_to_action?: string | null
          created_at?: string
          created_by?: string | null
          fb_ad_settings?: Json | null
          fb_language?: string | null
          feedback?: string | null
          headline?: string | null
          id?: string
          image_status?: string | null
          imageurl?: string | null
          imageUrl?: string | null
          original_url?: string | null
          platform?: string | null
          primary_text?: string | null
          project_data?: Json | null
          project_id?: string | null
          rating?: number | null
          saved_images?: Json | null
          size?: Json | null
          storage_url?: string | null
          updated_at?: string
          url_parameters?: string | null
          user_id?: string | null
          visible_link?: string | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_feedback_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "valid_project_reference"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_image_regenerations: {
        Row: {
          created_at: string
          dimensions: Json
          error_message: string | null
          id: string
          metadata: Json | null
          new_image_url: string | null
          original_image_url: string
          project_id: string | null
          prompt: string
          status: Database["public"]["Enums"]["image_generation_status"] | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          dimensions?: Json
          error_message?: string | null
          id?: string
          metadata?: Json | null
          new_image_url?: string | null
          original_image_url: string
          project_id?: string | null
          prompt: string
          status?: Database["public"]["Enums"]["image_generation_status"] | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          dimensions?: Json
          error_message?: string | null
          id?: string
          metadata?: Json | null
          new_image_url?: string | null
          original_image_url?: string
          project_id?: string | null
          prompt?: string
          status?: Database["public"]["Enums"]["image_generation_status"] | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_image_regenerations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_image_variants: {
        Row: {
          created_at: string
          id: string
          metadata: Json | null
          original_image_url: string
          project_id: string | null
          prompt: string | null
          resized_image_urls: Json
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json | null
          original_image_url: string
          project_id?: string | null
          prompt?: string | null
          resized_image_urls?: Json
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json | null
          original_image_url?: string
          project_id?: string | null
          prompt?: string | null
          resized_image_urls?: Json
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_image_variants_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_updates: {
        Row: {
          created_at: string
          description: string
          expiry_date: string | null
          icon: string | null
          id: string
          metadata: Json | null
          priority: number | null
          publish_date: string | null
          published: boolean | null
          title: string
          type: Database["public"]["Enums"]["update_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          expiry_date?: string | null
          icon?: string | null
          id?: string
          metadata?: Json | null
          priority?: number | null
          publish_date?: string | null
          published?: boolean | null
          title: string
          type: Database["public"]["Enums"]["update_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          expiry_date?: string | null
          icon?: string | null
          id?: string
          metadata?: Json | null
          priority?: number | null
          publish_date?: string | null
          published?: boolean | null
          title?: string
          type?: Database["public"]["Enums"]["update_type"]
          updated_at?: string
        }
        Relationships: []
      }
      affiliate_applications: {
        Row: {
          created_at: string
          description: string
          email: string
          id: string
          status: string | null
          updated_at: string
          user_id: string | null
          website: string
        }
        Insert: {
          created_at?: string
          description: string
          email: string
          id?: string
          status?: string | null
          updated_at?: string
          user_id?: string | null
          website: string
        }
        Update: {
          created_at?: string
          description?: string
          email?: string
          id?: string
          status?: string | null
          updated_at?: string
          user_id?: string | null
          website?: string
        }
        Relationships: []
      }
      ai_campaign_decisions: {
        Row: {
          campaign_id: string
          confidence: string | null
          decision_type: string
          decision_value: string
          id: string
          override_reason: string | null
          reasoning: string | null
          timestamp: string | null
          user_override: string | null
        }
        Insert: {
          campaign_id: string
          confidence?: string | null
          decision_type: string
          decision_value: string
          id?: string
          override_reason?: string | null
          reasoning?: string | null
          timestamp?: string | null
          user_override?: string | null
        }
        Update: {
          campaign_id?: string
          confidence?: string | null
          decision_type?: string
          decision_value?: string
          id?: string
          override_reason?: string | null
          reasoning?: string | null
          timestamp?: string | null
          user_override?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_campaign_decisions_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ad_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_campaign_decisions_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaign_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_suggestion_feedback: {
        Row: {
          action: string
          created_at: string | null
          current_value: string | null
          id: string
          project_id: string | null
          suggestion_confidence: string | null
          suggestion_content: string | null
          suggestion_type: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          current_value?: string | null
          id?: string
          project_id?: string | null
          suggestion_confidence?: string | null
          suggestion_content?: string | null
          suggestion_type: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          current_value?: string | null
          id?: string
          project_id?: string | null
          suggestion_confidence?: string | null
          suggestion_content?: string | null
          suggestion_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_suggestion_feedback_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      anonymous_usage: {
        Row: {
          completed: boolean | null
          created_at: string
          id: string
          last_completed_step: number | null
          last_save_attempt: string | null
          save_count: number | null
          session_id: string
          updated_at: string | null
          used: boolean | null
          wizard_data: Json | null
        }
        Insert: {
          completed?: boolean | null
          created_at?: string
          id?: string
          last_completed_step?: number | null
          last_save_attempt?: string | null
          save_count?: number | null
          session_id: string
          updated_at?: string | null
          used?: boolean | null
          wizard_data?: Json | null
        }
        Update: {
          completed?: boolean | null
          created_at?: string
          id?: string
          last_completed_step?: number | null
          last_save_attempt?: string | null
          save_count?: number | null
          session_id?: string
          updated_at?: string | null
          used?: boolean | null
          wizard_data?: Json | null
        }
        Relationships: []
      }
      blog_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author_id: string | null
          canonical_url: string | null
          content: string
          created_at: string
          description: string
          featured: boolean | null
          id: string
          image_url: string | null
          meta_description: string | null
          meta_keywords: string[] | null
          published: boolean | null
          published_at: string | null
          reading_time: number | null
          slug: string
          title: string
          updated_at: string
          views: number | null
        }
        Insert: {
          author_id?: string | null
          canonical_url?: string | null
          content: string
          created_at?: string
          description: string
          featured?: boolean | null
          id?: string
          image_url?: string | null
          meta_description?: string | null
          meta_keywords?: string[] | null
          published?: boolean | null
          published_at?: string | null
          reading_time?: number | null
          slug: string
          title: string
          updated_at?: string
          views?: number | null
        }
        Update: {
          author_id?: string | null
          canonical_url?: string | null
          content?: string
          created_at?: string
          description?: string
          featured?: boolean | null
          id?: string
          image_url?: string | null
          meta_description?: string | null
          meta_keywords?: string[] | null
          published?: boolean | null
          published_at?: string | null
          reading_time?: number | null
          slug?: string
          title?: string
          updated_at?: string
          views?: number | null
        }
        Relationships: []
      }
      blog_posts_categories: {
        Row: {
          category_id: string
          post_id: string
        }
        Insert: {
          category_id: string
          post_id: string
        }
        Update: {
          category_id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "blog_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_posts_categories_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_archetypes: {
        Row: {
          brand_voice: string
          communication_style: string
          created_at: string | null
          description: string
          examples: Json
          id: string
          motivations: Json
          name: string
          updated_at: string | null
          values: Json
        }
        Insert: {
          brand_voice: string
          communication_style: string
          created_at?: string | null
          description: string
          examples: Json
          id?: string
          motivations: Json
          name: string
          updated_at?: string | null
          values: Json
        }
        Update: {
          brand_voice?: string
          communication_style?: string
          created_at?: string | null
          description?: string
          examples?: Json
          id?: string
          motivations?: Json
          name?: string
          updated_at?: string | null
          values?: Json
        }
        Relationships: []
      }
      contact_submissions: {
        Row: {
          attachments: Json | null
          created_at: string
          email: string
          id: string
          message: string
          metadata: Json | null
          name: string
          status: Database["public"]["Enums"]["submission_status"] | null
        }
        Insert: {
          attachments?: Json | null
          created_at?: string
          email: string
          id?: string
          message: string
          metadata?: Json | null
          name: string
          status?: Database["public"]["Enums"]["submission_status"] | null
        }
        Update: {
          attachments?: Json | null
          created_at?: string
          email?: string
          id?: string
          message?: string
          metadata?: Json | null
          name?: string
          status?: Database["public"]["Enums"]["submission_status"] | null
        }
        Relationships: []
      }
      credit_operations: {
        Row: {
          created_at: string
          credits_amount: number
          error_message: string | null
          id: string
          operation_type: Database["public"]["Enums"]["credit_operation_type"]
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credits_amount: number
          error_message?: string | null
          id?: string
          operation_type?: Database["public"]["Enums"]["credit_operation_type"]
          status: string
          user_id: string
        }
        Update: {
          created_at?: string
          credits_amount?: number
          error_message?: string | null
          id?: string
          operation_type?: Database["public"]["Enums"]["credit_operation_type"]
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      data_backups: {
        Row: {
          backup_type: Database["public"]["Enums"]["backup_type"]
          created_at: string
          data: string
          id: string
          metadata: Json
          user_id: string
        }
        Insert: {
          backup_type?: Database["public"]["Enums"]["backup_type"]
          created_at?: string
          data: string
          id?: string
          metadata?: Json
          user_id: string
        }
        Update: {
          backup_type?: Database["public"]["Enums"]["backup_type"]
          created_at?: string
          data?: string
          id?: string
          metadata?: Json
          user_id?: string
        }
        Relationships: []
      }
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
        Relationships: [
          {
            foreignKeyName: "documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      facebook_ad_settings: {
        Row: {
          ad_language: string | null
          browser_addon: string | null
          call_to_action: string | null
          campaign_id: string | null
          created_at: string | null
          id: string
          updated_at: string | null
          url_parameters: string | null
          user_id: string
          visible_link: string | null
          website_url: string
        }
        Insert: {
          ad_language?: string | null
          browser_addon?: string | null
          call_to_action?: string | null
          campaign_id?: string | null
          created_at?: string | null
          id?: string
          updated_at?: string | null
          url_parameters?: string | null
          user_id: string
          visible_link?: string | null
          website_url: string
        }
        Update: {
          ad_language?: string | null
          browser_addon?: string | null
          call_to_action?: string | null
          campaign_id?: string | null
          created_at?: string | null
          id?: string
          updated_at?: string | null
          url_parameters?: string | null
          user_id?: string
          visible_link?: string | null
          website_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "facebook_ad_settings_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ad_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facebook_ad_settings_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaign_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      folders: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      free_tier_usage: {
        Row: {
          created_at: string
          generations_used: number | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          generations_used?: number | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          generations_used?: number | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      generated_content: {
        Row: {
          content: Json
          created_at: string
          headline: string
          id: string
          project_id: string | null
          subtitle: string
        }
        Insert: {
          content: Json
          created_at?: string
          headline: string
          id?: string
          project_id?: string | null
          subtitle: string
        }
        Update: {
          content?: Json
          created_at?: string
          headline?: string
          id?: string
          project_id?: string | null
          subtitle?: string
        }
        Relationships: [
          {
            foreignKeyName: "generated_content_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      landing_page_cache: {
        Row: {
          business_type: string | null
          content: Json | null
          created_at: string | null
          id: string
          last_used_at: string | null
          metadata: Json | null
          success_rate: number | null
          target_audience: Json | null
          used_count: number | null
          value_proposition: string | null
        }
        Insert: {
          business_type?: string | null
          content?: Json | null
          created_at?: string | null
          id?: string
          last_used_at?: string | null
          metadata?: Json | null
          success_rate?: number | null
          target_audience?: Json | null
          used_count?: number | null
          value_proposition?: string | null
        }
        Update: {
          business_type?: string | null
          content?: Json | null
          created_at?: string | null
          id?: string
          last_used_at?: string | null
          metadata?: Json | null
          success_rate?: number | null
          target_audience?: Json | null
          used_count?: number | null
          value_proposition?: string | null
        }
        Relationships: []
      }
      landing_page_documentation: {
        Row: {
          content: string
          created_at: string
          id: string
          metadata: Json | null
          section_name: string
          updated_at: string
          version: number | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          metadata?: Json | null
          section_name: string
          updated_at?: string
          version?: number | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          section_name?: string
          updated_at?: string
          version?: number | null
        }
        Relationships: []
      }
      landing_page_generation_logs: {
        Row: {
          api_status_code: number | null
          cache_hit: boolean | null
          created_at: string | null
          error_message: string | null
          generation_time: number | null
          id: string
          project_id: string | null
          request_payload: Json | null
          response_payload: Json | null
          status: string | null
          step_details: Json | null
          success: boolean | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          api_status_code?: number | null
          cache_hit?: boolean | null
          created_at?: string | null
          error_message?: string | null
          generation_time?: number | null
          id?: string
          project_id?: string | null
          request_payload?: Json | null
          response_payload?: Json | null
          status?: string | null
          step_details?: Json | null
          success?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          api_status_code?: number | null
          cache_hit?: boolean | null
          created_at?: string | null
          error_message?: string | null
          generation_time?: number | null
          id?: string
          project_id?: string | null
          request_payload?: Json | null
          response_payload?: Json | null
          status?: string | null
          step_details?: Json | null
          success?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "landing_page_generation_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      landing_page_templates: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          structure: Json
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          structure: Json
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          structure?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      landing_pages: {
        Row: {
          content: Json | null
          content_iterations: number | null
          content_version: number | null
          created_at: string | null
          generation_metadata: Json | null
          generation_started_at: string | null
          generation_status: string | null
          id: string
          last_generated_from: Json | null
          previous_version_id: string | null
          project_id: string | null
          published: boolean | null
          theme_settings: Json | null
          title: string
          updated_at: string | null
          user_id: string | null
          version: number | null
          views: number | null
        }
        Insert: {
          content?: Json | null
          content_iterations?: number | null
          content_version?: number | null
          created_at?: string | null
          generation_metadata?: Json | null
          generation_started_at?: string | null
          generation_status?: string | null
          id?: string
          last_generated_from?: Json | null
          previous_version_id?: string | null
          project_id?: string | null
          published?: boolean | null
          theme_settings?: Json | null
          title: string
          updated_at?: string | null
          user_id?: string | null
          version?: number | null
          views?: number | null
        }
        Update: {
          content?: Json | null
          content_iterations?: number | null
          content_version?: number | null
          created_at?: string | null
          generation_metadata?: Json | null
          generation_started_at?: string | null
          generation_status?: string | null
          id?: string
          last_generated_from?: Json | null
          previous_version_id?: string | null
          project_id?: string | null
          published?: boolean | null
          theme_settings?: Json | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
          version?: number | null
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "landing_pages_previous_version_id_fkey"
            columns: ["previous_version_id"]
            isOneToOne: false
            referencedRelation: "landing_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "landing_pages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      migration_locks: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          lock_type: string
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          lock_type: string
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          lock_type?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      newsletter_subscriptions: {
        Row: {
          confirmation_token: string | null
          confirmed: boolean | null
          created_at: string
          email: string
          id: string
          metadata: Json | null
          status: Database["public"]["Enums"]["submission_status"] | null
        }
        Insert: {
          confirmation_token?: string | null
          confirmed?: boolean | null
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          status?: Database["public"]["Enums"]["submission_status"] | null
        }
        Update: {
          confirmation_token?: string | null
          confirmed?: boolean | null
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          status?: Database["public"]["Enums"]["submission_status"] | null
        }
        Relationships: []
      }
      notes: {
        Row: {
          content: string | null
          created_at: string
          duration: number | null
          folder_id: string | null
          id: string
          source_url: string | null
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          duration?: number | null
          folder_id?: string | null
          id?: string
          source_url?: string | null
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          duration?: number | null
          folder_id?: string | null
          id?: string
          source_url?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding: {
        Row: {
          completed: boolean | null
          created_at: string
          id: string
          steps_completed: Json | null
          updated_at: string
          user_id: string
          user_type: string | null
        }
        Insert: {
          completed?: boolean | null
          created_at?: string
          id?: string
          steps_completed?: Json | null
          updated_at?: string
          user_id: string
          user_type?: string | null
        }
        Update: {
          completed?: boolean | null
          created_at?: string
          id?: string
          steps_completed?: Json | null
          updated_at?: string
          user_id?: string
          user_type?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          customer_email: string | null
          description: string | null
          id: string
          status: string
          stripe_payment_intent: string | null
          stripe_session_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          currency: string
          customer_email?: string | null
          description?: string | null
          id?: string
          status: string
          stripe_payment_intent?: string | null
          stripe_session_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          customer_email?: string | null
          description?: string | null
          id?: string
          status?: string
          stripe_payment_intent?: string | null
          stripe_session_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      plans: {
        Row: {
          active: boolean | null
          created_at: string
          credits: number
          description: string | null
          features: Json | null
          id: string
          name: string
          price: number
          stripe_price_id: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          credits: number
          description?: string | null
          features?: Json | null
          id?: string
          name: string
          price: number
          stripe_price_id?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          credits?: number
          description?: string | null
          features?: Json | null
          id?: string
          name?: string
          price?: number
          stripe_price_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      platform_connections: {
        Row: {
          access_token: string
          account_id: string | null
          account_name: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          platform: Database["public"]["Enums"]["ad_platform"]
          refresh_token: string | null
          token_expires_at: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          access_token: string
          account_id?: string | null
          account_name?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          platform: Database["public"]["Enums"]["ad_platform"]
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          access_token?: string
          account_id?: string | null
          account_name?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          platform?: Database["public"]["Enums"]["ad_platform"]
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          can_create_landing_pages: boolean | null
          created_at: string
          full_name: string | null
          id: string
          is_active: boolean | null
          is_admin: boolean | null
          is_business_owner: boolean | null
          language_preference: string | null
          payment_status: string | null
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          can_create_landing_pages?: boolean | null
          created_at?: string
          full_name?: string | null
          id: string
          is_active?: boolean | null
          is_admin?: boolean | null
          is_business_owner?: boolean | null
          language_preference?: string | null
          payment_status?: string | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          can_create_landing_pages?: boolean | null
          created_at?: string
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          is_admin?: boolean | null
          is_business_owner?: boolean | null
          language_preference?: string | null
          payment_status?: string | null
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          ad_dimensions: Json | null
          ad_format: string | null
          audience_analysis: Json | null
          brand_archetype: Json | null
          business_idea: Json | null
          created_at: string
          current_step: number | null
          description: string | null
          enhanced_audience_analysis: Json | null
          enhanced_persona: Json | null
          generated_ads: Json | null
          id: string
          marketing_campaign: Json | null
          psychological_driver: Json | null
          selected_hooks: Json | null
          status: string | null
          tags: string[] | null
          target_audience: Json | null
          title: string
          updated_at: string
          user_id: string
          video_ad_preferences: Json | null
          video_ad_settings: Json | null
          video_ads_enabled: boolean | null
        }
        Insert: {
          ad_dimensions?: Json | null
          ad_format?: string | null
          audience_analysis?: Json | null
          brand_archetype?: Json | null
          business_idea?: Json | null
          created_at?: string
          current_step?: number | null
          description?: string | null
          enhanced_audience_analysis?: Json | null
          enhanced_persona?: Json | null
          generated_ads?: Json | null
          id?: string
          marketing_campaign?: Json | null
          psychological_driver?: Json | null
          selected_hooks?: Json | null
          status?: string | null
          tags?: string[] | null
          target_audience?: Json | null
          title: string
          updated_at?: string
          user_id: string
          video_ad_preferences?: Json | null
          video_ad_settings?: Json | null
          video_ads_enabled?: boolean | null
        }
        Update: {
          ad_dimensions?: Json | null
          ad_format?: string | null
          audience_analysis?: Json | null
          brand_archetype?: Json | null
          business_idea?: Json | null
          created_at?: string
          current_step?: number | null
          description?: string | null
          enhanced_audience_analysis?: Json | null
          enhanced_persona?: Json | null
          generated_ads?: Json | null
          id?: string
          marketing_campaign?: Json | null
          psychological_driver?: Json | null
          selected_hooks?: Json | null
          status?: string | null
          tags?: string[] | null
          target_audience?: Json | null
          title?: string
          updated_at?: string
          user_id?: string
          video_ad_preferences?: Json | null
          video_ad_settings?: Json | null
          video_ads_enabled?: boolean | null
        }
        Relationships: []
      }
      psychological_drivers: {
        Row: {
          application_context: string
          created_at: string | null
          description: string
          emotional_touchpoints: Json
          id: string
          name: string
          persuasion_tactics: Json
          triggers: Json
          updated_at: string | null
        }
        Insert: {
          application_context: string
          created_at?: string | null
          description: string
          emotional_touchpoints: Json
          id?: string
          name: string
          persuasion_tactics: Json
          triggers: Json
          updated_at?: string | null
        }
        Update: {
          application_context?: string
          created_at?: string | null
          description?: string
          emotional_touchpoints?: Json
          id?: string
          name?: string
          persuasion_tactics?: Json
          triggers?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          active: boolean | null
          created_at: string
          credits_remaining: number
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_id: string | null
          stripe_customer_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          credits_remaining?: number
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id?: string | null
          stripe_customer_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          credits_remaining?: number
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id?: string | null
          stripe_customer_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      wizard_progress: {
        Row: {
          ad_format: Json | null
          audience_analysis: Json | null
          business_idea: Json | null
          created_at: string
          current_step: number | null
          generated_ads: Json | null
          id: string
          is_migration: boolean | null
          last_save_attempt: string | null
          lock_id: string | null
          locked_at: string | null
          migration_token: string | null
          selected_hooks: Json | null
          target_audience: Json | null
          updated_at: string
          user_id: string
          version: number | null
          video_ad_preferences: Json | null
        }
        Insert: {
          ad_format?: Json | null
          audience_analysis?: Json | null
          business_idea?: Json | null
          created_at?: string
          current_step?: number | null
          generated_ads?: Json | null
          id?: string
          is_migration?: boolean | null
          last_save_attempt?: string | null
          lock_id?: string | null
          locked_at?: string | null
          migration_token?: string | null
          selected_hooks?: Json | null
          target_audience?: Json | null
          updated_at?: string
          user_id: string
          version?: number | null
          video_ad_preferences?: Json | null
        }
        Update: {
          ad_format?: Json | null
          audience_analysis?: Json | null
          business_idea?: Json | null
          created_at?: string
          current_step?: number | null
          generated_ads?: Json | null
          id?: string
          is_migration?: boolean | null
          last_save_attempt?: string | null
          lock_id?: string | null
          locked_at?: string | null
          migration_token?: string | null
          selected_hooks?: Json | null
          target_audience?: Json | null
          updated_at?: string
          user_id?: string
          version?: number | null
          video_ad_preferences?: Json | null
        }
        Relationships: []
      }
    }
    Views: {
      ai_decision_stats: {
        Row: {
          campaign_id: string | null
          decisions_by_confidence: Json | null
          decisions_by_type: Json | null
          override_rate: number | null
          total_decisions: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_campaign_decisions_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ad_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_campaign_decisions_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaign_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_templates: {
        Row: {
          campaign_data: Json | null
          creation_mode: string | null
          id: string | null
          name: string | null
          platform: Database["public"]["Enums"]["ad_platform"] | null
          template_name: string | null
        }
        Insert: {
          campaign_data?: Json | null
          creation_mode?: string | null
          id?: string | null
          name?: string | null
          platform?: Database["public"]["Enums"]["ad_platform"] | null
          template_name?: string | null
        }
        Update: {
          campaign_data?: Json | null
          creation_mode?: string | null
          id?: string | null
          name?: string | null
          platform?: Database["public"]["Enums"]["ad_platform"] | null
          template_name?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_user_credits: {
        Args: { p_user_id: string; p_credits: number }
        Returns: {
          success: boolean
          current_credits: number
          error_message: string
        }[]
      }
      allocate_credits: {
        Args: {
          p_user_id: string
          p_credits: number
          p_payment_id: string
          p_description: string
        }
        Returns: {
          success: boolean
          message: string
        }[]
      }
      atomic_migration: {
        Args:
          | {
              p_user_id: string
              p_session_id: string
              p_calculated_step?: number
            }
          | { p_user_id: string; p_session_id: string }
        Returns: {
          ad_format: Json | null
          audience_analysis: Json | null
          business_idea: Json | null
          created_at: string
          current_step: number | null
          generated_ads: Json | null
          id: string
          is_migration: boolean | null
          last_save_attempt: string | null
          lock_id: string | null
          locked_at: string | null
          migration_token: string | null
          selected_hooks: Json | null
          target_audience: Json | null
          updated_at: string
          user_id: string
          version: number | null
          video_ad_preferences: Json | null
        }
      }
      check_credits_available: {
        Args: { p_user_id: string; required_credits: number }
        Returns: {
          has_credits: boolean
          credits_remaining: number
          error_message: string
        }[]
      }
      check_user_credits: {
        Args: { p_user_id: string; required_credits: number }
        Returns: {
          has_credits: boolean
          error_message: string
        }[]
      }
      cleanup_stale_locks: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      deduct_generation_credits: {
        Args: { p_user_id: string; required_credits: number }
        Returns: {
          success: boolean
          credits_remaining: number
          error_message: string
        }[]
      }
      deduct_user_credits: {
        Args: { input_user_id: string; credits_to_deduct: number }
        Returns: {
          success: boolean
          current_credits: number
          error_message: string
        }[]
      }
      has_role: {
        Args: { role_to_check: Database["public"]["Enums"]["app_role"] }
        Returns: boolean
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      log_credit_operation: {
        Args: {
          p_user_id: string
          p_operation_type: string
          p_credits_amount: number
          p_status: string
          p_error_message?: string
        }
        Returns: undefined
      }
      migrate_anonymous_to_authenticated: {
        Args: { p_session_id: string; p_user_id: string }
        Returns: Json
      }
      migrate_wizard_data: {
        Args: { p_user_id: string; p_session_id: string; p_wizard_data: Json }
        Returns: Json
      }
      migrate_wizard_progress: {
        Args: {
          p_user_id: string
          p_session_id: string
          p_business_idea: Json
          p_target_audience: Json
          p_audience_analysis: Json
          p_generated_ads: Json
          p_current_step: number
        }
        Returns: undefined
      }
      track_section_view: {
        Args: {
          p_landing_page_id: string
          p_section_name: string
          p_view_time: number
        }
        Returns: undefined
      }
      update_wizard_progress_with_lock: {
        Args: {
          p_user_id: string
          p_current_step: number
          p_business_idea: Json
          p_target_audience: Json
          p_audience_analysis: Json
          p_selected_hooks: Json
        }
        Returns: boolean
      }
    }
    Enums: {
      ad_platform: "facebook" | "google" | "linkedin" | "tiktok"
      app_role: "admin" | "user"
      backup_type: "auto" | "manual"
      contact_submission_status: "pending" | "processed" | "completed"
      credit_operation_type: "credit_add" | "credit_deduct" | "credit_refund"
      image_generation_status: "pending" | "completed" | "failed"
      landing_page_generation_status:
        | "queued"
        | "generating_content"
        | "generating_images"
        | "applying_styles"
        | "completed"
        | "failed"
      submission_status: "pending" | "processed" | "failed"
      update_type: "feature" | "update" | "incident" | "announcement"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      ad_platform: ["facebook", "google", "linkedin", "tiktok"],
      app_role: ["admin", "user"],
      backup_type: ["auto", "manual"],
      contact_submission_status: ["pending", "processed", "completed"],
      credit_operation_type: ["credit_add", "credit_deduct", "credit_refund"],
      image_generation_status: ["pending", "completed", "failed"],
      landing_page_generation_status: [
        "queued",
        "generating_content",
        "generating_images",
        "applying_styles",
        "completed",
        "failed",
      ],
      submission_status: ["pending", "processed", "failed"],
      update_type: ["feature", "update", "incident", "announcement"],
    },
  },
} as const
