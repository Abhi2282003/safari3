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
      agent_collections: {
        Row: {
          agent_id: string
          amount_collected: number
          amount_due: number
          collected_at: string | null
          created_at: string
          id: string
          notes: string | null
          seat_booking_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          agent_id: string
          amount_collected?: number
          amount_due?: number
          collected_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          seat_booking_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          agent_id?: string
          amount_collected?: number
          amount_due?: number
          collected_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          seat_booking_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_collections_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_collections_seat_booking_id_fkey"
            columns: ["seat_booking_id"]
            isOneToOne: false
            referencedRelation: "seat_bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      agents: {
        Row: {
          active: boolean | null
          created_at: string
          id: string
          name: string
          phone: string | null
          user_id: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          id?: string
          name: string
          phone?: string | null
          user_id: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          id?: string
          name?: string
          phone?: string | null
          user_id?: string
        }
        Relationships: []
      }
      company_settings: {
        Row: {
          address: string | null
          created_at: string
          footer_note: string | null
          id: string
          logo_url: string | null
          name: string
          phone: string | null
          ticket_height: number | null
          ticket_width: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          footer_note?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          phone?: string | null
          ticket_height?: number | null
          ticket_width?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          created_at?: string
          footer_note?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          phone?: string | null
          ticket_height?: number | null
          ticket_width?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          created_at: string
          id: string
          paid_amount: number
          paid_at: string
          payment_mode: string
          received_by_name: string
          ticket_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          paid_amount: number
          paid_at?: string
          payment_mode: string
          received_by_name: string
          ticket_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          paid_amount?: number
          paid_at?: string
          payment_mode?: string
          received_by_name?: string
          ticket_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: true
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      pickup_locations: {
        Row: {
          active: boolean | null
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      receivers: {
        Row: {
          active: boolean | null
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      seat_bookings: {
        Row: {
          agent_collection_status: string
          agent_id: string | null
          amount_from_agent: number
          amount_to_owner: number
          booking_amount: number
          booking_type: Database["public"]["Enums"]["booking_type"]
          bus_name: string | null
          collected_at: string | null
          commission_percent: number
          created_at: string
          id: string
          journey_date: string
          notes: string | null
          our_earning: number
          passenger_name: string | null
          seat_number: number
          ticket_id: string | null
          travels_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          agent_collection_status?: string
          agent_id?: string | null
          amount_from_agent?: number
          amount_to_owner?: number
          booking_amount?: number
          booking_type?: Database["public"]["Enums"]["booking_type"]
          bus_name?: string | null
          collected_at?: string | null
          commission_percent?: number
          created_at?: string
          id?: string
          journey_date: string
          notes?: string | null
          our_earning?: number
          passenger_name?: string | null
          seat_number: number
          ticket_id?: string | null
          travels_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          agent_collection_status?: string
          agent_id?: string | null
          amount_from_agent?: number
          amount_to_owner?: number
          booking_amount?: number
          booking_type?: Database["public"]["Enums"]["booking_type"]
          bus_name?: string | null
          collected_at?: string | null
          commission_percent?: number
          created_at?: string
          id?: string
          journey_date?: string
          notes?: string | null
          our_earning?: number
          passenger_name?: string | null
          seat_number?: number
          ticket_id?: string | null
          travels_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "seat_bookings_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seat_bookings_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_counters: {
        Row: {
          counter_date: string
          counter_value: number
          id: string
          user_id: string
        }
        Insert: {
          counter_date: string
          counter_value?: number
          id?: string
          user_id: string
        }
        Update: {
          counter_date?: string
          counter_value?: number
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      tickets: {
        Row: {
          amount: number
          booked_by: string | null
          booking_date_time: string
          branch: string | null
          bus_name: string | null
          bus_no: string | null
          collection_status: string
          created_at: string
          dep_time: string | null
          id: string
          journey_date: string
          no_of_tourist: number
          passenger_address: string | null
          passenger_name: string
          passenger_phone: string
          payment_mode: string | null
          rep_time: string | null
          seat_no: string | null
          surcharges: number | null
          ticket_no: string
          tours_to: string
          travels_name: string | null
          updated_at: string
          user_id: string
          with_family: boolean | null
        }
        Insert: {
          amount?: number
          booked_by?: string | null
          booking_date_time?: string
          branch?: string | null
          bus_name?: string | null
          bus_no?: string | null
          collection_status?: string
          created_at?: string
          dep_time?: string | null
          id?: string
          journey_date: string
          no_of_tourist?: number
          passenger_address?: string | null
          passenger_name: string
          passenger_phone: string
          payment_mode?: string | null
          rep_time?: string | null
          seat_no?: string | null
          surcharges?: number | null
          ticket_no: string
          tours_to: string
          travels_name?: string | null
          updated_at?: string
          user_id: string
          with_family?: boolean | null
        }
        Update: {
          amount?: number
          booked_by?: string | null
          booking_date_time?: string
          branch?: string | null
          bus_name?: string | null
          bus_no?: string | null
          collection_status?: string
          created_at?: string
          dep_time?: string | null
          id?: string
          journey_date?: string
          no_of_tourist?: number
          passenger_address?: string | null
          passenger_name?: string
          passenger_phone?: string
          payment_mode?: string | null
          rep_time?: string | null
          seat_no?: string | null
          surcharges?: number | null
          ticket_no?: string
          tours_to?: string
          travels_name?: string | null
          updated_at?: string
          user_id?: string
          with_family?: boolean | null
        }
        Relationships: []
      }
      travels: {
        Row: {
          active: boolean | null
          commission_percent: number
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          active?: boolean | null
          commission_percent?: number
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          active?: boolean | null
          commission_percent?: number
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      next_ticket_no: { Args: never; Returns: string }
    }
    Enums: {
      booking_type: "online" | "agent" | "self"
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
      booking_type: ["online", "agent", "self"],
    },
  },
} as const
