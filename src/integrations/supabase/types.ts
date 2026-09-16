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
      aircraft: {
        Row: {
          base: string | null
          created_at: string
          fuel_level: number
          hours_flown: number
          model: string
          next_assignment: string | null
          status: string
          tail: string
        }
        Insert: {
          base?: string | null
          created_at?: string
          fuel_level?: number
          hours_flown?: number
          model: string
          next_assignment?: string | null
          status?: string
          tail: string
        }
        Update: {
          base?: string | null
          created_at?: string
          fuel_level?: number
          hours_flown?: number
          model?: string
          next_assignment?: string | null
          status?: string
          tail?: string
        }
        Relationships: []
      }
      airports: {
        Row: {
          city: string
          code: string
          congestion: number
          country: string
          created_at: string
          gates: number
          lat: number
          lon: number
          name: string
          runways: number
          status: string
          visibility_km: number
          weather: string
          wind_kts: number
        }
        Insert: {
          city: string
          code: string
          congestion?: number
          country: string
          created_at?: string
          gates?: number
          lat: number
          lon: number
          name: string
          runways?: number
          status?: string
          visibility_km?: number
          weather?: string
          wind_kts?: number
        }
        Update: {
          city?: string
          code?: string
          congestion?: number
          country?: string
          created_at?: string
          gates?: number
          lat?: number
          lon?: number
          name?: string
          runways?: number
          status?: string
          visibility_km?: number
          weather?: string
          wind_kts?: number
        }
        Relationships: []
      }
      baggage_items: {
        Row: {
          booking_id: string
          created_at: string
          id: string
          kind: string
          passenger_id: string | null
          price: number
          quantity: number
          weight_kg: number
        }
        Insert: {
          booking_id: string
          created_at?: string
          id?: string
          kind?: string
          passenger_id?: string | null
          price?: number
          quantity?: number
          weight_kg?: number
        }
        Update: {
          booking_id?: string
          created_at?: string
          id?: string
          kind?: string
          passenger_id?: string | null
          price?: number
          quantity?: number
          weight_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: "baggage_items_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "baggage_items_passenger_id_fkey"
            columns: ["passenger_id"]
            isOneToOne: false
            referencedRelation: "booking_passengers"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_passengers: {
        Row: {
          booking_id: string
          created_at: string
          date_of_birth: string | null
          document_no: string | null
          email: string | null
          full_name: string
          id: string
          is_primary: boolean
          meal: string | null
          phone: string | null
          seat: string | null
          updated_at: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          date_of_birth?: string | null
          document_no?: string | null
          email?: string | null
          full_name: string
          id?: string
          is_primary?: boolean
          meal?: string | null
          phone?: string | null
          seat?: string | null
          updated_at?: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          date_of_birth?: string | null
          document_no?: string | null
          email?: string | null
          full_name?: string
          id?: string
          is_primary?: boolean
          meal?: string | null
          phone?: string | null
          seat?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_passengers_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          base_amount: number
          cabin: string
          checked_in_at: string | null
          created_at: string
          currency: string
          extras_amount: number
          flight_no: string | null
          id: string
          reference: string
          status: string
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          base_amount?: number
          cabin?: string
          checked_in_at?: string | null
          created_at?: string
          currency?: string
          extras_amount?: number
          flight_no?: string | null
          id?: string
          reference: string
          status?: string
          total_amount?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          base_amount?: number
          cabin?: string
          checked_in_at?: string | null
          created_at?: string
          currency?: string
          extras_amount?: number
          flight_no?: string | null
          id?: string
          reference?: string
          status?: string
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_flight_no_fkey"
            columns: ["flight_no"]
            isOneToOne: false
            referencedRelation: "flights"
            referencedColumns: ["flight_no"]
          },
        ]
      }
      delay_events: {
        Row: {
          affected_passengers: number
          created_at: string
          flight_no: string
          id: string
          minutes: number
          reason: string
          recovery_status: string | null
          revenue_impact: number
        }
        Insert: {
          affected_passengers?: number
          created_at?: string
          flight_no: string
          id?: string
          minutes: number
          reason: string
          recovery_status?: string | null
          revenue_impact?: number
        }
        Update: {
          affected_passengers?: number
          created_at?: string
          flight_no?: string
          id?: string
          minutes?: number
          reason?: string
          recovery_status?: string | null
          revenue_impact?: number
        }
        Relationships: [
          {
            foreignKeyName: "delay_events_flight_no_fkey"
            columns: ["flight_no"]
            isOneToOne: false
            referencedRelation: "flights"
            referencedColumns: ["flight_no"]
          },
        ]
      }
      flight_events: {
        Row: {
          at: string
          flight_no: string
          id: string
          note: string | null
          stage: string
        }
        Insert: {
          at: string
          flight_no: string
          id?: string
          note?: string | null
          stage: string
        }
        Update: {
          at?: string
          flight_no?: string
          id?: string
          note?: string | null
          stage?: string
        }
        Relationships: [
          {
            foreignKeyName: "flight_events_flight_no_fkey"
            columns: ["flight_no"]
            isOneToOne: false
            referencedRelation: "flights"
            referencedColumns: ["flight_no"]
          },
        ]
      }
      flights: {
        Row: {
          actual_arr: string | null
          actual_dep: string | null
          aircraft_tail: string | null
          cabin: string | null
          captain: string | null
          created_at: string
          current_lat: number | null
          current_lon: number | null
          delay_minutes: number
          destination: string
          flight_no: string
          gate: string | null
          id: string
          occupancy: number
          origin: string
          scheduled_arr: string
          scheduled_dep: string
          status: string
          terminal: string | null
          weather: string | null
        }
        Insert: {
          actual_arr?: string | null
          actual_dep?: string | null
          aircraft_tail?: string | null
          cabin?: string | null
          captain?: string | null
          created_at?: string
          current_lat?: number | null
          current_lon?: number | null
          delay_minutes?: number
          destination: string
          flight_no: string
          gate?: string | null
          id?: string
          occupancy?: number
          origin: string
          scheduled_arr: string
          scheduled_dep: string
          status?: string
          terminal?: string | null
          weather?: string | null
        }
        Update: {
          actual_arr?: string | null
          actual_dep?: string | null
          aircraft_tail?: string | null
          cabin?: string | null
          captain?: string | null
          created_at?: string
          current_lat?: number | null
          current_lon?: number | null
          delay_minutes?: number
          destination?: string
          flight_no?: string
          gate?: string | null
          id?: string
          occupancy?: number
          origin?: string
          scheduled_arr?: string
          scheduled_dep?: string
          status?: string
          terminal?: string | null
          weather?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "flights_aircraft_tail_fkey"
            columns: ["aircraft_tail"]
            isOneToOne: false
            referencedRelation: "aircraft"
            referencedColumns: ["tail"]
          },
          {
            foreignKeyName: "flights_destination_fkey"
            columns: ["destination"]
            isOneToOne: false
            referencedRelation: "airports"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "flights_origin_fkey"
            columns: ["origin"]
            isOneToOne: false
            referencedRelation: "airports"
            referencedColumns: ["code"]
          },
        ]
      }
      leads: {
        Row: {
          company: string | null
          created_at: string
          email: string
          id: string
          message: string | null
          name: string
          source: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          email: string
          id?: string
          message?: string | null
          name: string
          source?: string
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string
          id?: string
          message?: string | null
          name?: string
          source?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          category: string
          created_at: string
          id: string
          link: string | null
          priority: string
          read: boolean
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          category?: string
          created_at?: string
          id?: string
          link?: string | null
          priority?: string
          read?: boolean
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          category?: string
          created_at?: string
          id?: string
          link?: string | null
          priority?: string
          read?: boolean
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      ops_notifications: {
        Row: {
          airport_code: string | null
          body: string | null
          created_at: string
          flight_no: string | null
          id: string
          read: boolean
          severity: string
          title: string
          type: string
        }
        Insert: {
          airport_code?: string | null
          body?: string | null
          created_at?: string
          flight_no?: string | null
          id?: string
          read?: boolean
          severity?: string
          title: string
          type: string
        }
        Update: {
          airport_code?: string | null
          body?: string | null
          created_at?: string
          flight_no?: string | null
          id?: string
          read?: boolean
          severity?: string
          title?: string
          type?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          booking_id: string
          created_at: string
          currency: string
          id: string
          method: string
          reference: string
          status: string
        }
        Insert: {
          amount: number
          booking_id: string
          created_at?: string
          currency?: string
          id?: string
          method?: string
          reference: string
          status?: string
        }
        Update: {
          amount?: number
          booking_id?: string
          created_at?: string
          currency?: string
          id?: string
          method?: string
          reference?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          miles: number
          phone: string | null
          tier: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          miles?: number
          phone?: string | null
          tier?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          miles?: number
          phone?: string | null
          tier?: string
          updated_at?: string
        }
        Relationships: []
      }
      refunds: {
        Row: {
          amount: number
          booking_id: string
          created_at: string
          fee: number
          id: string
          reason: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount?: number
          booking_id: string
          created_at?: string
          fee?: number
          id?: string
          reason?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          booking_id?: string
          created_at?: string
          fee?: number
          id?: string
          reason?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "refunds_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      seat_assignments: {
        Row: {
          booking_id: string | null
          created_at: string
          flight_no: string
          id: string
          passenger_id: string | null
          seat: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          flight_no: string
          id?: string
          passenger_id?: string | null
          seat: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          flight_no?: string
          id?: string
          passenger_id?: string | null
          seat?: string
        }
        Relationships: [
          {
            foreignKeyName: "seat_assignments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seat_assignments_flight_no_fkey"
            columns: ["flight_no"]
            isOneToOne: false
            referencedRelation: "flights"
            referencedColumns: ["flight_no"]
          },
          {
            foreignKeyName: "seat_assignments_passenger_id_fkey"
            columns: ["passenger_id"]
            isOneToOne: false
            referencedRelation: "booking_passengers"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assignee_id: string | null
          assignee_name: string | null
          body: string | null
          booking_id: string | null
          category: string
          created_at: string
          flight_no: string | null
          id: string
          priority: string
          reference: string
          sentiment: string | null
          status: string
          subject: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          assignee_id?: string | null
          assignee_name?: string | null
          body?: string | null
          booking_id?: string | null
          category?: string
          created_at?: string
          flight_no?: string | null
          id?: string
          priority?: string
          reference: string
          sentiment?: string | null
          status?: string
          subject: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          assignee_id?: string | null
          assignee_name?: string | null
          body?: string | null
          booking_id?: string | null
          category?: string
          created_at?: string
          flight_no?: string | null
          id?: string
          priority?: string
          reference?: string
          sentiment?: string | null
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_attachments: {
        Row: {
          created_at: string
          file_name: string
          id: string
          mime_type: string
          size_bytes: number
          storage_path: string
          ticket_id: string
          uploader_id: string
          uploader_name: string | null
        }
        Insert: {
          created_at?: string
          file_name: string
          id?: string
          mime_type: string
          size_bytes: number
          storage_path: string
          ticket_id: string
          uploader_id: string
          uploader_name?: string | null
        }
        Update: {
          created_at?: string
          file_name?: string
          id?: string
          mime_type?: string
          size_bytes?: number
          storage_path?: string
          ticket_id?: string
          uploader_id?: string
          uploader_name?: string | null
        }
        Relationships: []
      }
      ticket_events: {
        Row: {
          actor_id: string | null
          actor_name: string | null
          created_at: string
          detail: string | null
          id: string
          ticket_id: string
          type: string
        }
        Insert: {
          actor_id?: string | null
          actor_name?: string | null
          created_at?: string
          detail?: string | null
          id?: string
          ticket_id: string
          type: string
        }
        Update: {
          actor_id?: string | null
          actor_name?: string | null
          created_at?: string
          detail?: string | null
          id?: string
          ticket_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_events_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_messages: {
        Row: {
          author_id: string | null
          author_name: string | null
          body: string
          created_at: string
          id: string
          kind: string
          ticket_id: string
        }
        Insert: {
          author_id?: string | null
          author_name?: string | null
          body: string
          created_at?: string
          id?: string
          kind?: string
          ticket_id: string
        }
        Update: {
          author_id?: string | null
          author_name?: string | null
          body?: string
          created_at?: string
          id?: string
          kind?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
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
      can_access_booking: { Args: { _booking_id: string }; Returns: boolean }
      can_access_ticket: { Args: { _ticket_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "support" | "user" | "passenger" | "ops"
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
      app_role: ["admin", "support", "user", "passenger", "ops"],
    },
  },
} as const
