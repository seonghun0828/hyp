import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 환경 변수가 있을 때만 Supabase 클라이언트 생성
export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

// Database types
export interface Database {
  public: {
    Tables: {
      product_summaries: {
        Row: {
          id: string;
          url: string;
          title: string;
          description: string;
          features: string[];
          target_users: string[];
          created_at: string;
        };
        Insert: {
          id?: string;
          url: string;
          title: string;
          description: string;
          features: string[];
          target_users: string[];
          created_at?: string;
        };
        Update: {
          id?: string;
          url?: string;
          title?: string;
          description?: string;
          features?: string[];
          target_users?: string[];
          created_at?: string;
        };
      };
      generated_contents: {
        Row: {
          id: string;
          summary_id: string;
          concept_id: string;
          prompt: string;
          image_url: string | null;
          text_options: string[];
          selected_text_index: number | null;
          final_image_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          summary_id: string;
          concept_id: string;
          prompt: string;
          image_url?: string | null;
          text_options: string[];
          selected_text_index?: number | null;
          final_image_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          summary_id?: string;
          concept_id?: string;
          prompt?: string;
          image_url?: string | null;
          text_options?: string[];
          selected_text_index?: number | null;
          final_image_url?: string | null;
          created_at?: string;
        };
      };
    };
  };
}
