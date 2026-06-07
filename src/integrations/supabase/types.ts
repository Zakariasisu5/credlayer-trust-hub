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
      agent_activity_log: {
        Row: {
          action: string
          created_at: string
          details: Json
          id: string
          message: string
          status: string
          wallet_address: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json
          id?: string
          message?: string
          status?: string
          wallet_address: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json
          id?: string
          message?: string
          status?: string
          wallet_address?: string
        }
        Relationships: []
      }
      agent_permissions: {
        Row: {
          created_at: string
          description: string
          expires_at: string | null
          granted: boolean
          id: string
          label: string
          permission_key: string
          revoked_at: string | null
          scope: string
          updated_at: string
          wallet_address: string
        }
        Insert: {
          created_at?: string
          description?: string
          expires_at?: string | null
          granted?: boolean
          id?: string
          label: string
          permission_key: string
          revoked_at?: string | null
          scope?: string
          updated_at?: string
          wallet_address: string
        }
        Update: {
          created_at?: string
          description?: string
          expires_at?: string | null
          granted?: boolean
          id?: string
          label?: string
          permission_key?: string
          revoked_at?: string | null
          scope?: string
          updated_at?: string
          wallet_address?: string
        }
        Relationships: []
      }
      api_keys: {
        Row: {
          created_at: string
          id: string
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          name: string
          owner_wallet: string
          request_count: number
        }
        Insert: {
          created_at?: string
          id?: string
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          name: string
          owner_wallet: string
          request_count?: number
        }
        Update: {
          created_at?: string
          id?: string
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string
          owner_wallet?: string
          request_count?: number
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          notify_alerts: boolean
          notify_score_changes: boolean
          theme: string
          updated_at: string
          wallet_address: string
        }
        Insert: {
          notify_alerts?: boolean
          notify_score_changes?: boolean
          theme?: string
          updated_at?: string
          wallet_address: string
        }
        Update: {
          notify_alerts?: boolean
          notify_score_changes?: boolean
          theme?: string
          updated_at?: string
          wallet_address?: string
        }
        Relationships: []
      }
      verifiable_credentials: {
        Row: {
          credential_hash: string
          credential_id: string
          expires_at: string | null
          id: string
          issued_at: string
          issuer: string
          onchain_tx: string | null
          payload: Json
          revoked_at: string | null
          risk_level: string
          signature: string | null
          status: string
          subject_wallet: string
          trust_score: number
        }
        Insert: {
          credential_hash: string
          credential_id: string
          expires_at?: string | null
          id?: string
          issued_at?: string
          issuer?: string
          onchain_tx?: string | null
          payload?: Json
          revoked_at?: string | null
          risk_level: string
          signature?: string | null
          status?: string
          subject_wallet: string
          trust_score: number
        }
        Update: {
          credential_hash?: string
          credential_id?: string
          expires_at?: string | null
          id?: string
          issued_at?: string
          issuer?: string
          onchain_tx?: string | null
          payload?: Json
          revoked_at?: string | null
          risk_level?: string
          signature?: string | null
          status?: string
          subject_wallet?: string
          trust_score?: number
        }
        Relationships: []
      }
      wallet_analyses: {
        Row: {
          ai_insights: Json
          analytics: Json
          behavioral_metrics: Json
          confidence: number
          created_at: string
          recent_activity: Json
          reputation_history: Json
          risk_level: string
          risk_predictions: Json
          suspicious_flags: Json
          trust_score: number
          updated_at: string
          wallet_address: string
        }
        Insert: {
          ai_insights?: Json
          analytics?: Json
          behavioral_metrics?: Json
          confidence?: number
          created_at?: string
          recent_activity?: Json
          reputation_history?: Json
          risk_level: string
          risk_predictions?: Json
          suspicious_flags?: Json
          trust_score: number
          updated_at?: string
          wallet_address: string
        }
        Update: {
          ai_insights?: Json
          analytics?: Json
          behavioral_metrics?: Json
          confidence?: number
          created_at?: string
          recent_activity?: Json
          reputation_history?: Json
          risk_level?: string
          risk_predictions?: Json
          suspicious_flags?: Json
          trust_score?: number
          updated_at?: string
          wallet_address?: string
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
