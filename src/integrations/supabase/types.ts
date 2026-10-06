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
      agent_collection_payments: {
        Row: {
          agent_id: string | null
          amount_paid: number
          created_at: string
          id: string
          notes: string | null
          party_key: string | null
          payment_date: string
          payment_mode: string
          received_by: string
          user_id: string
        }
        Insert: {
          agent_id?: string | null
          amount_paid: number
          created_at?: string
          id?: string
          notes?: string | null
          party_key?: string | null
          payment_date?: string
          payment_mode?: string
          received_by: string
          user_id: string
        }
        Update: {
          agent_id?: string | null
          amount_paid?: number
          created_at?: string
          id?: string
          notes?: string | null
          party_key?: string | null
          payment_date?: string
          payment_mode?: string
          received_by?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_collection_payments_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
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
          advance_balance: number
          created_at: string
          id: string
          name: string
          phone: string | null
          user_id: string
        }
        Insert: {
          active?: boolean | null
          advance_balance?: number
          created_at?: string
          id?: string
          name: string
          phone?: string | null
          user_id: string
        }
        Update: {
          active?: boolean | null
          advance_balance?: number
          created_at?: string
          id?: string
          name?: string
          phone?: string | null
          user_id?: string
        }
        Relationships: []
      }
      booking_types: {
        Row: {
          active: boolean
          colour: string | null
          created_at: string
          creates_collection: boolean
          id: string
          key: string
          name: string
          needs_agent: boolean
          user_id: string
        }
        Insert: {
          active?: boolean
          colour?: string | null
          created_at?: string
          creates_collection?: boolean
          id?: string
          key: string
          name: string
          needs_agent?: boolean
          user_id: string
        }
        Update: {
          active?: boolean
          colour?: string | null
          created_at?: string
          creates_collection?: boolean
          id?: string
          key?: string
          name?: string
          needs_agent?: boolean
          user_id?: string
        }
        Relationships: []
      }
      bus_companies: {
        Row: {
          active: boolean
          created_at: string
          default_layout_id: string | null
          id: string
          name: string
          number_prefix: string | null
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          default_layout_id?: string | null
          id?: string
          name: string
          number_prefix?: string | null
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          default_layout_id?: string | null
          id?: string
          name?: string
          number_prefix?: string | null
          user_id?: string
        }
        Relationships: []
      }
      bus_layouts: {
        Row: {
          bus_id: string
          id: string
          layout_id: string
          user_id: string
          valid_from: string
        }
        Insert: {
          bus_id: string
          id?: string
          layout_id: string
          user_id: string
          valid_from?: string
        }
        Update: {
          bus_id?: string
          id?: string
          layout_id?: string
          user_id?: string
          valid_from?: string
        }
        Relationships: [
          {
            foreignKeyName: "bus_layouts_bus_id_fkey"
            columns: ["bus_id"]
            isOneToOne: false
            referencedRelation: "buses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bus_layouts_layout_id_fkey"
            columns: ["layout_id"]
            isOneToOne: false
            referencedRelation: "seat_layouts"
            referencedColumns: ["id"]
          },
        ]
      }
      bus_schedules: {
        Row: {
          bus_id: string | null
          bus_name: string
          created_at: string
          departure_time: string | null
          driver_name: string | null
          id: string
          journey_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          bus_id?: string | null
          bus_name: string
          created_at?: string
          departure_time?: string | null
          driver_name?: string | null
          id?: string
          journey_date: string
          updated_at?: string
          user_id: string
        }
        Update: {
          bus_id?: string | null
          bus_name?: string
          created_at?: string
          departure_time?: string | null
          driver_name?: string | null
          id?: string
          journey_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      buses: {
        Row: {
          active: boolean | null
          company_id: string | null
          created_at: string
          display_name: string | null
          id: string
          layout_id: string | null
          name: string
          user_id: string
        }
        Insert: {
          active?: boolean | null
          company_id?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          layout_id?: string | null
          name: string
          user_id: string
        }
        Update: {
          active?: boolean | null
          company_id?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          layout_id?: string | null
          name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "buses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "bus_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_rules: {
        Row: {
          agent_id: string | null
          agent_percent: number
          booking_type_id: string | null
          bus_id: string | null
          collect_from_party: boolean
          company_id: string | null
          created_at: string
          id: string
          is_luggage: boolean
          our_percent: number
          owner_gets: boolean
          total_percent: number
          user_id: string
          valid_from: string
        }
        Insert: {
          agent_id?: string | null
          agent_percent?: number
          booking_type_id?: string | null
          bus_id?: string | null
          collect_from_party?: boolean
          company_id?: string | null
          created_at?: string
          id?: string
          is_luggage?: boolean
          our_percent?: number
          owner_gets?: boolean
          total_percent?: number
          user_id: string
          valid_from?: string
        }
        Update: {
          agent_id?: string | null
          agent_percent?: number
          booking_type_id?: string | null
          bus_id?: string | null
          collect_from_party?: boolean
          company_id?: string | null
          created_at?: string
          id?: string
          is_luggage?: boolean
          our_percent?: number
          owner_gets?: boolean
          total_percent?: number
          user_id?: string
          valid_from?: string
        }
        Relationships: [
          {
            foreignKeyName: "commission_rules_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_rules_booking_type_id_fkey"
            columns: ["booking_type_id"]
            isOneToOne: false
            referencedRelation: "booking_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_rules_bus_id_fkey"
            columns: ["bus_id"]
            isOneToOne: false
            referencedRelation: "buses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_rules_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "bus_companies"
            referencedColumns: ["id"]
          },
        ]
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
          preprinted_layout: Json | null
          show_ticket_screens: boolean | null
          ticket_height: number | null
          ticket_width: number | null
          updated_at: string
          user_id: string
          whatsapp_reminder_enabled: boolean | null
          whatsapp_template: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          footer_note?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          phone?: string | null
          preprinted_layout?: Json | null
          show_ticket_screens?: boolean | null
          ticket_height?: number | null
          ticket_width?: number | null
          updated_at?: string
          user_id: string
          whatsapp_reminder_enabled?: boolean | null
          whatsapp_template?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          footer_note?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          phone?: string | null
          preprinted_layout?: Json | null
          show_ticket_screens?: boolean | null
          ticket_height?: number | null
          ticket_width?: number | null
          updated_at?: string
          user_id?: string
          whatsapp_reminder_enabled?: boolean | null
          whatsapp_template?: string | null
        }
        Relationships: []
      }
      destination_cities: {
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
      login_attempts: {
        Row: {
          failed_count: number
          locked_until: string | null
          updated_at: string
          username: string
        }
        Insert: {
          failed_count?: number
          locked_until?: string | null
          updated_at?: string
          username: string
        }
        Update: {
          failed_count?: number
          locked_until?: string | null
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      luggage_bookings: {
        Row: {
          amount_to_owner: number
          bus_id: string | null
          bus_name: string
          created_at: string
          created_by: string | null
          destination: string
          id: string
          item_name: string | null
          journey_date: string
          notes: string | null
          our_earning: number
          party_name: string | null
          quantity: number
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_to_owner?: number
          bus_id?: string | null
          bus_name: string
          created_at?: string
          created_by?: string | null
          destination: string
          id?: string
          item_name?: string | null
          journey_date: string
          notes?: string | null
          our_earning?: number
          party_name?: string | null
          quantity?: number
          total_amount?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_to_owner?: number
          bus_id?: string | null
          bus_name?: string
          created_at?: string
          created_by?: string | null
          destination?: string
          id?: string
          item_name?: string | null
          journey_date?: string
          notes?: string | null
          our_earning?: number
          party_name?: string | null
          quantity?: number
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      luggage_parties: {
        Row: {
          active: boolean
          created_at: string
          destination: string
          id: string
          item_name: string
          party_name: string
          rate: number
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          destination: string
          id?: string
          item_name: string
          party_name: string
          rate?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          destination?: string
          id?: string
          item_name?: string
          party_name?: string
          rate?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      luggage_rates: {
        Row: {
          created_at: string
          destination: string
          id: string
          item_name: string
          rate: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          destination: string
          id?: string
          item_name?: string
          rate?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          destination?: string
          id?: string
          item_name?: string
          rate?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      owner_security: {
        Row: {
          failed_attempts: number
          locked_until: string | null
          password_hash: string
          updated_at: string
          user_id: string
        }
        Insert: {
          failed_attempts?: number
          locked_until?: string | null
          password_hash: string
          updated_at?: string
          user_id: string
        }
        Update: {
          failed_attempts?: number
          locked_until?: string | null
          password_hash?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pay_collection_entries: {
        Row: {
          amount: number
          booked_by: string | null
          collection_status: string
          created_at: string
          entry_payment_mode: string | null
          id: string
          paid_at: string | null
          paid_by: string | null
          payment_mode: string | null
          receiver_mobile: string | null
          receiver_name: string | null
          ticket_no: string
          tours_to: string | null
          travels_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          booked_by?: string | null
          collection_status?: string
          created_at?: string
          entry_payment_mode?: string | null
          id?: string
          paid_at?: string | null
          paid_by?: string | null
          payment_mode?: string | null
          receiver_mobile?: string | null
          receiver_name?: string | null
          ticket_no: string
          tours_to?: string | null
          travels_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          booked_by?: string | null
          collection_status?: string
          created_at?: string
          entry_payment_mode?: string | null
          id?: string
          paid_at?: string | null
          paid_by?: string | null
          payment_mode?: string | null
          receiver_mobile?: string | null
          receiver_name?: string | null
          ticket_no?: string
          tours_to?: string | null
          travels_name?: string
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
          booking_type_id: string | null
          bus_id: string | null
          bus_name: string | null
          collected_at: string | null
          commission_percent: number
          created_at: string
          created_by: string | null
          destination: string | null
          from_city: string | null
          id: string
          journey_date: string
          notes: string | null
          original_amount_from_agent: number | null
          our_earning: number
          passenger_name: string | null
          passenger_phone: string | null
          seat_number: number
          ticket_id: string | null
          ticket_no: string | null
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
          booking_type_id?: string | null
          bus_id?: string | null
          bus_name?: string | null
          collected_at?: string | null
          commission_percent?: number
          created_at?: string
          created_by?: string | null
          destination?: string | null
          from_city?: string | null
          id?: string
          journey_date: string
          notes?: string | null
          original_amount_from_agent?: number | null
          our_earning?: number
          passenger_name?: string | null
          passenger_phone?: string | null
          seat_number: number
          ticket_id?: string | null
          ticket_no?: string | null
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
          booking_type_id?: string | null
          bus_id?: string | null
          bus_name?: string | null
          collected_at?: string | null
          commission_percent?: number
          created_at?: string
          created_by?: string | null
          destination?: string | null
          from_city?: string | null
          id?: string
          journey_date?: string
          notes?: string | null
          original_amount_from_agent?: number | null
          our_earning?: number
          passenger_name?: string | null
          passenger_phone?: string | null
          seat_number?: number
          ticket_id?: string | null
          ticket_no?: string | null
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
      seat_layout_cells: {
        Row: {
          cell_type: string
          deck: string | null
          grid_col: number
          grid_row: number
          id: string
          label: string | null
          layout_id: string
          seat_number: number | null
        }
        Insert: {
          cell_type?: string
          deck?: string | null
          grid_col: number
          grid_row: number
          id?: string
          label?: string | null
          layout_id: string
          seat_number?: number | null
        }
        Update: {
          cell_type?: string
          deck?: string | null
          grid_col?: number
          grid_row?: number
          id?: string
          label?: string | null
          layout_id?: string
          seat_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "seat_layout_cells_layout_id_fkey"
            columns: ["layout_id"]
            isOneToOne: false
            referencedRelation: "seat_layouts"
            referencedColumns: ["id"]
          },
        ]
      }
      seat_layouts: {
        Row: {
          cols: number
          company_id: string | null
          created_at: string
          id: string
          name: string
          rows: number
          total_berths: number
          user_id: string
        }
        Insert: {
          cols: number
          company_id?: string | null
          created_at?: string
          id?: string
          name: string
          rows: number
          total_berths: number
          user_id: string
        }
        Update: {
          cols?: number
          company_id?: string | null
          created_at?: string
          id?: string
          name?: string
          rows?: number
          total_berths?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "seat_layouts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "bus_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_members: {
        Row: {
          active: boolean
          created_at: string
          created_by: string | null
          full_name: string
          id: string
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          full_name: string
          id?: string
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          full_name?: string
          id?: string
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: []
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
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      agent_pending_totals: {
        Args: never
        Returns: {
          agent_id: string
          collected: number
          original: number
          pending: number
          pending_count: number
        }[]
      }
      apply_agent_payment: {
        Args: {
          _agent_id: string
          _amount_paid: number
          _full_ids: string[]
          _new_advance: number
          _notes: string
          _partials: Json
          _party_key: string
          _payment_mode: string
          _received_by: string
          _zero_amount: boolean
        }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      login_locked_until: { Args: { _username: string }; Returns: string }
      next_ticket_no: { Args: never; Returns: string }
      record_login_attempt: {
        Args: { _success: boolean; _username: string }
        Returns: undefined
      }
      set_owner_password: {
        Args: { _current: string; _new: string }
        Returns: Json
      }
      verify_owner_password: { Args: { _password: string }; Returns: Json }
    }
    Enums: {
      app_role: "admin" | "staff"
      booking_type: "online" | "agent" | "self" | "return" | "sonu" | "royal"
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
    Enums: {
      app_role: ["admin", "staff"],
      booking_type: ["online", "agent", "self", "return", "sonu", "royal"],
    },
  },
} as const
