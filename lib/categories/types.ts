/**
 * 제품 카테고리 타입 정의
 * 대중소 분류: industry(산업) / form(형태) / purpose(목적)
 */
export interface ProductCategory {
  industry: string; // 대분류: 산업 (What) - 예) 패션, 푸드, 전자제품
  form: string; // 중분류: 형태 (How) - 예) 실물 상품, 앱, 웹사이트
  purpose: string; // 소분류: 목적 (Why) - 예) 정보 전달, 구매 전환, 리드 수집
}
