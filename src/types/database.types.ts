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
      classes: {
        Row: {
          created_at: string
          id: string
          modality: string | null
          name: string
          schedule: string | null
          status: string
          student_ids: string[] | null
          teacher: string | null
          teacher_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          modality?: string | null
          name: string
          schedule?: string | null
          status?: string
          student_ids?: string[] | null
          teacher?: string | null
          teacher_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          modality?: string | null
          name?: string
          schedule?: string | null
          status?: string
          student_ids?: string[] | null
          teacher?: string | null
          teacher_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "classes_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      communication_templates: {
        Row: {
          created_at: string
          id: string
          label: string
          message: string
          subject: string
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          message: string
          subject: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          message?: string
          subject?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          class_id: string | null
          completed: boolean | null
          created_at: string
          date: string
          details: string | null
          id: string
          owners: string[] | null
          recurrence_days: string[] | null
          recurrent: boolean | null
          time: string | null
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          class_id?: string | null
          completed?: boolean | null
          created_at?: string
          date?: string
          details?: string | null
          id?: string
          owners?: string[] | null
          recurrence_days?: string[] | null
          recurrent?: boolean | null
          time?: string | null
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          class_id?: string | null
          completed?: boolean | null
          created_at?: string
          date?: string
          details?: string | null
          id?: string
          owners?: string[] | null
          recurrence_days?: string[] | null
          recurrent?: boolean | null
          time?: string | null
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      fixed_expenses: {
        Row: {
          created_at: string
          description: string
          due_date: number
          id: string
          month: number
          payment_method: string | null
          receipt_url: string | null
          status: string
          value: number
          year: number
        }
        Insert: {
          created_at?: string
          description: string
          due_date: number
          id?: string
          month: number
          payment_method?: string | null
          receipt_url?: string | null
          status?: string
          value: number
          year: number
        }
        Update: {
          created_at?: string
          description?: string
          due_date?: number
          id?: string
          month?: number
          payment_method?: string | null
          receipt_url?: string | null
          status?: string
          value?: number
          year?: number
        }
        Relationships: []
      }
      inventory_items: {
        Row: {
          category: string
          created_at: string
          id: string
          image_url: string | null
          max_stock: number
          min_stock: number
          movements: Json | null
          name: string
          recent_movements: number | null
          status: string
          stock: number
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          image_url?: string | null
          max_stock?: number
          min_stock?: number
          movements?: Json | null
          name: string
          recent_movements?: number | null
          status?: string
          stock?: number
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          image_url?: string | null
          max_stock?: number
          min_stock?: number
          movements?: Json | null
          name?: string
          recent_movements?: number | null
          status?: string
          stock?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar: string | null
          cellphone: string | null
          created_at: string
          dob: string | null
          email: string
          id: string
          is_provider: boolean | null
          nickname: string
          permissions: string[] | null
          phone: string | null
          role: string
          updated_at: string
        }
        Insert: {
          avatar?: string | null
          cellphone?: string | null
          created_at?: string
          dob?: string | null
          email: string
          id?: string
          is_provider?: boolean | null
          nickname: string
          permissions?: string[] | null
          phone?: string | null
          role?: string
          updated_at?: string
        }
        Update: {
          avatar?: string | null
          cellphone?: string | null
          created_at?: string
          dob?: string | null
          email?: string
          id?: string
          is_provider?: boolean | null
          nickname?: string
          permissions?: string[] | null
          phone?: string | null
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      students: {
        Row: {
          address: string | null
          address_complement: string | null
          address_number: string | null
          attendance: Json | null
          avatar_url: string | null
          cep: string | null
          class_id: string | null
          class_name: string | null
          created_at: string
          dob: string | null
          documents: Json | null
          due_date: number | null
          email: string | null
          grades: Json | null
          guardian_cpf: string
          guardian_name: string
          id: string
          medical_info: string | null
          monthly_fee: number | null
          name: string
          partial_amount: number | null
          partial_date: string | null
          payment_history: Json | null
          payment_status: string | null
          phone: string | null
          status: string
          student_condition: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          address_complement?: string | null
          address_number?: string | null
          attendance?: Json | null
          avatar_url?: string | null
          cep?: string | null
          class_id?: string | null
          class_name?: string | null
          created_at?: string
          dob?: string | null
          documents?: Json | null
          due_date?: number | null
          email?: string | null
          grades?: Json | null
          guardian_cpf: string
          guardian_name: string
          id?: string
          medical_info?: string | null
          monthly_fee?: number | null
          name: string
          partial_amount?: number | null
          partial_date?: string | null
          payment_history?: Json | null
          payment_status?: string | null
          phone?: string | null
          status?: string
          student_condition?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          address_complement?: string | null
          address_number?: string | null
          attendance?: Json | null
          avatar_url?: string | null
          cep?: string | null
          class_id?: string | null
          class_name?: string | null
          created_at?: string
          dob?: string | null
          documents?: Json | null
          due_date?: number | null
          email?: string | null
          grades?: Json | null
          guardian_cpf?: string
          guardian_name?: string
          id?: string
          medical_info?: string | null
          monthly_fee?: number | null
          name?: string
          partial_amount?: number | null
          partial_date?: string | null
          payment_history?: Json | null
          payment_status?: string | null
          phone?: string | null
          status?: string
          student_condition?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          category: string
          created_at: string
          date: string
          description: string
          id: string
          name: string
          payment_method: string | null
          receipt_url: string | null
          type: string
          value: number
        }
        Insert: {
          category: string
          created_at?: string
          date?: string
          description: string
          id?: string
          name: string
          payment_method?: string | null
          receipt_url?: string | null
          type: string
          value: number
        }
        Update: {
          category?: string
          created_at?: string
          date?: string
          description?: string
          id?: string
          name?: string
          payment_method?: string | null
          receipt_url?: string | null
          type?: string
          value?: number
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
