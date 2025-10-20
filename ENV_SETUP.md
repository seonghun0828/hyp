# HYP 환경 설정 가이드

## 1. API 키 발급

### OpenAI API 키

1. [OpenAI Platform](https://platform.openai.com/api-keys)에 접속
2. 계정 생성 또는 로그인
3. "Create new secret key" 클릭
4. 생성된 키를 복사하여 저장

### Google Gemini API 키

1. [Google AI Studio](https://aistudio.google.com/app/apikey)에 접속
2. Google 계정으로 로그인
3. "Create API Key" 클릭
4. 생성된 키를 복사하여 저장

### Supabase 프로젝트 생성

1. [Supabase](https://supabase.com)에 접속
2. "Start your project" 클릭
3. 새 프로젝트 생성
4. 프로젝트 설정에서 다음 정보 확인:
   - Project URL
   - API Keys > anon public key

## 2. 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용을 추가:

```env
# OpenAI API Key
OPENAI_API_KEY=your_openai_api_key_here

# OpenAI Model (선택사항, 기본값: gpt-5-mini)
# Free tier: gpt-3.5-turbo
# Paid tier: gpt-4, gpt-4-turbo, gpt-5-mini, gpt-5 등
OPENAI_MODEL=gpt-5-mini

# Google Gemini API Key
GEMINI_API_KEY=your_gemini_api_key_here

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

## 3. Supabase 데이터베이스 설정

1. Supabase 대시보드에서 SQL Editor 열기
2. `supabase-schema.sql` 파일의 내용을 복사하여 실행
3. 테이블이 정상적으로 생성되었는지 확인

## 4. 개발 서버 실행

```bash
npm run dev
```

## 5. 테스트

1. 브라우저에서 `http://localhost:3000` 접속
2. 테스트 URL 입력 (예: https://github.com/vercel/next.js)
3. 전체 퍼널 플로우 테스트

## 주의사항

- `.env.local` 파일은 절대 Git에 커밋하지 마세요
- API 키는 안전하게 보관하세요
- 프로덕션 배포 시 환경 변수를 올바르게 설정하세요
