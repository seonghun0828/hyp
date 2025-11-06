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

export const getImagePrompt = (summary: {
  core_value: string;
  target_customer: string;
  competitive_edge: string;
  customer_benefit: string;
  emotional_keyword?: string;
  feature_summary?: string;
  usage_scenario?: string;
}): string => {
  return `
Create a visually stunning, cinematic marketing image that captures the essence of this product.

Product Information:
- Core Value: ${summary.core_value}
- Customer Benefit: ${summary.customer_benefit}
- Target Customer: ${summary.target_customer}
- Competitive Edge: ${summary.competitive_edge}
${
  summary.emotional_keyword
    ? `- Emotional Keyword: ${summary.emotional_keyword}`
    : ''
}
${summary.feature_summary ? `- Key Features: ${summary.feature_summary}` : ''}
${summary.usage_scenario ? `- Usage Scenario: ${summary.usage_scenario}` : ''}

Generate a **single, vivid visual description** directly suitable for AI image generation.

Describe the image as if composing a professional campaign photo:
1. **Scene Composition:** The environment, angle, and layout — e.g., street fashion, minimal studio, or lifestyle background.  
2. **People or Objects:** Who or what is in the scene, their pose, emotion, and fashion style.  
3. **Lighting & Colors:** Direction, tone, and color palette that reinforce mood and brand style.  
4. **Atmosphere & Emotion:** The emotional impression (e.g., trendy, confident, energetic, luxurious).  
5. **Marketing Appeal:** Make it look like a premium social media or fashion campaign image — cinematic, stylish, refined.

Important:
- Do **not** include any text, logos, words, or letters of any kind in the image.  
- Focus purely on visual storytelling through people, environment, light, and color.  
- Output only the final detailed visual description, nothing else.`;
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
