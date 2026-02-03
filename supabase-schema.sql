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
  category_industry TEXT,
  category_form TEXT,
  category_purpose TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 생성된 콘텐츠 테이블
CREATE TABLE IF NOT EXISTS generated_contents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  summary_id UUID NOT NULL REFERENCES product_summaries(id) ON DELETE CASCADE,
  concept_id TEXT NOT NULL,
  image_prompt TEXT NOT NULL,
  image_url TEXT,
  texts TEXT[] NOT NULL DEFAULT '{}',
  selected_principle TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_promotional BOOLEAN DEFAULT FALSE
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

-- 간단 피드백 테이블
CREATE TABLE IF NOT EXISTS quick_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  result_id TEXT NOT NULL,
  quick_feedback TEXT NOT NULL CHECK (quick_feedback IN ('good', 'neutral', 'bad')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 유저 크레딧 테이블
CREATE TABLE IF NOT EXISTS user_credits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  anon_token TEXT UNIQUE,
  free_credits INTEGER DEFAULT 0,
  paid_credits INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT user_or_token_check CHECK (
    (user_id IS NOT NULL AND anon_token IS NULL) OR
    (user_id IS NULL AND anon_token IS NOT NULL)
  )
);

-- 크레딧 트랜잭션 테이블 (모든 크레딧 변동 기록)
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  anon_token TEXT,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  payment_order_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT user_or_token_check CHECK (
    (user_id IS NOT NULL AND anon_token IS NULL) OR
    (user_id IS NULL AND anon_token IS NOT NULL)
  )
);

-- 결제 주문 테이블 (Lemon Squeezy 결제 추적)
CREATE TABLE IF NOT EXISTS payment_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  order_id TEXT UNIQUE,
  checkout_id TEXT NOT NULL,
  variant_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  amount_usd INTEGER NOT NULL,
  credits_amount INTEGER NOT NULL,
  webhook_received_at TIMESTAMP WITH TIME ZONE,
  webhook_event_name TEXT,
  credits_granted BOOLEAN DEFAULT FALSE,
  credits_granted_at TIMESTAMP WITH TIME ZONE,
  customer_email TEXT,
  tier TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 결제 주문과 트랜잭션 연결
ALTER TABLE credit_transactions
ADD CONSTRAINT fk_payment_order
FOREIGN KEY (payment_order_id)
REFERENCES payment_orders(id)
ON DELETE SET NULL;

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_product_summaries_url ON product_summaries(url);
CREATE INDEX IF NOT EXISTS idx_product_summaries_created_at ON product_summaries(created_at);
CREATE INDEX IF NOT EXISTS idx_generated_contents_summary_id ON generated_contents(summary_id);
CREATE INDEX IF NOT EXISTS idx_generated_contents_concept_id ON generated_contents(concept_id);
CREATE INDEX IF NOT EXISTS idx_generated_contents_created_at ON generated_contents(created_at);
CREATE INDEX IF NOT EXISTS idx_marketing_cache_key ON marketing_text_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_marketing_cache_expires ON marketing_text_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_quick_feedback_user_id ON quick_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_quick_feedback_result_id ON quick_feedback(result_id);
CREATE INDEX IF NOT EXISTS idx_quick_feedback_created_at ON quick_feedback(created_at);
CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON user_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_user_credits_anon_token ON user_credits(anon_token);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_anon_token ON credit_transactions(anon_token);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_type ON credit_transactions(type);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_payment_order ON credit_transactions(payment_order_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_payment_orders_user_id ON payment_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_order_id ON payment_orders(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_checkout_id ON payment_orders(checkout_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_status ON payment_orders(status);

-- RLS (Row Level Security) 정책 설정
ALTER TABLE product_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_text_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE quick_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_orders ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽기/쓰기 가능하도록 설정 (MVP용)
CREATE POLICY "Allow all operations on product_summaries" ON product_summaries
  FOR ALL USING (true);

CREATE POLICY "Allow all operations on generated_contents" ON generated_contents
  FOR ALL USING (true);

CREATE POLICY "Allow all operations on marketing_text_cache" ON marketing_text_cache
  FOR ALL USING (true);

CREATE POLICY "Allow all operations on quick_feedback" ON quick_feedback
  FOR ALL USING (true);

-- 크레딧 테이블 정책: 자신의 크레딧만 볼 수 있음 (익명 토큰 포함 로직은 서버사이드에서 처리하거나 별도 정책 필요)
-- MVP에서는 간단하게 모든 작업 허용하되, 서버 사이드 로직으로 제어
CREATE POLICY "Allow all operations on user_credits" ON user_credits
  FOR ALL USING (true);

-- 크레딧 트랜잭션 정책
CREATE POLICY "Service role full access on credit_transactions" ON credit_transactions
  FOR ALL USING (true);

CREATE POLICY "Users view own credit transactions" ON credit_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- 결제 주문 정책
CREATE POLICY "Service role full access on payment_orders" ON payment_orders
  FOR ALL USING (true);

CREATE POLICY "Users view own payment orders" ON payment_orders
  FOR SELECT USING (auth.uid() = user_id);

-- 만료된 캐시 자동 삭제는 애플리케이션 레벨에서 처리
-- 또는 Supabase에서 pg_cron 확장을 활성화한 후 위의 cron.schedule 코드를 실행
