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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      competitor_metrics: {
        Row: {
          competitor_id: string
          engagement_rate: number | null
          followers_count: number
          following_count: number | null
          id: string
          posts_count: number | null
          recorded_at: string
        }
        Insert: {
          competitor_id: string
          engagement_rate?: number | null
          followers_count?: number
          following_count?: number | null
          id?: string
          posts_count?: number | null
          recorded_at?: string
        }
        Update: {
          competitor_id?: string
          engagement_rate?: number | null
          followers_count?: number
          following_count?: number | null
          id?: string
          posts_count?: number | null
          recorded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "competitor_metrics_competitor_id_fkey"
            columns: ["competitor_id"]
            isOneToOne: false
            referencedRelation: "competitors"
            referencedColumns: ["id"]
          },
        ]
      }
      competitors: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          platform: string
          profile_url: string | null
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          platform: string
          profile_url?: string | null
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          platform?: string
          profile_url?: string | null
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      connected_accounts: {
        Row: {
          access_token: string
          created_at: string
          id: string
          platform: string
          platform_user_id: string
          refresh_token: string | null
          token_expires_at: string | null
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          access_token: string
          created_at?: string
          id?: string
          platform: string
          platform_user_id: string
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          access_token?: string
          created_at?: string
          id?: string
          platform?: string
          platform_user_id?: string
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "connected_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      content_templates: {
        Row: {
          category: string | null
          content: string | null
          created_at: string | null
          description: string | null
          hashtags: string[] | null
          id: string
          media_type: string | null
          name: string
          platform: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          description?: string | null
          hashtags?: string[] | null
          id?: string
          media_type?: string | null
          name: string
          platform: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          description?: string | null
          hashtags?: string[] | null
          id?: string
          media_type?: string | null
          name?: string
          platform?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notification_settings: {
        Row: {
          created_at: string
          email_notifications: boolean
          id: string
          threshold_percent: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_notifications?: boolean
          id?: string
          threshold_percent?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_notifications?: boolean
          id?: string
          threshold_percent?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      post_analytics: {
        Row: {
          comments_count: number | null
          created_at: string | null
          engagement_rate: number | null
          id: string
          likes_count: number | null
          platform: string
          platform_post_id: string | null
          reach: number | null
          recorded_at: string | null
          saves_count: number | null
          scheduled_post_id: string
          shares_count: number | null
          updated_at: string | null
          user_id: string
          views_count: number | null
        }
        Insert: {
          comments_count?: number | null
          created_at?: string | null
          engagement_rate?: number | null
          id?: string
          likes_count?: number | null
          platform: string
          platform_post_id?: string | null
          reach?: number | null
          recorded_at?: string | null
          saves_count?: number | null
          scheduled_post_id: string
          shares_count?: number | null
          updated_at?: string | null
          user_id: string
          views_count?: number | null
        }
        Update: {
          comments_count?: number | null
          created_at?: string | null
          engagement_rate?: number | null
          id?: string
          likes_count?: number | null
          platform?: string
          platform_post_id?: string | null
          reach?: number | null
          recorded_at?: string | null
          saves_count?: number | null
          scheduled_post_id?: string
          shares_count?: number | null
          updated_at?: string | null
          user_id?: string
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "post_analytics_scheduled_post_id_fkey"
            columns: ["scheduled_post_id"]
            isOneToOne: false
            referencedRelation: "scheduled_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_drafts: {
        Row: {
          account_id: string | null
          content: string | null
          created_at: string | null
          hashtags: string[] | null
          id: string
          media_type: string | null
          media_urls: string[] | null
          notes: string | null
          platform: string | null
          template_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_id?: string | null
          content?: string | null
          created_at?: string | null
          hashtags?: string[] | null
          id?: string
          media_type?: string | null
          media_urls?: string[] | null
          notes?: string | null
          platform?: string | null
          template_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_id?: string | null
          content?: string | null
          created_at?: string | null
          hashtags?: string[] | null
          id?: string
          media_type?: string | null
          media_urls?: string[] | null
          notes?: string | null
          platform?: string | null
          template_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_drafts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "connected_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_drafts_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "content_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          account_id: string
          comments_count: number
          content: string | null
          created_at: string
          engagement_rate: number | null
          id: string
          likes_count: number
          media_url: string | null
          platform_post_id: string
          posted_at: string | null
          shares_count: number
          updated_at: string
          views_count: number
        }
        Insert: {
          account_id: string
          comments_count?: number
          content?: string | null
          created_at?: string
          engagement_rate?: number | null
          id?: string
          likes_count?: number
          media_url?: string | null
          platform_post_id: string
          posted_at?: string | null
          shares_count?: number
          updated_at?: string
          views_count?: number
        }
        Update: {
          account_id?: string
          comments_count?: number
          content?: string | null
          created_at?: string
          engagement_rate?: number | null
          id?: string
          likes_count?: number
          media_url?: string | null
          platform_post_id?: string
          posted_at?: string | null
          shares_count?: number
          updated_at?: string
          views_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "posts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "connected_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          subscription_plan: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          subscription_plan?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          subscription_plan?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      scheduled_posts: {
        Row: {
          account_id: string
          content: string | null
          created_at: string
          error_message: string | null
          id: string
          is_recurring: boolean | null
          media_type: string
          media_urls: string[]
          parent_post_id: string | null
          platform: string
          platform_post_id: string | null
          published_at: string | null
          recurrence_end_date: string | null
          recurrence_pattern: string | null
          scheduled_for: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id: string
          content?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          is_recurring?: boolean | null
          media_type: string
          media_urls?: string[]
          parent_post_id?: string | null
          platform: string
          platform_post_id?: string | null
          published_at?: string | null
          recurrence_end_date?: string | null
          recurrence_pattern?: string | null
          scheduled_for: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string
          content?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          is_recurring?: boolean | null
          media_type?: string
          media_urls?: string[]
          parent_post_id?: string | null
          platform?: string
          platform_post_id?: string | null
          published_at?: string | null
          recurrence_end_date?: string | null
          recurrence_pattern?: string | null
          scheduled_for?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_posts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "connected_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_posts_parent_post_id_fkey"
            columns: ["parent_post_id"]
            isOneToOne: false
            referencedRelation: "scheduled_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      social_metrics: {
        Row: {
          account_id: string
          comments_count: number | null
          engagement_rate: number | null
          followers_count: number
          following_count: number | null
          id: string
          likes_count: number | null
          posts_count: number | null
          recorded_at: string
          views_count: number | null
        }
        Insert: {
          account_id: string
          comments_count?: number | null
          engagement_rate?: number | null
          followers_count?: number
          following_count?: number | null
          id?: string
          likes_count?: number | null
          posts_count?: number | null
          recorded_at?: string
          views_count?: number | null
        }
        Update: {
          account_id?: string
          comments_count?: number | null
          engagement_rate?: number | null
          followers_count?: number
          following_count?: number | null
          id?: string
          likes_count?: number | null
          posts_count?: number | null
          recorded_at?: string
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "social_metrics_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "connected_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      team_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          role: Database["public"]["Enums"]["team_role"]
          team_id: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          role?: Database["public"]["Enums"]["team_role"]
          team_id: string
          token?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          role?: Database["public"]["Enums"]["team_role"]
          team_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_invitations_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["team_role"]
          team_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["team_role"]
          team_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["team_role"]
          team_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          name: string
          owner_id: string
          slug: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          name: string
          owner_id: string
          slug: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_team_role: {
        Args: { _team_id: string; _user_id: string }
        Returns: Database["public"]["Enums"]["team_role"]
      }
      is_team_member: {
        Args: { _team_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      team_role: "owner" | "admin" | "member" | "viewer"
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
      team_role: ["owner", "admin", "member", "viewer"],
    },
  },
} as const
