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
      marketing_text_cache: {
        Row: {
          id: string;
          cache_key: string;
          url: string;
          concept_name: string;
          simple: string;
          unexpected: string;
          concrete: string;
          credible: string;
          emotional: string;
          story: string;
          created_at: string;
          expires_at: string;
        };
        Insert: {
          id?: string;
          cache_key: string;
          url: string;
          concept_name: string;
          simple: string;
          unexpected: string;
          concrete: string;
          credible: string;
          emotional: string;
          story: string;
          created_at?: string;
          expires_at?: string;
        };
        Update: {
          id?: string;
          cache_key?: string;
          url?: string;
          concept_name?: string;
          simple?: string;
          unexpected?: string;
          concrete?: string;
          credible?: string;
          emotional?: string;
          story?: string;
          created_at?: string;
          expires_at?: string;
        };
      };
    };
  };
}

// 캐시 조회 함수
export async function getMarketingTextCache(cacheKey: string) {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  const { data, error } = await supabase
    .from('marketing_text_cache')
    .select('*')
    .eq('cache_key', cacheKey)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116은 "no rows found" 에러
    throw error;
  }

  return data;
}

// 캐시 저장 함수
export async function saveMarketingTextCache(cacheData: {
  cache_key: string;
  url: string;
  concept_name: string;
  simple: string;
  unexpected: string;
  concrete: string;
  credible: string;
  emotional: string;
  story: string;
}) {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  const { data, error } = await supabase
    .from('marketing_text_cache')
    .upsert(cacheData, { onConflict: 'cache_key' })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}
