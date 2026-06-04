import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          mobile_number: string | null;
          date_of_birth: string | null;
          created_at: string | null;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          mobile_number?: string | null;
          date_of_birth?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          mobile_number?: string | null;
          date_of_birth?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      passages: {
        Row: {
          id: string;
          text: string;
          language: string;
          level: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          text: string;
          language: string;
          level: string;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          text?: string;
          language?: string;
          level?: string;
          created_at?: string | null;
        };
        Relationships: [];
      };
      test_results: {
        Row: {
          id: string;
          user_id: string;
          passage_id: string;
          wpm: number | null;
          accuracy: number | null;
          strokes: number | null;
          duration_seconds: number | null;
          language: string | null;
          level: string | null;
          typed_text: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          passage_id: string;
          wpm?: number | null;
          accuracy?: number | null;
          strokes?: number | null;
          duration_seconds?: number | null;
          language?: string | null;
          level?: string | null;
          typed_text?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          passage_id?: string;
          wpm?: number | null;
          accuracy?: number | null;
          strokes?: number | null;
          duration_seconds?: number | null;
          language?: string | null;
          level?: string | null;
          typed_text?: string | null;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "test_results_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "test_results_passage_id_fkey";
            columns: ["passage_id"];
            isOneToOne: false;
            referencedRelation: "passages";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
    CompositeTypes: {};
  };
};

// Using singleton pattern with proper session management
let supabaseInstance: SupabaseClient<Database> | null = null;

export const createBrowserClient = () => {
  if (!supabaseInstance) {
    supabaseInstance = createClient<Database>(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      }
    });
  }
  return supabaseInstance;
};

export const supabase = createBrowserClient();

// Admin email for admin panel access
export const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'lakshmitechinstitute97@gmail.com';
