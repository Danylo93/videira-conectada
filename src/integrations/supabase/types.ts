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
          members_present: string[] | null
          month: string | null
          multiplication_date: string | null
          observations: string | null
          phase: string | null
          status: string
          submitted_at: string
          updated_at: string
          visitors_present: string[] | null
          week_start: string | null
          year: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          lider_id: string
          members_present?: string[] | null
          month?: string | null
          multiplication_date?: string | null
          observations?: string | null
          phase?: string | null
          status?: string
          submitted_at?: string
          updated_at?: string
          visitors_present?: string[] | null
          week_start?: string | null
          year?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          lider_id?: string
          members_present?: string[] | null
          month?: string | null
          multiplication_date?: string | null
          observations?: string | null
          phase?: string | null
          status?: string
          submitted_at?: string
          updated_at?: string
          visitors_present?: string[] | null
          week_start?: string | null
          year?: number | null
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
      contact_attempts: {
        Row: {
          contact_date: string
          contact_method: string
          contact_time: string | null
          created_at: string | null
          created_by: string | null
          id: string
          lost_member_id: string
          next_contact_date: string | null
          notes: string | null
          response: string | null
          success: boolean | null
        }
        Insert: {
          contact_date: string
          contact_method: string
          contact_time?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          lost_member_id: string
          next_contact_date?: string | null
          notes?: string | null
          response?: string | null
          success?: boolean | null
        }
        Update: {
          contact_date?: string
          contact_method?: string
          contact_time?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          lost_member_id?: string
          next_contact_date?: string | null
          notes?: string | null
          response?: string | null
          success?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_attempts_lost_member_id_fkey"
            columns: ["lost_member_id"]
            isOneToOne: false
            referencedRelation: "lost_members"
            referencedColumns: ["id"]
          },
        ]
      }
      course_assessments: {
        Row: {
          assessment_type: string
          course_id: string
          created_at: string
          created_by: string
          description: string | null
          due_date: string | null
          id: string
          instructions: string | null
          max_score: number | null
          passing_score: number | null
          title: string
          updated_at: string
          weight_percentage: number | null
        }
        Insert: {
          assessment_type: string
          course_id: string
          created_at?: string
          created_by: string
          description?: string | null
          due_date?: string | null
          id?: string
          instructions?: string | null
          max_score?: number | null
          passing_score?: number | null
          title: string
          updated_at?: string
          weight_percentage?: number | null
        }
        Update: {
          assessment_type?: string
          course_id?: string
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          id?: string
          instructions?: string | null
          max_score?: number | null
          passing_score?: number | null
          title?: string
          updated_at?: string
          weight_percentage?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "course_assessments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_assessments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      course_attendance: {
        Row: {
          check_in_time: string | null
          check_out_time: string | null
          created_at: string
          id: string
          lesson_id: string
          marked_at: string
          marked_by: string | null
          notes: string | null
          registration_id: string
          status: string
        }
        Insert: {
          check_in_time?: string | null
          check_out_time?: string | null
          created_at?: string
          id?: string
          lesson_id: string
          marked_at?: string
          marked_by?: string | null
          notes?: string | null
          registration_id: string
          status?: string
        }
        Update: {
          check_in_time?: string | null
          check_out_time?: string | null
          created_at?: string
          id?: string
          lesson_id?: string
          marked_at?: string
          marked_by?: string | null
          notes?: string | null
          registration_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_attendance_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_attendance_marked_by_fkey"
            columns: ["marked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_attendance_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "course_registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      course_certificates: {
        Row: {
          certificate_number: string
          created_at: string
          digital_signature: string | null
          id: string
          issued_by: string
          issued_date: string
          registration_id: string
          status: string
          valid_until: string | null
        }
        Insert: {
          certificate_number: string
          created_at?: string
          digital_signature?: string | null
          id?: string
          issued_by: string
          issued_date?: string
          registration_id: string
          status?: string
          valid_until?: string | null
        }
        Update: {
          certificate_number?: string
          created_at?: string
          digital_signature?: string | null
          id?: string
          issued_by?: string
          issued_date?: string
          registration_id?: string
          status?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_certificates_issued_by_fkey"
            columns: ["issued_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_certificates_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "course_registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      course_grades: {
        Row: {
          assessment_id: string
          created_at: string
          feedback: string | null
          grade_letter: string | null
          graded_at: string | null
          graded_by: string | null
          id: string
          max_score: number | null
          registration_id: string
          score: number | null
          updated_at: string
        }
        Insert: {
          assessment_id: string
          created_at?: string
          feedback?: string | null
          grade_letter?: string | null
          graded_at?: string | null
          graded_by?: string | null
          id?: string
          max_score?: number | null
          registration_id: string
          score?: number | null
          updated_at?: string
        }
        Update: {
          assessment_id?: string
          created_at?: string
          feedback?: string | null
          grade_letter?: string | null
          graded_at?: string | null
          graded_by?: string | null
          id?: string
          max_score?: number | null
          registration_id?: string
          score?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_grades_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "course_assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_grades_graded_by_fkey"
            columns: ["graded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_grades_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "course_registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      course_instructors: {
        Row: {
          assigned_modules: string[] | null
          course_id: string
          created_at: string
          hourly_rate: number | null
          id: string
          instructor_id: string
          is_primary: boolean | null
          role: string
        }
        Insert: {
          assigned_modules?: string[] | null
          course_id: string
          created_at?: string
          hourly_rate?: number | null
          id?: string
          instructor_id: string
          is_primary?: boolean | null
          role?: string
        }
        Update: {
          assigned_modules?: string[] | null
          course_id?: string
          created_at?: string
          hourly_rate?: number | null
          id?: string
          instructor_id?: string
          is_primary?: boolean | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_instructors_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_instructors_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      course_lessons: {
        Row: {
          created_at: string
          description: string | null
          end_time: string | null
          homework: string | null
          id: string
          is_mandatory: boolean | null
          lesson_type: string
          location: string | null
          materials: string[] | null
          max_attendance: number | null
          module_id: string
          online_link: string | null
          order_index: number
          scheduled_date: string | null
          start_time: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_time?: string | null
          homework?: string | null
          id?: string
          is_mandatory?: boolean | null
          lesson_type?: string
          location?: string | null
          materials?: string[] | null
          max_attendance?: number | null
          module_id: string
          online_link?: string | null
          order_index?: number
          scheduled_date?: string | null
          start_time?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_time?: string | null
          homework?: string | null
          id?: string
          is_mandatory?: boolean | null
          lesson_type?: string
          location?: string | null
          materials?: string[] | null
          max_attendance?: number | null
          module_id?: string
          online_link?: string | null
          order_index?: number
          scheduled_date?: string | null
          start_time?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      course_modules: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          duration_hours: number | null
          id: string
          is_required: boolean | null
          learning_outcomes: string[] | null
          order_index: number
          prerequisites: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          duration_hours?: number | null
          id?: string
          is_required?: boolean | null
          learning_outcomes?: string[] | null
          order_index?: number
          prerequisites?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          duration_hours?: number | null
          id?: string
          is_required?: boolean | null
          learning_outcomes?: string[] | null
          order_index?: number
          prerequisites?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_payments: {
        Row: {
          amount: number
          created_at: string
          due_date: string | null
          id: string
          installment_number: number | null
          notes: string | null
          paid_date: string | null
          payment_method: string
          payment_reference: string | null
          processed_by: string | null
          registration_id: string
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          due_date?: string | null
          id?: string
          installment_number?: number | null
          notes?: string | null
          paid_date?: string | null
          payment_method: string
          payment_reference?: string | null
          processed_by?: string | null
          registration_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          due_date?: string | null
          id?: string
          installment_number?: number | null
          notes?: string | null
          paid_date?: string | null
          payment_method?: string
          payment_reference?: string | null
          processed_by?: string | null
          registration_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_payments_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_payments_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "course_registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      course_registrations: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          completed_at: string | null
          course_id: string
          created_at: string
          emergency_contact: string | null
          id: string
          installment_count: number | null
          leader_id: string
          medical_info: string | null
          notes: string | null
          paid_amount: number | null
          payment_plan: string | null
          payment_status: string
          registration_date: string
          scholarship_amount: number | null
          special_needs: string | null
          status: string
          student_id: string
          total_amount: number | null
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          completed_at?: string | null
          course_id: string
          created_at?: string
          emergency_contact?: string | null
          id?: string
          installment_count?: number | null
          leader_id: string
          medical_info?: string | null
          notes?: string | null
          paid_amount?: number | null
          payment_plan?: string | null
          payment_status?: string
          registration_date?: string
          scholarship_amount?: number | null
          special_needs?: string | null
          status?: string
          student_id: string
          total_amount?: number | null
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          completed_at?: string | null
          course_id?: string
          created_at?: string
          emergency_contact?: string | null
          id?: string
          installment_count?: number | null
          leader_id?: string
          medical_info?: string | null
          notes?: string | null
          paid_amount?: number | null
          payment_plan?: string | null
          payment_status?: string
          registration_date?: string
          scholarship_amount?: number | null
          special_needs?: string | null
          status?: string
          student_id?: string
          total_amount?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_registrations_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_registrations_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_registrations_leader_id_fkey"
            columns: ["leader_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_registrations_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          active: boolean
          category: string
          certification_name: string | null
          certification_required: boolean | null
          created_at: string
          created_by: string
          description: string | null
          difficulty_level: string
          duration_weeks: number
          end_date: string | null
          id: string
          learning_objectives: string[] | null
          materials_included: string[] | null
          max_students: number | null
          min_students: number | null
          name: string
          price: number | null
          registration_deadline: string | null
          requirements: string[] | null
          short_description: string | null
          start_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          category?: string
          certification_name?: string | null
          certification_required?: boolean | null
          created_at?: string
          created_by: string
          description?: string | null
          difficulty_level?: string
          duration_weeks?: number
          end_date?: string | null
          id?: string
          learning_objectives?: string[] | null
          materials_included?: string[] | null
          max_students?: number | null
          min_students?: number | null
          name: string
          price?: number | null
          registration_deadline?: string | null
          requirements?: string[] | null
          short_description?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          category?: string
          certification_name?: string | null
          certification_required?: boolean | null
          created_at?: string
          created_by?: string
          description?: string | null
          difficulty_level?: string
          duration_weeks?: number
          end_date?: string | null
          id?: string
          learning_objectives?: string[] | null
          materials_included?: string[] | null
          max_students?: number | null
          min_students?: number | null
          name?: string
          price?: number | null
          registration_deadline?: string | null
          requirements?: string[] | null
          short_description?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      culto_attendance: {
        Row: {
          attendance_type: string | null
          created_at: string | null
          culto_id: string
          id: string
          is_conversion: boolean | null
          is_member: boolean | null
          is_visitor: boolean | null
          member_id: string | null
          notes: string | null
          registered_by: string | null
          visitor_email: string | null
          visitor_name: string | null
          visitor_phone: string | null
        }
        Insert: {
          attendance_type?: string | null
          created_at?: string | null
          culto_id: string
          id?: string
          is_conversion?: boolean | null
          is_member?: boolean | null
          is_visitor?: boolean | null
          member_id?: string | null
          notes?: string | null
          registered_by?: string | null
          visitor_email?: string | null
          visitor_name?: string | null
          visitor_phone?: string | null
        }
        Update: {
          attendance_type?: string | null
          created_at?: string | null
          culto_id?: string
          id?: string
          is_conversion?: boolean | null
          is_member?: boolean | null
          is_visitor?: boolean | null
          member_id?: string | null
          notes?: string | null
          registered_by?: string | null
          visitor_email?: string | null
          visitor_name?: string | null
          visitor_phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "culto_attendance_culto_id_fkey"
            columns: ["culto_id"]
            isOneToOne: false
            referencedRelation: "cultos"
            referencedColumns: ["id"]
          },
        ]
      }
      cultos: {
        Row: {
          created_at: string | null
          date: string
          description: string | null
          end_time: string | null
          id: string
          location: string | null
          name: string
          notes: string | null
          obreiro_id: string | null
          pastor_id: string | null
          start_time: string
          status: string | null
          total_attendance: number | null
          total_conversions: number | null
          total_offerings: number | null
          total_visitors: number | null
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date: string
          description?: string | null
          end_time?: string | null
          id?: string
          location?: string | null
          name: string
          notes?: string | null
          obreiro_id?: string | null
          pastor_id?: string | null
          start_time: string
          status?: string | null
          total_attendance?: number | null
          total_conversions?: number | null
          total_offerings?: number | null
          total_visitors?: number | null
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          description?: string | null
          end_time?: string | null
          id?: string
          location?: string | null
          name?: string
          notes?: string | null
          obreiro_id?: string | null
          pastor_id?: string | null
          start_time?: string
          status?: string | null
          total_attendance?: number | null
          total_conversions?: number | null
          total_offerings?: number | null
          total_visitors?: number | null
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      encounter_with_god: {
        Row: {
          amount_paid: number | null
          attended: boolean
          created_at: string
          created_by: string
          discipulador_id: string | null
          email: string | null
          encounter_date: string
          encounter_type: string
          id: string
          leader_id: string | null
          name: string
          notes: string | null
          pastor_id: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          amount_paid?: number | null
          attended?: boolean
          created_at?: string
          created_by: string
          discipulador_id?: string | null
          email?: string | null
          encounter_date?: string
          encounter_type: string
          id?: string
          leader_id?: string | null
          name: string
          notes?: string | null
          pastor_id?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          amount_paid?: number | null
          attended?: boolean
          created_at?: string
          created_by?: string
          discipulador_id?: string | null
          email?: string | null
          encounter_date?: string
          encounter_type?: string
          id?: string
          leader_id?: string | null
          name?: string
          notes?: string | null
          pastor_id?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "encounter_with_god_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "encounter_with_god_discipulador_id_fkey"
            columns: ["discipulador_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "encounter_with_god_leader_id_fkey"
            columns: ["leader_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "encounter_with_god_pastor_id_fkey"
            columns: ["pastor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
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
      lost_members: {
        Row: {
          assigned_to: string | null
          contact_attempts: number | null
          created_at: string | null
          created_by: string | null
          email: string | null
          id: string
          last_attendance_date: string | null
          last_cell_meeting_date: string | null
          last_contact_date: string | null
          last_contact_method: string | null
          last_contact_notes: string | null
          last_culto_date: string | null
          member_id: string
          name: string
          phone: string | null
          priority: string | null
          reason: string | null
          reason_details: string | null
          return_date: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          contact_attempts?: number | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          id?: string
          last_attendance_date?: string | null
          last_cell_meeting_date?: string | null
          last_contact_date?: string | null
          last_contact_method?: string | null
          last_contact_notes?: string | null
          last_culto_date?: string | null
          member_id: string
          name: string
          phone?: string | null
          priority?: string | null
          reason?: string | null
          reason_details?: string | null
          return_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          contact_attempts?: number | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          id?: string
          last_attendance_date?: string | null
          last_cell_meeting_date?: string | null
          last_contact_date?: string | null
          last_contact_method?: string | null
          last_contact_notes?: string | null
          last_culto_date?: string | null
          member_id?: string
          name?: string
          phone?: string | null
          priority?: string | null
          reason?: string | null
          reason_details?: string | null
          return_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
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
          discipulador_uuid: string | null
          email: string
          full_name: string | null
          id: string
          name: string
          pastor_id: string | null
          pastor_uuid: string | null
          phone: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          celula?: string | null
          created_at?: string
          discipulador_id?: string | null
          discipulador_uuid?: string | null
          email: string
          full_name?: string | null
          id?: string
          name: string
          pastor_id?: string | null
          pastor_uuid?: string | null
          phone?: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          celula?: string | null
          created_at?: string
          discipulador_id?: string | null
          discipulador_uuid?: string | null
          email?: string
          full_name?: string | null
          id?: string
          name?: string
          pastor_id?: string | null
          pastor_uuid?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_discipulador_fk"
            columns: ["discipulador_uuid"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_discipulador_id_fkey"
            columns: ["discipulador_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_pastor_fk"
            columns: ["pastor_uuid"]
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
      report_submissions: {
        Row: {
          created_at: string | null
          feedback: string | null
          id: string
          report_id: string
          status: string | null
          submission_date: string | null
          submitted_by: string
          submitted_to: string
        }
        Insert: {
          created_at?: string | null
          feedback?: string | null
          id?: string
          report_id: string
          status?: string | null
          submission_date?: string | null
          submitted_by: string
          submitted_to: string
        }
        Update: {
          created_at?: string | null
          feedback?: string | null
          id?: string
          report_id?: string
          status?: string | null
          submission_date?: string | null
          submitted_by?: string
          submitted_to?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_submissions_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      report_templates: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          template_data: Json
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          template_data: Json
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          template_data?: Json
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      reports: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          data: Json
          id: string
          notes: string | null
          period_end: string
          period_start: string
          report_type: string
          status: string | null
          submitted_at: string | null
          submitted_by: string | null
          template_id: string | null
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          data: Json
          id?: string
          notes?: string | null
          period_end: string
          period_start: string
          report_type: string
          status?: string | null
          submitted_at?: string | null
          submitted_by?: string | null
          template_id?: string | null
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          data?: Json
          id?: string
          notes?: string | null
          period_end?: string
          period_start?: string
          report_type?: string
          status?: string | null
          submitted_at?: string | null
          submitted_by?: string | null
          template_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "report_templates"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      _ensure_user: {
        Args: {
          p_email: string
          p_name: string
          p_password: string
          p_phone: string
          p_role: string
        }
        Returns: undefined
      }
      is_pastor: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_pastor_or_discipulador: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
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
