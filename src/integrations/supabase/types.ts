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
      cell_reports: {
        Row: {
          created_at: string
          id: string
          lider_id: string
          month: string | null
          multiplication_date: string | null
          observations: string | null
          status: string
          submitted_at: string
          updated_at: string
          year: number | null
          members_present: string[] | null
          visitors_present: string[] | null
          phase: string | null
          week_start: string
        }
        Insert: {
          created_at?: string
          id?: string
          lider_id: string
          month?: string | null
          multiplication_date?: string | null
          observations?: string | null
          status?: string
          submitted_at?: string
          updated_at?: string
          year?: number | null
          members_present?: string[] | null
          visitors_present?: string[] | null
          phase?: string | null
          week_start: string
        }
        Update: {
          created_at?: string
          id?: string
          lider_id?: string
          month?: string | null
          multiplication_date?: string | null
          observations?: string | null
          status?: string
          submitted_at?: string
          updated_at?: string
          year?: number | null
          members_present?: string[] | null
          visitors_present?: string[] | null
          phase?: string | null
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "cell_reports_lider_id_fkey"
            columns: ["lider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      course_registrations: {
        Row: {
          course_id: string
          created_at: string
          id: string
          lider_id: string
          member_id: string
          payment_status: string | null
          registration_date: string
          status: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          lider_id: string
          member_id: string
          payment_status?: string | null
          registration_date?: string
          status?: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          lider_id?: string
          member_id?: string
          payment_status?: string | null
          registration_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_registrations_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_registrations_lider_id_fkey"
            columns: ["lider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_registrations_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          active: boolean
          created_at: string
          description: string
          duration: string
          id: string
          name: string
          price: number | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          description: string
          duration: string
          id?: string
          name: string
          price?: number | null
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string
          duration?: string
          id?: string
          name?: string
          price?: number | null
        }
        Relationships: []
      }
      event_registrations: {
        Row: {
          created_at: string
          discipulador_name: string
          event_id: string
          id: string
          leader_name: string
          participant_name: string
          phone: string
          registration_date: string
          role: string
        }
        Insert: {
          created_at?: string
          discipulador_name: string
          event_id: string
          id?: string
          leader_name: string
          participant_name: string
          phone: string
          registration_date?: string
          role: string
        }
        Update: {
          created_at?: string
          discipulador_name?: string
          event_id?: string
          id?: string
          leader_name?: string
          participant_name?: string
          phone?: string
          registration_date?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          active: boolean
          created_at: string
          created_by: string
          description: string
          event_date: string
          id: string
          location: string
          max_capacity: number | null
          name: string
          type: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          created_by: string
          description: string
          event_date: string
          id?: string
          location: string
          max_capacity?: number | null
          name: string
          type: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          created_by?: string
          description?: string
          event_date?: string
          id?: string
          location?: string
          max_capacity?: number | null
          name?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      members: {
        Row: {
          active: boolean
          created_at: string
          email: string | null
          id: string
          join_date: string
          last_presence: string | null
          lider_id: string
          name: string
          phone: string | null
          type: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          email?: string | null
          id?: string
          join_date?: string
          last_presence?: string | null
          lider_id: string
          name: string
          phone?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          email?: string | null
          id?: string
          join_date?: string
          last_presence?: string | null
          lider_id?: string
          name?: string
          phone?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "members_lider_id_fkey"
            columns: ["lider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          celula: string | null
          created_at: string
          discipulador_id: string | null
          email: string
          address: string | null
          network: string | null
          id: string
          name: string
          pastor_id: string | null
          phone: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          celula?: string | null
          created_at?: string
          discipulador_id?: string | null
          email: string
          address?: string | null
          network?: string | null
          id?: string
          name: string
          pastor_id?: string | null
          phone?: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          celula?: string | null
          created_at?: string
          discipulador_id?: string | null
          email?: string
          address?: string | null
          network?: string | null
          id?: string
          name?: string
          pastor_id?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_discipulador_id_fkey"
            columns: ["discipulador_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_pastor_id_fkey"
            columns: ["pastor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      app_role: "pastor" | "obreiro" | "discipulador" | "lider"
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
      app_role: ["pastor", "obreiro", "discipulador", "lider"],
    },
  },
} as const
