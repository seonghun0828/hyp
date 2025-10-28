# Vercel 배포 가이드

이 문서는 HYP 프로젝트를 Vercel에 배포하는 전체 과정을 안내합니다.

## 사전 준비사항

- GitHub 계정
- Vercel 계정 (GitHub로 연동 가능)
- 환경 변수 값 (OpenAI API Key, Gemini API Key, Supabase URL 및 Key)

## 1단계: GitHub에 코드 Push

프로젝트가 아직 GitHub에 없다면:

```bash
# GitHub에서 새 레포지토리 생성 후
git remote add origin https://github.com/your-username/your-repo.git
git add .
git commit -m "Ready for deployment"
git push -u origin main
```

이미 GitHub에 있다면 최신 코드를 push:

```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push
```

## 2단계: Vercel 계정 생성 및 프로젝트 Import

1. [Vercel](https://vercel.com)에 접속
2. "Sign Up" 또는 "Log In" (GitHub 계정으로 연동 권장)
3. 대시보드에서 "Add New Project" 클릭
4. GitHub 레포지토리 목록에서 HYP 프로젝트 선택
   - 레포지토리가 보이지 않으면 "Adjust GitHub App Permissions" 클릭하여 권한 부여
5. "Import" 클릭

## 3단계: 프로젝트 설정

### Framework Preset
- Vercel이 자동으로 Next.js를 감지합니다
- 특별한 설정 변경 없이 기본값 사용

### Root Directory
- 기본값 `./` 유지

### Build and Output Settings
- Build Command: `next build` (자동 설정됨)
- Output Directory: `.next` (자동 설정됨)
- Install Command: Vercel이 `package.json`을 보고 자동으로 `pnpm install` 실행

## 4단계: 환경 변수 설정

**매우 중요:** 배포 전에 반드시 환경 변수를 설정해야 합니다.

1. "Environment Variables" 섹션 펼치기
2. 다음 환경 변수들을 하나씩 추가:

| Name | Value | 설명 |
|------|-------|------|
| `OPENAI_API_KEY` | `sk-proj-...` | OpenAI API 키 ([발급 방법](https://platform.openai.com/api-keys)) |
| `OPENAI_MODEL` | `gpt-4o-mini` | 사용할 OpenAI 모델 (선택사항) |
| `GEMINI_API_KEY` | `AIzaSy...` | Google Gemini API 키 ([발급 방법](https://aistudio.google.com/app/apikey)) |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbG...` | Supabase Anon Public Key |

3. 각 환경 변수의 "Environment" 옵션:
   - ✅ Production (필수)
   - ✅ Preview (선택, 권장)
   - ✅ Development (선택)

### 환경 변수 값 찾는 방법

#### OpenAI API Key
1. [OpenAI Platform](https://platform.openai.com/api-keys) 접속
2. "Create new secret key" 클릭
3. 생성된 키 복사

#### Google Gemini API Key
1. [Google AI Studio](https://aistudio.google.com/app/apikey) 접속
2. "Create API Key" 클릭
3. 생성된 키 복사

#### Supabase 설정
1. [Supabase Dashboard](https://supabase.com/dashboard) 접속
2. 프로젝트 선택
3. Settings > API 메뉴에서:
   - Project URL 복사 → `NEXT_PUBLIC_SUPABASE_URL`
   - Project API keys > anon public 복사 → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 5단계: 배포 실행

1. 환경 변수 설정이 완료되면 "Deploy" 버튼 클릭
2. Vercel이 자동으로:
   - 코드를 클론
   - 의존성 설치 (`pnpm install`)
   - 빌드 실행 (`next build`)
   - 배포 완료

3. 배포 진행 상황을 실시간으로 확인할 수 있습니다
4. 일반적으로 2-3분 소요

## 6단계: 배포 확인

배포가 완료되면:

1. Vercel이 제공하는 URL 확인 (예: `https://your-project.vercel.app`)
2. "Visit" 버튼을 클릭하거나 URL을 직접 브라우저에 입력
3. 웹사이트가 정상적으로 작동하는지 테스트:
   - 메인 페이지 접속
   - URL 입력 기능
   - 텍스트 생성 기능
   - 이미지 생성 기능
   - 결과 페이지

## 7단계: 도메인 설정 (선택사항)

Vercel 기본 도메인(`your-project.vercel.app`) 대신 커스텀 도메인을 사용하려면:

1. Vercel 프로젝트 대시보드 > Settings > Domains
2. 원하는 도메인 입력
3. DNS 설정 안내에 따라 도메인 제공업체에서 설정

## 재배포 (코드 업데이트)

코드를 수정하고 재배포하려면:

```bash
git add .
git commit -m "Update feature"
git push
```

GitHub에 push하면 Vercel이 자동으로:
- 변경사항 감지
- 자동 빌드 및 배포
- 새로운 프리뷰 URL 생성 (PR인 경우)
- 프로덕션 배포 (main 브랜치인 경우)

## 환경 변수 업데이트

배포 후 환경 변수를 변경하려면:

1. Vercel 대시보드 > 프로젝트 선택
2. Settings > Environment Variables
3. 변경하고자 하는 변수 수정 또는 추가
4. **중요**: 환경 변수 변경 후 Deployments 탭에서 "Redeploy" 클릭

## 로그 확인 및 디버깅

문제가 발생하면:

1. Vercel 대시보드 > Deployments
2. 실패한 배포 클릭
3. "Build Logs" 또는 "Function Logs" 확인
4. 에러 메시지를 바탕으로 문제 해결

### 일반적인 문제 해결

#### 빌드 실패
- 환경 변수가 올바르게 설정되었는지 확인
- `package.json`의 의존성이 최신인지 확인
- 로컬에서 `npm run build` 테스트

#### 런타임 에러
- Function Logs에서 에러 확인
- 환경 변수가 누락되지 않았는지 확인
- API 키가 유효한지 확인

#### Supabase 연결 실패
- `NEXT_PUBLIC_SUPABASE_URL`과 `NEXT_PUBLIC_SUPABASE_ANON_KEY`가 정확한지 확인
- Supabase 프로젝트가 활성 상태인지 확인
- `supabase-schema.sql`이 실행되었는지 확인

## 추가 리소스

- [Vercel 공식 문서](https://vercel.com/docs)
- [Next.js 배포 가이드](https://nextjs.org/docs/deployment)
- [Vercel 환경 변수 가이드](https://vercel.com/docs/concepts/projects/environment-variables)

## 지원

문제가 지속되면:
- Vercel 커뮤니티: https://github.com/vercel/vercel/discussions
- Next.js Discord: https://nextjs.org/discord

