/**
 * 퍼널 단계 이름 정의
 * 모든 페이지에서 공통으로 사용하는 단계 이름 배열
 */
export const STEP_NAMES = [
  '링크 입력',
  '제품 요약',
  '메시지 타입',
  '표현 방식',
  '톤 & 무드',
  '모델 구성',
  '비율 선택',
  '이미지 업로드',
  '에디터',
  '결과',
] as const as string[];

/**
 * 전체 단계 수
 */
export const TOTAL_STEPS = STEP_NAMES.length;

/**
 * 생성할 최대 이미지 개수
 */
export const MAX_IMAGES = 3;

/**
 * AI 기능별 비용 정의
 */
export const AI_COSTS = {
  SUMMARY: 0, // 링크 분석
  IMAGE_GENERATION: 200, // 이미지 3장 생성 (에디터 진입 시)
  PROMOTION_TEXT: 0, // 홍보 문구 생성
  ADDITIONAL_IMAGE: 100, // 추가 이미지 2장 생성
  CUSTOM_PROMPT_IMAGE: 50, // 커스텀 프롬프트로 이미지 수정
} as const;

/**
 * 초기 제공 크레딧 정의
 */
export const INITIAL_CREDITS = {
  ANON: 300, // 비로그인 유저
  MEMBER: 500, // 로그인 유저
} as const;

export const PRICING_TIERS = [
  { id: 'starter', credits: 2000, price: 5, popular: false },
  { id: 'popular', credits: 4200, price: 10, popular: true },
  { id: 'best', credits: 22000, price: 50, popular: false },
] as const;
