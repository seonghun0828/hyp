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
  '이미지 업로드',
  '에디터',
  '결과',
] as const as string[];

/**
 * 전체 단계 수
 */
export const TOTAL_STEPS = STEP_NAMES.length;
