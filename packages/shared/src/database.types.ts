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
      athletes: {
        Row: {
          active: boolean
          birth_date: string
          club_id: string
          created_at: string
          first_name: string
          id: string
          last_name: string
          photo_url: string | null
          sex: Database["public"]["Enums"]["sex"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          active?: boolean
          birth_date: string
          club_id: string
          created_at?: string
          first_name: string
          id?: string
          last_name: string
          photo_url?: string | null
          sex: Database["public"]["Enums"]["sex"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          active?: boolean
          birth_date?: string
          club_id?: string
          created_at?: string
          first_name?: string
          id?: string
          last_name?: string
          photo_url?: string | null
          sex?: Database["public"]["Enums"]["sex"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "athletes_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "athletes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      club_members: {
        Row: {
          club_id: string
          joined_at: string
          role_in_club: Database["public"]["Enums"]["club_role"]
          user_id: string
        }
        Insert: {
          club_id: string
          joined_at?: string
          role_in_club?: Database["public"]["Enums"]["club_role"]
          user_id: string
        }
        Update: {
          club_id?: string
          joined_at?: string
          role_in_club?: Database["public"]["Enums"]["club_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_members_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clubs: {
        Row: {
          city: string | null
          country: string
          created_at: string
          id: string
          logo_url: string | null
          name: string
          updated_at: string
        }
        Insert: {
          city?: string | null
          country?: string
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          city?: string | null
          country?: string
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      coach_athlete: {
        Row: {
          assigned_at: string
          athlete_id: string
          coach_id: string
        }
        Insert: {
          assigned_at?: string
          athlete_id: string
          coach_id: string
        }
        Update: {
          assigned_at?: string
          athlete_id?: string
          coach_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_athlete_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athlete_best_times"
            referencedColumns: ["athlete_id"]
          },
          {
            foreignKeyName: "coach_athlete_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_athlete_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes_with_age"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_athlete_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      coaches: {
        Row: {
          created_at: string
          id: string
          is_independent: boolean
          specialization: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_independent?: boolean
          specialization?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_independent?: boolean
          specialization?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coaches_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      metric_flags: {
        Row: {
          config_json: Json | null
          created_at: string
          enabled: boolean
          id: string
          key: string
          scope: Database["public"]["Enums"]["objective_scope"]
          scope_id: string | null
          updated_at: string
        }
        Insert: {
          config_json?: Json | null
          created_at?: string
          enabled?: boolean
          id?: string
          key: string
          scope?: Database["public"]["Enums"]["objective_scope"]
          scope_id?: string | null
          updated_at?: string
        }
        Update: {
          config_json?: Json | null
          created_at?: string
          enabled?: boolean
          id?: string
          key?: string
          scope?: Database["public"]["Enums"]["objective_scope"]
          scope_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      objective_assignments: {
        Row: {
          achieved_at: string | null
          athlete_id: string
          created_at: string
          custom_target_time_ms: number | null
          id: string
          objective_id: string
          status: Database["public"]["Enums"]["objective_status"]
          updated_at: string
        }
        Insert: {
          achieved_at?: string | null
          athlete_id: string
          created_at?: string
          custom_target_time_ms?: number | null
          id?: string
          objective_id: string
          status?: Database["public"]["Enums"]["objective_status"]
          updated_at?: string
        }
        Update: {
          achieved_at?: string | null
          athlete_id?: string
          created_at?: string
          custom_target_time_ms?: number | null
          id?: string
          objective_id?: string
          status?: Database["public"]["Enums"]["objective_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "objective_assignments_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athlete_best_times"
            referencedColumns: ["athlete_id"]
          },
          {
            foreignKeyName: "objective_assignments_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "objective_assignments_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes_with_age"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "objective_assignments_objective_id_fkey"
            columns: ["objective_id"]
            isOneToOne: false
            referencedRelation: "objectives"
            referencedColumns: ["id"]
          },
        ]
      }
      objectives: {
        Row: {
          club_id: string | null
          created_at: string
          created_by: string
          id: string
          scope: Database["public"]["Enums"]["objective_scope"]
          target_time_ms: number
          test_id: string
        }
        Insert: {
          club_id?: string | null
          created_at?: string
          created_by: string
          id?: string
          scope?: Database["public"]["Enums"]["objective_scope"]
          target_time_ms: number
          test_id: string
        }
        Update: {
          club_id?: string | null
          created_at?: string
          created_by?: string
          id?: string
          scope?: Database["public"]["Enums"]["objective_scope"]
          target_time_ms?: number
          test_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "objectives_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "objectives_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "objectives_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "athlete_best_times"
            referencedColumns: ["test_id"]
          },
          {
            foreignKeyName: "objectives_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name: string
          id: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      swim_competition_results: {
        Row: {
          age: number | null
          created_at: string
          distance_m: number
          event_date: string | null
          final_time_ms: number
          gender: Database["public"]["Enums"]["sex"]
          id: number
          rank: number | null
          round: string | null
          seed_time_ms: number | null
          source: string | null
          stroke: Database["public"]["Enums"]["swim_stroke"]
          swimmer_name: string
          swimmer_name_norm: string
          team_code: string | null
          tournament_name: string
          year: number
        }
        Insert: {
          age?: number | null
          created_at?: string
          distance_m: number
          event_date?: string | null
          final_time_ms: number
          gender: Database["public"]["Enums"]["sex"]
          id?: number
          rank?: number | null
          round?: string | null
          seed_time_ms?: number | null
          source?: string | null
          stroke: Database["public"]["Enums"]["swim_stroke"]
          swimmer_name: string
          swimmer_name_norm: string
          team_code?: string | null
          tournament_name: string
          year: number
        }
        Update: {
          age?: number | null
          created_at?: string
          distance_m?: number
          event_date?: string | null
          final_time_ms?: number
          gender?: Database["public"]["Enums"]["sex"]
          id?: number
          rank?: number | null
          round?: string | null
          seed_time_ms?: number | null
          source?: string | null
          stroke?: Database["public"]["Enums"]["swim_stroke"]
          swimmer_name?: string
          swimmer_name_norm?: string
          team_code?: string | null
          tournament_name?: string
          year?: number
        }
        Relationships: []
      }
      swim_strokes: {
        Row: {
          code: Database["public"]["Enums"]["swim_stroke"]
          id: number
          name_en: string
          name_es: string
        }
        Insert: {
          code: Database["public"]["Enums"]["swim_stroke"]
          id: number
          name_en: string
          name_es: string
        }
        Update: {
          code?: Database["public"]["Enums"]["swim_stroke"]
          id?: number
          name_en?: string
          name_es?: string
        }
        Relationships: []
      }
      tests: {
        Row: {
          created_at: string
          distance_m: number
          id: string
          pool_type: Database["public"]["Enums"]["pool_type"]
          stroke_id: number
        }
        Insert: {
          created_at?: string
          distance_m: number
          id?: string
          pool_type: Database["public"]["Enums"]["pool_type"]
          stroke_id: number
        }
        Update: {
          created_at?: string
          distance_m?: number
          id?: string
          pool_type?: Database["public"]["Enums"]["pool_type"]
          stroke_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "tests_stroke_id_fkey"
            columns: ["stroke_id"]
            isOneToOne: false
            referencedRelation: "swim_strokes"
            referencedColumns: ["id"]
          },
        ]
      }
      training_sessions: {
        Row: {
          athlete_id: string
          created_at: string
          created_by: string
          duration_min: number
          id: string
          notes: string | null
          session_date: string
          session_rpe: number
          session_type: Database["public"]["Enums"]["session_type"]
          updated_at: string
          validated_by: string | null
        }
        Insert: {
          athlete_id: string
          created_at?: string
          created_by: string
          duration_min: number
          id?: string
          notes?: string | null
          session_date: string
          session_rpe: number
          session_type: Database["public"]["Enums"]["session_type"]
          updated_at?: string
          validated_by?: string | null
        }
        Update: {
          athlete_id?: string
          created_at?: string
          created_by?: string
          duration_min?: number
          id?: string
          notes?: string | null
          session_date?: string
          session_rpe?: number
          session_type?: Database["public"]["Enums"]["session_type"]
          updated_at?: string
          validated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_sessions_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athlete_best_times"
            referencedColumns: ["athlete_id"]
          },
          {
            foreignKeyName: "training_sessions_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_sessions_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes_with_age"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_sessions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_sessions_validated_by_fkey"
            columns: ["validated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      training_sets: {
        Row: {
          attempt_no: number
          created_at: string
          id: string
          is_best: boolean
          pool_length_m: number
          session_id: string
          test_id: string
          total_time_ms: number
        }
        Insert: {
          attempt_no?: number
          created_at?: string
          id?: string
          is_best?: boolean
          pool_length_m?: number
          session_id: string
          test_id: string
          total_time_ms: number
        }
        Update: {
          attempt_no?: number
          created_at?: string
          id?: string
          is_best?: boolean
          pool_length_m?: number
          session_id?: string
          test_id?: string
          total_time_ms?: number
        }
        Relationships: [
          {
            foreignKeyName: "training_sets_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "training_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_sets_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "training_sessions_with_load"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_sets_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "athlete_best_times"
            referencedColumns: ["test_id"]
          },
          {
            foreignKeyName: "training_sets_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
        ]
      }
      training_splits: {
        Row: {
          id: string
          split_distance_m: number
          split_index: number
          split_time_ms: number
          training_set_id: string
        }
        Insert: {
          id?: string
          split_distance_m: number
          split_index: number
          split_time_ms: number
          training_set_id: string
        }
        Update: {
          id?: string
          split_distance_m?: number
          split_index?: number
          split_time_ms?: number
          training_set_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_splits_training_set_id_fkey"
            columns: ["training_set_id"]
            isOneToOne: false
            referencedRelation: "training_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      training_strokes: {
        Row: {
          id: string
          length_index: number
          stroke_count: number
          training_set_id: string
        }
        Insert: {
          id?: string
          length_index: number
          stroke_count: number
          training_set_id: string
        }
        Update: {
          id?: string
          length_index?: number
          stroke_count?: number
          training_set_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_strokes_training_set_id_fkey"
            columns: ["training_set_id"]
            isOneToOne: false
            referencedRelation: "training_sets"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      athlete_best_times: {
        Row: {
          achieved_date: string | null
          age: number | null
          age_category: string | null
          athlete_id: string | null
          athlete_name: string | null
          best_time_formatted: string | null
          best_time_ms: number | null
          distance_m: number | null
          pool_type: Database["public"]["Enums"]["pool_type"] | null
          sex: Database["public"]["Enums"]["sex"] | null
          stroke: Database["public"]["Enums"]["swim_stroke"] | null
          test_id: string | null
        }
        Relationships: []
      }
      athletes_with_age: {
        Row: {
          active: boolean | null
          age: number | null
          age_category: string | null
          birth_date: string | null
          club_id: string | null
          club_name: string | null
          created_at: string | null
          first_name: string | null
          id: string | null
          last_name: string | null
          photo_url: string | null
          sex: Database["public"]["Enums"]["sex"] | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "athletes_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "athletes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      training_sessions_with_load: {
        Row: {
          athlete_id: string | null
          athlete_name: string | null
          created_at: string | null
          created_by: string | null
          duration_min: number | null
          id: string | null
          notes: string | null
          session_date: string | null
          session_rpe: number | null
          session_type: Database["public"]["Enums"]["session_type"] | null
          training_load: number | null
          updated_at: string | null
          validated_by: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_sessions_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athlete_best_times"
            referencedColumns: ["athlete_id"]
          },
          {
            foreignKeyName: "training_sessions_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_sessions_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes_with_age"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_sessions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_sessions_validated_by_fkey"
            columns: ["validated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      calculate_age: {
        Args: { birth_date: string; reference_date?: string }
        Returns: number
      }
      calculate_swimming_metrics: {
        Args: { p_training_set_id: string }
        Returns: {
          dps: number
          stroke_frequency: number
          swim_index: number
          velocity: number
        }[]
      }
      calculate_training_load: {
        Args: { duration_min: number; rpe: number }
        Returns: number
      }
      get_age_category: { Args: { age: number }; Returns: string }
      get_club_rankings: {
        Args: {
          p_age_category?: string
          p_club_id: string
          p_limit?: number
          p_sex?: Database["public"]["Enums"]["sex"]
          p_test_id: string
        }
        Returns: {
          achieved_date: string
          age: number
          age_category: string
          athlete_id: string
          athlete_name: string
          best_time_formatted: string
          best_time_ms: number
          rank: number
        }[]
      }
      get_direct_competitors: {
        Args: {
          p_athlete_id: string
          p_mode?: string
          p_test_id: string
          p_time_ms: number
        }
        Returns: {
          athlete_name: string
          competitor_athlete_id: string
          relative_position: string
          time_diff_ms: number
          time_formatted: string
          time_ms: number
        }[]
      }
      get_user_club_ids: { Args: Record<PropertyKey, never>; Returns: string[] }
      is_admin: { Args: Record<PropertyKey, never>; Returns: boolean }
      is_club_admin: { Args: { check_club_id: string }; Returns: boolean }
      is_coach_of_athlete: {
        Args: { check_athlete_id: string }
        Returns: boolean
      }
      ms_to_time_string: { Args: { ms: number }; Returns: string }
    }
    Enums: {
      club_role: "ADMIN" | "COACH" | "ATHLETE"
      objective_scope: "GLOBAL" | "CLUB" | "TEMPLATE"
      objective_status: "PENDING" | "IN_PROGRESS" | "ACHIEVED" | "FAILED"
      pool_type: "SCM" | "LCM"
      session_type: "AEROBIC" | "THRESHOLD" | "SPEED" | "TECH"
      sex: "M" | "F"
      swim_stroke: "FREE" | "BACK" | "BREAST" | "FLY" | "IM"
      user_role: "ADMIN" | "CLUB_ADMIN" | "COACH" | "ATHLETE"
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
