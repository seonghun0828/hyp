import { Concept } from './store';

/**
 * 제품 정보 요약을 위한 시스템 프롬프트
 */
export const getSummarySystemPrompt = (): string => {
  return `You are a marketing copywriting assistant specialized in extracting structured product summaries.
You will receive product information (URL text).
Your task is to extract **7 key marketing summary elements** in Korean for generating promotional content later.

Follow these rules:
- Always output in JSON format (UTF-8).
- Each field must contain a concise, natural-sounding Korean sentence (under 40 words).
- If data is missing, leave the field empty (empty string "").
- Fill them only if sufficient info exists.
- Focus on how customers perceive value, not just product specs.

Required JSON structure:
{
  "title": "제품명",
  "core_value": "핵심 가치",
  "target_customer": "주요 고객층",
  "competitive_edge": "경쟁 우위",
  "customer_benefit": "고객 혜택",
  "emotional_keyword": "감정 키워드",
  "feature_summary": "주요 기능",
  "usage_scenario": "사용 시나리오"
}`;
};

/**
 * 제품 정보 요약을 위한 사용자 프롬프트
 */
export const getSummaryUserPrompt = (html: string): string => {
  return `Analyze this product information and extract the marketing summary elements:

${html.substring(0, 4000)}`;
};

/**
 * 이미지 생성을 위한 프롬프트 (Gemini)
 */
/**
 * 단일 요청으로 고품질 이미지 생성 프롬프트 생성 (Gemini 등 이미지 생성 모델용)
 */
export const getImagePrompt = (summary: {
  core_value?: string;
  customer_benefit?: string;
  target_customer?: string;
  emotional_keyword?: string;
  competitive_edge?: string;
}): string => {
  return `
Create a visually stunning and emotionally engaging marketing image.

Product Information:
- Core Value: ${summary.core_value || '최신 트렌드 패션 제공'}
- Customer Benefit: ${
    summary.customer_benefit || '사용자가 손쉽게 트렌디한 스타일을 탐색 가능'
  }
- Target Audience: ${summary.target_customer || '20~30대 글로벌 패션 소비자'}
- Emotional Keyword: ${
    summary.emotional_keyword || '트렌디함, 자신감, 스타일리시함'
  }
- Competitive Edge: ${
    summary.competitive_edge || 'K-패션의 감성과 큐레이션 기술 결합'
  }

Now, generate a **single, detailed visual description** suitable for AI image generation that:
- Describes the scene, people, fashion, setting, lighting, mood, and colors in vivid detail
- Reflects the emotional keyword visually (e.g. confident, stylish, trendy)
- Matches the target audience and the brand’s identity
- Evokes the feeling of a high-end fashion campaign or SNS marketing image
- Is cinematic, refined, and modern in composition
- Includes no words, letters, logos, or written elements of any kind

Output only the detailed visual description text — nothing else.`;
};

/**
 * SUCCESs 원칙 기반 홍보문구 생성을 위한 시스템 프롬프트
 */
export const getSuccessTextSystemPrompt = (
  principle: string,
  conceptData: Concept
): string => {
  return `Generate a marketing copy based on SUCCESs principle "${principle}" in Korean.
The copy should be 2-3 lines like this example:
"${conceptData.example}"

Principle: ${principle}
- Simple: Clear and concise message
- Unexpected: Surprising or counterintuitive
- Concrete: Specific and tangible
- Credible: Trustworthy with proof
- Emotional: Appeals to feelings
- Story: Narrative-driven

Style: ${conceptData.name} - ${conceptData.description}

Return only the text content, no JSON format.`;
};

/**
 * SUCCESs 원칙 기반 홍보문구 생성을 위한 사용자 프롬프트
 */
export const getSuccessTextUserPrompt = (summary: {
  core_value?: string;
  customer_benefit?: string;
  feature_summary?: string;
  target_customer?: string;
  competitive_edge?: string;
}): string => {
  return `Product: ${summary.core_value || '제품'}
Description: ${summary.customer_benefit || '제품 설명'}
Features: ${summary.feature_summary || '주요 기능'}
Target Users: ${summary.target_customer || '일반 사용자'}
Competitive Edge: ${summary.competitive_edge || '경쟁 우위'}`;
};
