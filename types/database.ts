export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
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
          status: Database["public"]["Enums"]["content_status"]
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
          status?: Database["public"]["Enums"]["content_status"]
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
          status?: Database["public"]["Enums"]["content_status"]
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
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
            foreignKeyName: "content_calendar_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
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
          status: Database["public"]["Enums"]["job_status"]
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
          status?: Database["public"]["Enums"]["job_status"]
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
          status?: Database["public"]["Enums"]["job_status"]
        }
        Relationships: [
          {
            foreignKeyName: "job_executions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      location_pages: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          city: string
          content: Json
          created_at: string
          created_by: string | null
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
          status: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at: string
          zip_codes: string[] | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          city: string
          content?: Json
          created_at?: string
          created_by?: string | null
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
          status?: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at?: string
          zip_codes?: string[] | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          city?: string
          content?: Json
          created_at?: string
          created_by?: string | null
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
          status?: Database["public"]["Enums"]["content_status"]
          title?: string
          updated_at?: string
          zip_codes?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "location_pages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
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
          type: Database["public"]["Enums"]["media_type"]
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
          type: Database["public"]["Enums"]["media_type"]
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
          type?: Database["public"]["Enums"]["media_type"]
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "media_assets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
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
      service_pages: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          content: Json
          created_at: string
          created_by: string | null
          id: string
          keywords: string[] | null
          meta_description: string | null
          meta_title: string | null
          organization_id: string
          published_at: string | null
          rejection_note: string | null
          seo_score: number | null
          slug: string
          status: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          content?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          keywords?: string[] | null
          meta_description?: string | null
          meta_title?: string | null
          organization_id: string
          published_at?: string | null
          rejection_note?: string | null
          seo_score?: number | null
          slug: string
          status?: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          content?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          keywords?: string[] | null
          meta_description?: string | null
          meta_title?: string | null
          organization_id?: string
          published_at?: string | null
          rejection_note?: string | null
          seo_score?: number | null
          slug?: string
          status?: Database["public"]["Enums"]["content_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_pages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
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
            foreignKeyName: "user_organizations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
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
      content_status: "draft" | "review" | "approved" | "published" | "archived"
      job_status: "queued" | "processing" | "completed" | "failed" | "cancelled"
      media_type: "image" | "video" | "document"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      content_status: ["draft", "review", "approved", "published", "archived"],
      job_status: ["queued", "processing", "completed", "failed", "cancelled"],
      media_type: ["image", "video", "document"],
    },
  },
} as const
