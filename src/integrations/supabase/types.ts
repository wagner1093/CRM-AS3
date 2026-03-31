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
      contacts: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          lead_source: string | null
          name: string
          notes: string | null
          payment_type: string | null
          phone: string | null
          preferences: string | null
          source: string | null
          status: string | null
          urgency: string | null
          vehicle_interest: string | null
          whatsapp: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          lead_source?: string | null
          name: string
          notes?: string | null
          payment_type?: string | null
          phone?: string | null
          preferences?: string | null
          source?: string | null
          status?: string | null
          urgency?: string | null
          vehicle_interest?: string | null
          whatsapp?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          lead_source?: string | null
          name?: string
          notes?: string | null
          payment_type?: string | null
          phone?: string | null
          preferences?: string | null
          source?: string | null
          status?: string | null
          urgency?: string | null
          vehicle_interest?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      conversations: {
        Row: {
          ai_intent: string | null
          ai_stage: string | null
          ai_summary: string | null
          assigned_to: string | null
          channel: string | null
          contact_id: string | null
          created_at: string | null
          id: string
          last_message: string | null
          last_message_at: string | null
          phone: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          ai_intent?: string | null
          ai_stage?: string | null
          ai_summary?: string | null
          assigned_to?: string | null
          channel?: string | null
          contact_id?: string | null
          created_at?: string | null
          id?: string
          last_message?: string | null
          last_message_at?: string | null
          phone?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          ai_intent?: string | null
          ai_stage?: string | null
          ai_summary?: string | null
          assigned_to?: string | null
          channel?: string | null
          contact_id?: string | null
          created_at?: string | null
          id?: string
          last_message?: string | null
          last_message_at?: string | null
          phone?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          contact_id: string | null
          created_at: string | null
          id: string
          notes: string | null
          notified_at: string | null
          payment_type: string | null
          stage: string | null
          updated_at: string | null
          urgency: string | null
          value: number | null
          vehicle_id: string | null
          vehicle_interest: string | null
        }
        Insert: {
          contact_id?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          notified_at?: string | null
          payment_type?: string | null
          stage?: string | null
          updated_at?: string | null
          urgency?: string | null
          value?: number | null
          vehicle_id?: string | null
          vehicle_interest?: string | null
        }
        Update: {
          contact_id?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          notified_at?: string | null
          payment_type?: string | null
          stage?: string | null
          updated_at?: string | null
          urgency?: string | null
          value?: number | null
          vehicle_id?: string | null
          vehicle_interest?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deals_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string | null
          created_at: string | null
          direction: string | null
          id: string
          phone: string | null
          sender: string | null
        }
        Insert: {
          content: string
          conversation_id?: string | null
          created_at?: string | null
          direction?: string | null
          id?: string
          phone?: string | null
          sender?: string | null
        }
        Update: {
          content?: string
          conversation_id?: string | null
          created_at?: string | null
          direction?: string | null
          id?: string
          phone?: string | null
          sender?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          contact_id: string | null
          created_at: string | null
          deal_id: string | null
          id: string
          message: string
          read: boolean | null
        }
        Insert: {
          contact_id?: string | null
          created_at?: string | null
          deal_id?: string | null
          id?: string
          message: string
          read?: boolean | null
        }
        Update: {
          contact_id?: string | null
          created_at?: string | null
          deal_id?: string | null
          id?: string
          message?: string
          read?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_images: {
        Row: {
          created_at: string | null
          id: string
          position: number | null
          storage_path: string
          url: string
          vehicle_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          position?: number | null
          storage_path: string
          url: string
          vehicle_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          position?: number | null
          storage_path?: string
          url?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_images_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          armor_company: string | null
          armor_type: string | null
          armored: boolean | null
          brand: string | null
          color: string | null
          commission_armor: number | null
          commission_as3: number | null
          commission_external: number | null
          commission_financing: number | null
          condition: string | null
          cost_detailing: number | null
          cost_documentation: number | null
          cost_other: number | null
          cost_repairs: number | null
          created_at: string | null
          description: string | null
          electric_trunk: boolean | null
          engine: string | null
          fuel: string | null
          glass_brand: string | null
          id: string
          leather_seats: boolean | null
          mileage: number | null
          model: string | null
          notes_internal: string | null
          power: string | null
          price: number | null
          purchase_price: number | null
          status: string | null
          sunroof: boolean | null
          version: string | null
          year: number | null
        }
        Insert: {
          armor_company?: string | null
          armor_type?: string | null
          armored?: boolean | null
          brand?: string | null
          color?: string | null
          commission_armor?: number | null
          commission_as3?: number | null
          commission_external?: number | null
          commission_financing?: number | null
          condition?: string | null
          cost_detailing?: number | null
          cost_documentation?: number | null
          cost_other?: number | null
          cost_repairs?: number | null
          created_at?: string | null
          description?: string | null
          electric_trunk?: boolean | null
          engine?: string | null
          fuel?: string | null
          glass_brand?: string | null
          id?: string
          leather_seats?: boolean | null
          mileage?: number | null
          model?: string | null
          notes_internal?: string | null
          power?: string | null
          price?: number | null
          purchase_price?: number | null
          status?: string | null
          sunroof?: boolean | null
          version?: string | null
          year?: number | null
        }
        Update: {
          armor_company?: string | null
          armor_type?: string | null
          armored?: boolean | null
          brand?: string | null
          color?: string | null
          commission_armor?: number | null
          commission_as3?: number | null
          commission_external?: number | null
          commission_financing?: number | null
          condition?: string | null
          cost_detailing?: number | null
          cost_documentation?: number | null
          cost_other?: number | null
          cost_repairs?: number | null
          created_at?: string | null
          description?: string | null
          electric_trunk?: boolean | null
          engine?: string | null
          fuel?: string | null
          glass_brand?: string | null
          id?: string
          leather_seats?: boolean | null
          mileage?: number | null
          model?: string | null
          notes_internal?: string | null
          power?: string | null
          price?: number | null
          purchase_price?: number | null
          status?: string | null
          sunroof?: boolean | null
          version?: string | null
          year?: number | null
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
