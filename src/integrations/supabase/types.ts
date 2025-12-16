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
      catalog_items: {
        Row: {
          area: string
          category: string
          created_at: string | null
          equipment: string
          id: string
          is_active: boolean
          item_code: string
          item_description: string
          system_description: string | null
          updated_at: string | null
        }
        Insert: {
          area: string
          category: string
          created_at?: string | null
          equipment: string
          id?: string
          is_active?: boolean
          item_code: string
          item_description: string
          system_description?: string | null
          updated_at?: string | null
        }
        Update: {
          area?: string
          category?: string
          created_at?: string | null
          equipment?: string
          id?: string
          is_active?: boolean
          item_code?: string
          item_description?: string
          system_description?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      epi_items: {
        Row: {
          id: string
          name: string
          category: string
          size: string | null
          stock_quantity: number
          min_stock_quantity: number
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          category: string
          size?: string | null
          stock_quantity?: number
          min_stock_quantity?: number
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          category?: string
          size?: string | null
          stock_quantity?: number
          min_stock_quantity?: number
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      epi_requisitions: {
        Row: {
          id: string
          user_id: string
          epi_item_id: string
          quantity: number
          status: string
          observation: string | null
          created_at: string | null
          updated_at: string | null
          rejection_reason: string | null
          assigned_to: string | null
        }
        Insert: {
          id?: string
          user_id: string
          epi_item_id: string
          quantity: number
          status?: string
          observation?: string | null
          created_at?: string | null
          updated_at?: string | null
          rejection_reason?: string | null
          assigned_to?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          epi_item_id?: string
          quantity?: number
          status?: string
          observation?: string | null
          created_at?: string | null
          updated_at?: string | null
          rejection_reason?: string | null
          assigned_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "epi_requisitions_epi_item_id_fkey"
            columns: ["epi_item_id"]
            isOneToOne: false
            referencedRelation: "epi_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "epi_requisitions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "epi_requisitions_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      epi_movements: {
        Row: {
          id: string
          epi_item_id: string
          type: string
          quantity: number
          performed_by: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          epi_item_id: string
          type: string
          quantity: number
          performed_by?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          epi_item_id?: string
          type?: string
          quantity?: number
          performed_by?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "epi_movements_epi_item_id_fkey"
            columns: ["epi_item_id"]
            isOneToOne: false
            referencedRelation: "epi_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "epi_movements_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      requisitions: {
        Row: {
          area: string
          assigned_to: string | null
          cost_center: string | null
          created_at: string | null
          created_by: string
          equipment: string
          id: string
          item_code: string | null
          item_description: string
          justification: string | null
          photos: string[] | null
          priority: string
          problem_description: string
          quantity: number
          rejection_reason: string | null
          status: string
          transferred_from: string | null
          updated_at: string | null
        }
        Insert: {
          area: string
          assigned_to?: string | null
          cost_center?: string | null
          created_at?: string | null
          created_by: string
          equipment: string
          id?: string
          item_code?: string | null
          item_description: string
          justification?: string | null
          photos?: string[] | null
          priority: string
          problem_description: string
          quantity?: number
          rejection_reason?: string | null
          status?: string
          transferred_from?: string | null
          updated_at?: string | null
        }
        Update: {
          area?: string
          assigned_to?: string | null
          cost_center?: string | null
          created_at?: string | null
          created_by?: string
          equipment?: string
          id?: string
          item_code?: string | null
          item_description?: string
          justification?: string | null
          photos?: string[] | null
          priority?: string
          problem_description?: string
          quantity?: number
          rejection_reason?: string | null
          status?: string
          transferred_from?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
          username: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
          username: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
          username?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_user_role: {
        Args: { _user_id: string; _username: string }
        Returns: undefined
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role:
        | "pcm"
        | "mechanic"
        | "pre_liberacao"
        | "coleta_emitida"
        | "material_disponivel"
        | "encerrada_sem_liberacao"
        | "admin"
        | "tecnico_seguranca"
        | "almoxarifado"
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
      app_role: [
        "pcm",
        "mechanic",
        "pre_liberacao",
        "coleta_emitida",
        "material_disponivel",
        "encerrada_sem_liberacao",
        "admin",
        "tecnico_seguranca",
        "almoxarifado",
      ],
    },
  },
} as const;