export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.1'
  }
  public: {
    Tables: {
      blog_posts: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          category: string | null
          content: Json
          created_at: string
          created_by: string | null
          excerpt: string | null
          featured_image_url: string | null
          id: string
          keywords: string[] | null
          meta_description: string | null
          meta_title: string | null
          organization_id: string
          published_at: string | null
          reading_time_minutes: number | null
          rejection_note: string | null
          seo_score: number | null
          slug: string
          status: Database['public']['Enums']['content_status']
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          category?: string | null
          content?: Json
          created_at?: string
          created_by?: string | null
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          keywords?: string[] | null
          meta_description?: string | null
          meta_title?: string | null
          organization_id: string
          published_at?: string | null
          reading_time_minutes?: number | null
          rejection_note?: string | null
          seo_score?: number | null
          slug: string
          status?: Database['public']['Enums']['content_status']
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          category?: string | null
          content?: Json
          created_at?: string
          created_by?: string | null
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          keywords?: string[] | null
          meta_description?: string | null
          meta_title?: string | null
          organization_id?: string
          published_at?: string | null
          reading_time_minutes?: number | null
          rejection_note?: string | null
          seo_score?: number | null
          slug?: string
          status?: Database['public']['Enums']['content_status']
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'blog_posts_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      content_calendar: {
        Row: {
          content_id: string
          content_type: string
          created_at: string
          created_by: string | null
          error_message: string | null
          id: string
          organization_id: string
          published_at: string | null
          scheduled_at: string
          status: string
          updated_at: string
        }
        Insert: {
          content_id: string
          content_type: string
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          id?: string
          organization_id: string
          published_at?: string | null
          scheduled_at: string
          status?: string
          updated_at?: string
        }
        Update: {
          content_id?: string
          content_type?: string
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          id?: string
          organization_id?: string
          published_at?: string | null
          scheduled_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'content_calendar_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      ga4_page_metrics: {
        Row: {
          avg_session_duration: number
          bounce_rate: number
          created_at: string
          date: string
          engagement_rate: number
          id: string
          organization_id: string
          page_path: string
          page_title: string
          pageviews: number
          sessions: number
          users: number
        }
        Insert: {
          avg_session_duration?: number
          bounce_rate?: number
          created_at?: string
          date: string
          engagement_rate?: number
          id?: string
          organization_id: string
          page_path: string
          page_title?: string
          pageviews?: number
          sessions?: number
          users?: number
        }
        Update: {
          avg_session_duration?: number
          bounce_rate?: number
          created_at?: string
          date?: string
          engagement_rate?: number
          id?: string
          organization_id?: string
          page_path?: string
          page_title?: string
          pageviews?: number
          sessions?: number
          users?: number
        }
        Relationships: [
          {
            foreignKeyName: 'ga4_page_metrics_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      ga4_snapshots: {
        Row: {
          created_at: string
          data: Json
          id: string
          organization_id: string
          snapshot_date: string
          snapshot_type: string
        }
        Insert: {
          created_at?: string
          data?: Json
          id?: string
          organization_id: string
          snapshot_date: string
          snapshot_type: string
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
          organization_id?: string
          snapshot_date?: string
          snapshot_type?: string
        }
        Relationships: [
          {
            foreignKeyName: 'ga4_snapshots_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      google_connections: {
        Row: {
          access_token: string
          connected_by: string
          created_at: string
          id: string
          last_synced_at: string | null
          organization_id: string
          provider: string
          refresh_token: string
          scopes: string[]
          site_url: string
          status: string
          sync_error: string | null
          token_expires_at: string
          updated_at: string
        }
        Insert: {
          access_token: string
          connected_by: string
          created_at?: string
          id?: string
          last_synced_at?: string | null
          organization_id: string
          provider: string
          refresh_token: string
          scopes?: string[]
          site_url?: string
          status?: string
          sync_error?: string | null
          token_expires_at: string
          updated_at?: string
        }
        Update: {
          access_token?: string
          connected_by?: string
          created_at?: string
          id?: string
          last_synced_at?: string | null
          organization_id?: string
          provider?: string
          refresh_token?: string
          scopes?: string[]
          site_url?: string
          status?: string
          sync_error?: string | null
          token_expires_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'google_connections_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      gsc_snapshots: {
        Row: {
          created_at: string
          data: Json
          id: string
          organization_id: string
          snapshot_date: string
          snapshot_type: string
        }
        Insert: {
          created_at?: string
          data?: Json
          id?: string
          organization_id: string
          snapshot_date: string
          snapshot_type: string
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
          organization_id?: string
          snapshot_date?: string
          snapshot_type?: string
        }
        Relationships: [
          {
            foreignKeyName: 'gsc_snapshots_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      job_executions: {
        Row: {
          attempts: number
          completed_at: string | null
          created_at: string
          created_by: string | null
          error_message: string | null
          id: string
          job_type: string
          max_attempts: number
          organization_id: string
          payload: Json
          queue_name: string
          result: Json | null
          started_at: string | null
          status: Database['public']['Enums']['job_status']
        }
        Insert: {
          attempts?: number
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          id?: string
          job_type: string
          max_attempts?: number
          organization_id: string
          payload?: Json
          queue_name: string
          result?: Json | null
          started_at?: string | null
          status?: Database['public']['Enums']['job_status']
        }
        Update: {
          attempts?: number
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          id?: string
          job_type?: string
          max_attempts?: number
          organization_id?: string
          payload?: Json
          queue_name?: string
          result?: Json | null
          started_at?: string | null
          status?: Database['public']['Enums']['job_status']
        }
        Relationships: [
          {
            foreignKeyName: 'job_executions_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      keyword_rankings: {
        Row: {
          clicks: number
          country: string
          created_at: string
          ctr: number
          date: string
          device: string
          id: string
          impressions: number
          organization_id: string
          page: string
          position: number
          query: string
        }
        Insert: {
          clicks?: number
          country?: string
          created_at?: string
          ctr?: number
          date: string
          device?: string
          id?: string
          impressions?: number
          organization_id: string
          page: string
          position?: number
          query: string
        }
        Update: {
          clicks?: number
          country?: string
          created_at?: string
          ctr?: number
          date?: string
          device?: string
          id?: string
          impressions?: number
          organization_id?: string
          page?: string
          position?: number
          query?: string
        }
        Relationships: [
          {
            foreignKeyName: 'keyword_rankings_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      leads: {
        Row: {
          created_at: string | null
          email: string
          id: string
          message: string | null
          name: string
          organization_id: string
          phone: string
          service: string | null
          status: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          message?: string | null
          name: string
          organization_id: string
          phone: string
          service?: string | null
          status?: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          message?: string | null
          name?: string
          organization_id?: string
          phone?: string
          service?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: 'leads_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      location_pages: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          city: string
          content: Json
          county: string | null
          created_at: string
          created_by: string | null
          hero_image_url: string | null
          id: string
          keywords: string[] | null
          latitude: number | null
          longitude: number | null
          meta_description: string | null
          meta_title: string | null
          organization_id: string
          published_at: string | null
          rejection_note: string | null
          seo_score: number | null
          slug: string
          state: string
          status: Database['public']['Enums']['content_status']
          title: string
          updated_at: string
          zip_codes: string[] | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          city: string
          content?: Json
          county?: string | null
          created_at?: string
          created_by?: string | null
          hero_image_url?: string | null
          id?: string
          keywords?: string[] | null
          latitude?: number | null
          longitude?: number | null
          meta_description?: string | null
          meta_title?: string | null
          organization_id: string
          published_at?: string | null
          rejection_note?: string | null
          seo_score?: number | null
          slug: string
          state: string
          status?: Database['public']['Enums']['content_status']
          title: string
          updated_at?: string
          zip_codes?: string[] | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          city?: string
          content?: Json
          county?: string | null
          created_at?: string
          created_by?: string | null
          hero_image_url?: string | null
          id?: string
          keywords?: string[] | null
          latitude?: number | null
          longitude?: number | null
          meta_description?: string | null
          meta_title?: string | null
          organization_id?: string
          published_at?: string | null
          rejection_note?: string | null
          seo_score?: number | null
          slug?: string
          state?: string
          status?: Database['public']['Enums']['content_status']
          title?: string
          updated_at?: string
          zip_codes?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: 'location_pages_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      media_assets: {
        Row: {
          alt_text: string | null
          created_at: string
          created_by: string | null
          duration_seconds: number | null
          filename: string
          height: number | null
          id: string
          metadata: Json
          mime_type: string
          organization_id: string
          size_bytes: number | null
          storage_path: string
          storage_provider: string
          type: Database['public']['Enums']['media_type']
          width: number | null
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          created_by?: string | null
          duration_seconds?: number | null
          filename: string
          height?: number | null
          id?: string
          metadata?: Json
          mime_type: string
          organization_id: string
          size_bytes?: number | null
          storage_path: string
          storage_provider?: string
          type: Database['public']['Enums']['media_type']
          width?: number | null
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          created_by?: string | null
          duration_seconds?: number | null
          filename?: string
          height?: number | null
          id?: string
          metadata?: Json
          mime_type?: string
          organization_id?: string
          size_bytes?: number | null
          storage_path?: string
          storage_provider?: string
          type?: Database['public']['Enums']['media_type']
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'media_assets_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      organizations: {
        Row: {
          branding: Json
          created_at: string
          domain: string | null
          id: string
          logo_url: string | null
          name: string
          plan: string
          settings: Json
          slug: string
          updated_at: string
        }
        Insert: {
          branding?: Json
          created_at?: string
          domain?: string | null
          id?: string
          logo_url?: string | null
          name: string
          plan?: string
          settings?: Json
          slug: string
          updated_at?: string
        }
        Update: {
          branding?: Json
          created_at?: string
          domain?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          plan?: string
          settings?: Json
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      review_requests: {
        Row: {
          channel: string
          completed_at: string | null
          created_at: string | null
          created_by: string
          customer_email: string | null
          customer_name: string
          customer_phone: string | null
          delivered_at: string | null
          error_message: string | null
          id: string
          metadata: Json | null
          organization_id: string
          review_id: string | null
          review_url: string
          sent_at: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          channel: string
          completed_at?: string | null
          created_at?: string | null
          created_by: string
          customer_email?: string | null
          customer_name: string
          customer_phone?: string | null
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          organization_id: string
          review_id?: string | null
          review_url: string
          sent_at?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          channel?: string
          completed_at?: string | null
          created_at?: string | null
          created_by?: string
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string | null
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          organization_id?: string
          review_id?: string | null
          review_url?: string
          sent_at?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'review_requests_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'review_requests_review_id_fkey'
            columns: ['review_id']
            isOneToOne: false
            referencedRelation: 'reviews'
            referencedColumns: ['id']
          },
        ]
      }
      reviews: {
        Row: {
          created_at: string | null
          created_by: string | null
          external_id: string | null
          id: string
          metadata: Json | null
          organization_id: string
          platform: string
          rating: number
          response_approved_at: string | null
          response_approved_by: string | null
          response_generated_at: string | null
          response_sent_at: string | null
          response_status: string
          response_text: string | null
          review_date: string
          review_text: string | null
          reviewer_name: string
          reviewer_profile_url: string | null
          sentiment: string | null
          sentiment_score: number | null
          synced_at: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          external_id?: string | null
          id?: string
          metadata?: Json | null
          organization_id: string
          platform: string
          rating: number
          response_approved_at?: string | null
          response_approved_by?: string | null
          response_generated_at?: string | null
          response_sent_at?: string | null
          response_status?: string
          response_text?: string | null
          review_date: string
          review_text?: string | null
          reviewer_name: string
          reviewer_profile_url?: string | null
          sentiment?: string | null
          sentiment_score?: number | null
          synced_at?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          external_id?: string | null
          id?: string
          metadata?: Json | null
          organization_id?: string
          platform?: string
          rating?: number
          response_approved_at?: string | null
          response_approved_by?: string | null
          response_generated_at?: string | null
          response_sent_at?: string | null
          response_status?: string
          response_text?: string | null
          review_date?: string
          review_text?: string | null
          reviewer_name?: string
          reviewer_profile_url?: string | null
          sentiment?: string | null
          sentiment_score?: number | null
          synced_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'reviews_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      service_pages: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          content: Json
          created_at: string
          created_by: string | null
          hero_image_url: string | null
          id: string
          keywords: string[] | null
          meta_description: string | null
          meta_title: string | null
          organization_id: string
          published_at: string | null
          rejection_note: string | null
          seo_score: number | null
          slug: string
          status: Database['public']['Enums']['content_status']
          title: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          content?: Json
          created_at?: string
          created_by?: string | null
          hero_image_url?: string | null
          id?: string
          keywords?: string[] | null
          meta_description?: string | null
          meta_title?: string | null
          organization_id: string
          published_at?: string | null
          rejection_note?: string | null
          seo_score?: number | null
          slug: string
          status?: Database['public']['Enums']['content_status']
          title: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          content?: Json
          created_at?: string
          created_by?: string | null
          hero_image_url?: string | null
          id?: string
          keywords?: string[] | null
          meta_description?: string | null
          meta_title?: string | null
          organization_id?: string
          published_at?: string | null
          rejection_note?: string | null
          seo_score?: number | null
          slug?: string
          status?: Database['public']['Enums']['content_status']
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'service_pages_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      social_posts: {
        Row: {
          body: string
          created_at: string | null
          created_by: string
          cta_type: string | null
          cta_url: string | null
          hashtags: string[] | null
          id: string
          keywords: string[] | null
          media_asset_id: string | null
          metadata: Json | null
          organization_id: string
          platform: string
          post_type: string
          published_at: string | null
          status: string
          title: string | null
          updated_at: string | null
        }
        Insert: {
          body: string
          created_at?: string | null
          created_by: string
          cta_type?: string | null
          cta_url?: string | null
          hashtags?: string[] | null
          id?: string
          keywords?: string[] | null
          media_asset_id?: string | null
          metadata?: Json | null
          organization_id: string
          platform: string
          post_type?: string
          published_at?: string | null
          status?: string
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          body?: string
          created_at?: string | null
          created_by?: string
          cta_type?: string | null
          cta_url?: string | null
          hashtags?: string[] | null
          id?: string
          keywords?: string[] | null
          media_asset_id?: string | null
          metadata?: Json | null
          organization_id?: string
          platform?: string
          post_type?: string
          published_at?: string | null
          status?: string
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'social_posts_media_asset_id_fkey'
            columns: ['media_asset_id']
            isOneToOne: false
            referencedRelation: 'media_assets'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'social_posts_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      user_organizations: {
        Row: {
          created_at: string
          id: string
          is_default: boolean
          organization_id: string
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_default?: boolean
          organization_id: string
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_default?: boolean
          organization_id?: string
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'user_organizations_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      custom_access_token_hook: { Args: { event: Json }; Returns: Json }
      get_org_id: { Args: never; Returns: string }
      get_user_id: { Args: never; Returns: string }
    }
    Enums: {
      content_status: 'draft' | 'review' | 'approved' | 'published' | 'archived'
      job_status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled'
      media_type: 'image' | 'video' | 'document'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      content_status: ['draft', 'review', 'approved', 'published', 'archived'],
      job_status: ['queued', 'processing', 'completed', 'failed', 'cancelled'],
      media_type: ['image', 'video', 'document'],
    },
  },
} as const
