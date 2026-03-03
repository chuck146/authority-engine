// Auto-generated types from Supabase schema.
// Regenerate with: npm run db:gen-types
// This is a hand-written skeleton until the Supabase project is connected.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          slug: string
          domain: string | null
          logo_url: string | null
          branding: Json
          settings: Json
          plan: 'free' | 'starter' | 'pro' | 'enterprise'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          domain?: string | null
          logo_url?: string | null
          branding?: Json
          settings?: Json
          plan?: 'free' | 'starter' | 'pro' | 'enterprise'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          domain?: string | null
          logo_url?: string | null
          branding?: Json
          settings?: Json
          plan?: 'free' | 'starter' | 'pro' | 'enterprise'
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_organizations: {
        Row: {
          id: string
          user_id: string
          organization_id: string
          role: 'owner' | 'admin' | 'editor' | 'viewer'
          is_default: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          organization_id: string
          role?: 'owner' | 'admin' | 'editor' | 'viewer'
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          organization_id?: string
          role?: 'owner' | 'admin' | 'editor' | 'viewer'
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'user_organizations_organization_id_fkey'
            columns: ['organization_id']
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      service_pages: {
        Row: {
          id: string
          organization_id: string
          title: string
          slug: string
          meta_title: string | null
          meta_description: string | null
          content: Json
          status: 'draft' | 'review' | 'approved' | 'published' | 'archived'
          seo_score: number | null
          keywords: string[]
          created_by: string | null
          approved_by: string | null
          approved_at: string | null
          rejection_note: string | null
          published_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          title: string
          slug: string
          meta_title?: string | null
          meta_description?: string | null
          content?: Json
          status?: 'draft' | 'review' | 'approved' | 'published' | 'archived'
          seo_score?: number | null
          keywords?: string[]
          created_by?: string | null
          approved_by?: string | null
          approved_at?: string | null
          rejection_note?: string | null
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          title?: string
          slug?: string
          meta_title?: string | null
          meta_description?: string | null
          content?: Json
          status?: 'draft' | 'review' | 'approved' | 'published' | 'archived'
          seo_score?: number | null
          keywords?: string[]
          created_by?: string | null
          approved_by?: string | null
          approved_at?: string | null
          rejection_note?: string | null
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'service_pages_organization_id_fkey'
            columns: ['organization_id']
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      location_pages: {
        Row: {
          id: string
          organization_id: string
          title: string
          slug: string
          city: string
          state: string
          zip_codes: string[]
          meta_title: string | null
          meta_description: string | null
          content: Json
          status: 'draft' | 'review' | 'approved' | 'published' | 'archived'
          seo_score: number | null
          keywords: string[]
          latitude: number | null
          longitude: number | null
          created_by: string | null
          approved_by: string | null
          approved_at: string | null
          rejection_note: string | null
          published_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          title: string
          slug: string
          city: string
          state: string
          zip_codes?: string[]
          meta_title?: string | null
          meta_description?: string | null
          content?: Json
          status?: 'draft' | 'review' | 'approved' | 'published' | 'archived'
          seo_score?: number | null
          keywords?: string[]
          latitude?: number | null
          longitude?: number | null
          created_by?: string | null
          approved_by?: string | null
          approved_at?: string | null
          rejection_note?: string | null
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          title?: string
          slug?: string
          city?: string
          state?: string
          zip_codes?: string[]
          meta_title?: string | null
          meta_description?: string | null
          content?: Json
          status?: 'draft' | 'review' | 'approved' | 'published' | 'archived'
          seo_score?: number | null
          keywords?: string[]
          latitude?: number | null
          longitude?: number | null
          created_by?: string | null
          approved_by?: string | null
          approved_at?: string | null
          rejection_note?: string | null
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'location_pages_organization_id_fkey'
            columns: ['organization_id']
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      blog_posts: {
        Row: {
          id: string
          organization_id: string
          title: string
          slug: string
          excerpt: string | null
          meta_title: string | null
          meta_description: string | null
          content: Json
          featured_image_url: string | null
          category: string | null
          tags: string[]
          status: 'draft' | 'review' | 'approved' | 'published' | 'archived'
          seo_score: number | null
          keywords: string[]
          reading_time_minutes: number | null
          created_by: string | null
          approved_by: string | null
          approved_at: string | null
          rejection_note: string | null
          published_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          title: string
          slug: string
          excerpt?: string | null
          meta_title?: string | null
          meta_description?: string | null
          content?: Json
          featured_image_url?: string | null
          category?: string | null
          tags?: string[]
          status?: 'draft' | 'review' | 'approved' | 'published' | 'archived'
          seo_score?: number | null
          keywords?: string[]
          reading_time_minutes?: number | null
          created_by?: string | null
          approved_by?: string | null
          approved_at?: string | null
          rejection_note?: string | null
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          title?: string
          slug?: string
          excerpt?: string | null
          meta_title?: string | null
          meta_description?: string | null
          content?: Json
          featured_image_url?: string | null
          category?: string | null
          tags?: string[]
          status?: 'draft' | 'review' | 'approved' | 'published' | 'archived'
          seo_score?: number | null
          keywords?: string[]
          reading_time_minutes?: number | null
          created_by?: string | null
          approved_by?: string | null
          approved_at?: string | null
          rejection_note?: string | null
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'blog_posts_organization_id_fkey'
            columns: ['organization_id']
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      media_assets: {
        Row: {
          id: string
          organization_id: string
          type: 'image' | 'video' | 'document'
          filename: string
          storage_path: string
          storage_provider: 'supabase' | 'r2'
          mime_type: string
          size_bytes: number | null
          width: number | null
          height: number | null
          duration_seconds: number | null
          alt_text: string | null
          metadata: Json
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          type: 'image' | 'video' | 'document'
          filename: string
          storage_path: string
          storage_provider?: 'supabase' | 'r2'
          mime_type: string
          size_bytes?: number | null
          width?: number | null
          height?: number | null
          duration_seconds?: number | null
          alt_text?: string | null
          metadata?: Json
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          type?: 'image' | 'video' | 'document'
          filename?: string
          storage_path?: string
          storage_provider?: 'supabase' | 'r2'
          mime_type?: string
          size_bytes?: number | null
          width?: number | null
          height?: number | null
          duration_seconds?: number | null
          alt_text?: string | null
          metadata?: Json
          created_by?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'media_assets_organization_id_fkey'
            columns: ['organization_id']
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      job_executions: {
        Row: {
          id: string
          organization_id: string
          queue_name: string
          job_type: string
          status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled'
          payload: Json
          result: Json | null
          error_message: string | null
          attempts: number
          max_attempts: number
          started_at: string | null
          completed_at: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          queue_name: string
          job_type: string
          status?: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled'
          payload?: Json
          result?: Json | null
          error_message?: string | null
          attempts?: number
          max_attempts?: number
          started_at?: string | null
          completed_at?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          queue_name?: string
          job_type?: string
          status?: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled'
          payload?: Json
          result?: Json | null
          error_message?: string | null
          attempts?: number
          max_attempts?: number
          started_at?: string | null
          completed_at?: string | null
          created_by?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'job_executions_organization_id_fkey'
            columns: ['organization_id']
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: Record<string, never>
    Functions: {
      get_org_id: {
        Args: Record<string, never>
        Returns: string | null
      }
      get_user_id: {
        Args: Record<string, never>
        Returns: string | null
      }
    }
    Enums: {
      content_status: 'draft' | 'review' | 'approved' | 'published' | 'archived'
      media_type: 'image' | 'video' | 'document'
      job_status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled'
    }
    CompositeTypes: Record<string, never>
  }
}
