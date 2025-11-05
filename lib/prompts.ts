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
export const getImagePrompt = (
  summary: {
    core_value?: string;
    customer_benefit?: string;
    target_customer?: string;
    emotional_keyword?: string;
    competitive_edge?: string;
  },
  concept: {
    imageStyle: {
      promptTemplate: string;
    };
  }
): string => {
  return `Create a compelling marketing image for: ${
    summary.core_value || '제품'
  }

Product essence: ${summary.customer_benefit || '제품 설명'}
Target audience: ${summary.target_customer || '일반 사용자'}
Emotional appeal: ${summary.emotional_keyword || '긍정적'}
Unique advantage: ${summary.competitive_edge || '차별화 포인트'}

Image Style: ${concept.imageStyle.promptTemplate}

CRITICAL: ABSOLUTELY NO TEXT, WORDS, LETTERS, OR WRITTEN CONTENT OF ANY KIND IN THE IMAGE. This includes product names, titles, labels, or any readable text. Create a purely visual image using only colors, shapes, objects, and composition.`;
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

/**
 * 이미지 생성 프롬프트 생성을 위한 시스템 프롬프트
 */
export const getImagePromptSystemPrompt = (): string => {
  return `You are a marketing image prompt generator. Your task is to create a detailed, compelling image generation prompt for a marketing image based on product information.

Generate a comprehensive image generation prompt that:
- Describes the visual elements, composition, mood, and atmosphere
- Includes specific details about colors, lighting, and style
- Is suitable for AI image generation models
- Creates a compelling marketing image that represents the product

Return only the image generation prompt text, no additional explanations or formatting.`;
};

/**
 * 이미지 생성 프롬프트 생성을 위한 사용자 프롬프트
 */
export const getImagePromptUserPrompt = (summary: {
  core_value?: string;
  emotional_keyword?: string;
  usage_scenario?: string;
}): string => {
  return `Create an image generation prompt for a marketing image based on this product information:

Core Value: ${summary.core_value || '제품'}
Emotional Keyword: ${summary.emotional_keyword || '긍정적'}
Usage Scenario: ${summary.usage_scenario || '사용 시나리오'}

Generate a detailed, visual description that captures the essence of this product for marketing purposes.`;
};
