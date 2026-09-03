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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      contact_messages: {
        Row: {
          email: string
          id: string
          message: string
          name: string
          submitted_at: string
        }
        Insert: {
          email: string
          id?: string
          message: string
          name: string
          submitted_at?: string
        }
        Update: {
          email?: string
          id?: string
          message?: string
          name?: string
          submitted_at?: string
        }
        Relationships: []
      }
      education_articles: {
        Row: {
          body: string
          category: string
          created_at: string
          id: string
          read_time_minutes: number
          slug: string
          summary: string
          title: string
        }
        Insert: {
          body: string
          category: string
          created_at?: string
          id?: string
          read_time_minutes?: number
          slug: string
          summary: string
          title: string
        }
        Update: {
          body?: string
          category?: string
          created_at?: string
          id?: string
          read_time_minutes?: number
          slug?: string
          summary?: string
          title?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age: number | null
          created_at: string
          family_history_skin_cancer: boolean
          full_name: string
          id: string
          personal_history_skin_cancer: boolean
          skin_tone: string | null
          sun_exposure: string | null
          updated_at: string
        }
        Insert: {
          age?: number | null
          created_at?: string
          family_history_skin_cancer?: boolean
          full_name?: string
          id: string
          personal_history_skin_cancer?: boolean
          skin_tone?: string | null
          sun_exposure?: string | null
          updated_at?: string
        }
        Update: {
          age?: number | null
          created_at?: string
          family_history_skin_cancer?: boolean
          full_name?: string
          id?: string
          personal_history_skin_cancer?: boolean
          skin_tone?: string | null
          sun_exposure?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      scans: {
        Row: {
          additional_notes: string | null
          ai_result: Json | null
          body_location: string
          change_description: string | null
          change_from_previous: string | null
          created_at: string
          duration_present: string | null
          has_changed: boolean
          id: string
          image_path: string
          risk_level: string | null
          spot_id: string
          symptoms: string | null
          user_id: string
        }
        Insert: {
          additional_notes?: string | null
          ai_result?: Json | null
          body_location: string
          change_description?: string | null
          change_from_previous?: string | null
          created_at?: string
          duration_present?: string | null
          has_changed?: boolean
          id?: string
          image_path: string
          risk_level?: string | null
          spot_id: string
          symptoms?: string | null
          user_id: string
        }
        Update: {
          additional_notes?: string | null
          ai_result?: Json | null
          body_location?: string
          change_description?: string | null
          change_from_previous?: string | null
          created_at?: string
          duration_present?: string | null
          has_changed?: boolean
          id?: string
          image_path?: string
          risk_level?: string | null
          spot_id?: string
          symptoms?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scans_spot_id_fkey"
            columns: ["spot_id"]
            isOneToOne: false
            referencedRelation: "spots"
            referencedColumns: ["id"]
          },
        ]
      }
      spots: {
        Row: {
          body_location: string
          body_location_label: string
          created_at: string
          first_scan_date: string
          id: string
          is_archived: boolean
          latest_risk_level: string | null
          next_reminder_date: string | null
          nickname: string
          reminder_frequency_days: number
          updated_at: string
          user_id: string
        }
        Insert: {
          body_location: string
          body_location_label: string
          created_at?: string
          first_scan_date?: string
          id?: string
          is_archived?: boolean
          latest_risk_level?: string | null
          next_reminder_date?: string | null
          nickname: string
          reminder_frequency_days?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          body_location?: string
          body_location_label?: string
          created_at?: string
          first_scan_date?: string
          id?: string
          is_archived?: boolean
          latest_risk_level?: string | null
          next_reminder_date?: string | null
          nickname?: string
          reminder_frequency_days?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
    Enums: {},
  },
} as const
