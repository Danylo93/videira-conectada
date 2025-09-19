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
      audit_payments: {
        Row: {
          created_at: string
          event_type: string
          id: string
          payload_json: Json
          tenant_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          payload_json: Json
          tenant_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          payload_json?: Json
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_payments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          }
        ]
      }
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
          tenant_id: string | null
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
          tenant_id?: string | null
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
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cell_reports_lider_id_fkey"
            columns: ["lider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cell_reports_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          }
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
          tenant_id: string | null
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
          tenant_id?: string | null
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
          tenant_id?: string | null
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
          {
            foreignKeyName: "course_registrations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          }
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
          tenant_id: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          description: string
          duration: string
          id?: string
          name: string
          price?: number | null
          tenant_id?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string
          duration?: string
          id?: string
          name?: string
          price?: number | null
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "courses_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          }
        ]
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
          tenant_id: string | null
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
          tenant_id?: string | null
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
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registrations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          }
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
          tenant_id: string | null
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
          tenant_id?: string | null
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
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          }
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
          tenant_id: string | null
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
          tenant_id?: string | null
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
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "members_lider_id_fkey"
            columns: ["lider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "members_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          }
        ]
      }
      profile_tenants: {
        Row: {
          created_at: string
          profile_id: string
          role: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          profile_id: string
          role?: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          profile_id?: string
          role?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_tenants_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_tenants_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          celula: string | null
          created_at: string
          discipulador_uuid: string | null
          email: string
          id: string
          name: string
          pastor_uuid: string | null
          phone: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
          tenant_id: string | null
        }
        Insert: {
          celula?: string | null
          created_at?: string
          discipulador_uuid?: string | null
          email: string
          id?: string
          name: string
          pastor_uuid?: string | null
          phone?: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
          tenant_id?: string | null
        }
        Update: {
          celula?: string | null
          created_at?: string
          discipulador_uuid?: string | null
          email?: string
          id?: string
          name?: string
          pastor_uuid?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_discipulador_uuid_fkey"
            columns: ["discipulador_uuid"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_pastor_uuid_fkey"
            columns: ["pastor_uuid"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          }
        ]
      }
      tenant_billing: {
        Row: {
          created_at: string
          current_period_end: string | null
          payment_method_type: string | null
          plan: string
          status: string
          stripe_customer_id: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          payment_method_type?: string | null
          plan?: string
          status?: string
          stripe_customer_id?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          payment_method_type?: string | null
          plan?: string
          status?: string
          stripe_customer_id?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_billing_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          }
        ]
      }
      tenant_invoices: {
        Row: {
          amount: number
          created_at: string
          currency: string
          hosted_invoice_url: string | null
          id: string
          paid_at: string | null
          status: string
          stripe_invoice_id: string | null
          tenant_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          hosted_invoice_url?: string | null
          id?: string
          paid_at?: string | null
          status: string
          stripe_invoice_id?: string | null
          tenant_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          hosted_invoice_url?: string | null
          id?: string
          paid_at?: string | null
          status?: string
          stripe_invoice_id?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_invoices_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          }
        ]
      }
      tenants: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          owner_profile_id: string
          slug: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          owner_profile_id: string
          slug: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          owner_profile_id?: string
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenants_owner_profile_id_fkey"
            columns: ["owner_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
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

type DatabaseWithoutInternals = Database

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
