-- HYP MVP Database Schema
-- Supabase PostgreSQL 테이블 생성 스크립트

-- 제품 요약 정보 테이블
CREATE TABLE IF NOT EXISTS product_summaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL,
  title TEXT,
  core_value TEXT NOT NULL,
  target_customer TEXT NOT NULL,
  competitive_edge TEXT NOT NULL,
  customer_benefit TEXT NOT NULL,
  emotional_keyword TEXT,
  feature_summary TEXT,
  usage_scenario TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 생성된 콘텐츠 테이블
CREATE TABLE IF NOT EXISTS generated_contents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  summary_id UUID NOT NULL REFERENCES product_summaries(id) ON DELETE CASCADE,
  concept_id TEXT NOT NULL,
  prompt TEXT NOT NULL,
  image_url TEXT,
  text_options TEXT[] NOT NULL DEFAULT '{}',
  selected_text_index INTEGER,
  final_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SUCCESs 원칙 홍보문구 캐시 테이블
CREATE TABLE IF NOT EXISTS marketing_text_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cache_key TEXT NOT NULL UNIQUE,  -- url_conceptName 형태
  url TEXT NOT NULL,
  concept_name TEXT NOT NULL,
  simple TEXT NOT NULL,
  unexpected TEXT NOT NULL,
  concrete TEXT NOT NULL,
  credible TEXT NOT NULL,
  emotional TEXT NOT NULL,
  story TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days')
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_product_summaries_url ON product_summaries(url);
CREATE INDEX IF NOT EXISTS idx_product_summaries_created_at ON product_summaries(created_at);
CREATE INDEX IF NOT EXISTS idx_generated_contents_summary_id ON generated_contents(summary_id);
CREATE INDEX IF NOT EXISTS idx_generated_contents_concept_id ON generated_contents(concept_id);
CREATE INDEX IF NOT EXISTS idx_generated_contents_created_at ON generated_contents(created_at);
CREATE INDEX IF NOT EXISTS idx_marketing_cache_key ON marketing_text_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_marketing_cache_expires ON marketing_text_cache(expires_at);

-- RLS (Row Level Security) 정책 설정
ALTER TABLE product_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_text_cache ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽기/쓰기 가능하도록 설정 (MVP용)
CREATE POLICY "Allow all operations on product_summaries" ON product_summaries
  FOR ALL USING (true);

CREATE POLICY "Allow all operations on generated_contents" ON generated_contents
  FOR ALL USING (true);

CREATE POLICY "Allow all operations on marketing_text_cache" ON marketing_text_cache
  FOR ALL USING (true);

-- 만료된 캐시 자동 삭제는 애플리케이션 레벨에서 처리
-- 또는 Supabase에서 pg_cron 확장을 활성화한 후 위의 cron.schedule 코드를 실행
