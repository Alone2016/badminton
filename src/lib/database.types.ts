// Kiểu dữ liệu của database, khớp với supabase/migrations.
// Sau khi đổi migration, chạy `npm run db:types` để sinh lại file này.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      members: {
        Row: {
          id: string;
          name: string;
          email: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      play_sessions: {
        Row: {
          id: string;
          started_at: string;
          duration_minutes: number;
          court: string;
          cost_vnd: number;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          started_at: string;
          duration_minutes: number;
          court: string;
          cost_vnd?: number;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          started_at?: string;
          duration_minutes?: number;
          court?: string;
          cost_vnd?: number;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "play_sessions_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "members";
            referencedColumns: ["id"];
          },
        ];
      };
      play_session_players: {
        Row: {
          id: string;
          session_id: string;
          member_id: string | null;
          guest_name: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          member_id?: string | null;
          guest_name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          member_id?: string | null;
          guest_name?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "play_session_players_member_id_fkey";
            columns: ["member_id"];
            isOneToOne: false;
            referencedRelation: "members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "play_session_players_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "play_sessions";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      can_sign_in: { Args: { p_email: string }; Returns: boolean };
      current_member_id: { Args: never; Returns: string };
      is_member: { Args: never; Returns: boolean };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
