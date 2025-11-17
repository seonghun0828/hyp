import { Concept } from './store';
import { ProductCategory } from './categories/types';
import { getCategoryModules } from './categories/utils';
import {
  INDUSTRY_LABELS,
  FORM_LABELS,
  PURPOSE_LABELS,
} from './categories/templates';

/**
 * 제품 정보 요약을 위한 시스템 프롬프트
 */
export const getSummarySystemPrompt = (): string => {
  // templates.ts에서 정의된 카테고리 값들을 동적으로 가져오기
  const industryOptions = Object.values(INDUSTRY_LABELS).join(', ');
  const formOptions = Object.values(FORM_LABELS).join(', ');
  const purposeOptions = Object.values(PURPOSE_LABELS).join(', ');

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
  "usage_scenario": "사용 시나리오",
  "category": {
    "industry": "산업 분야 (What). Must be one of: ${industryOptions}",
    "form": "제품 형태 (How). Must be one of: ${formOptions}",
    "purpose": "제품 목적 (Why). Must be one of: ${purposeOptions}"
  }
}`;
};

/**
 * 제품 정보 요약을 위한 사용자 프롬프트
 */
export const getSummaryUserPrompt = (html: string): string => {
  return `Analyze this product information and extract the marketing summary elements:

${html.substring(0, 4000)}`;
};

export const getImagePrompt = (
  summary: {
    core_value: string;
    target_customer: string;
    competitive_edge: string;
    customer_benefit: string;
    emotional_keyword?: string;
    feature_summary?: string;
    usage_scenario?: string;
  },
  category?: ProductCategory
): string => {
  // Main Prompt (베이스)
  const mainPrompt = `
  Create a highly tailored, cinematic marketing image description **based primarily on the product’s assigned category modules**.
  
  Your output must integrate and prioritize all information from the following blocks:
  
  1. **Product Information Block (WHAT the product is)**
     - Core Value: ${summary.core_value}
     - Customer Benefit: ${summary.customer_benefit}
     - Target Customer: ${summary.target_customer}
     - Competitive Edge: ${summary.competitive_edge}
     ${
       summary.emotional_keyword
         ? `- Emotional Keyword: ${summary.emotional_keyword}`
         : ''
     }
     ${
       summary.feature_summary
         ? `- Key Features: ${summary.feature_summary}`
         : ''
     }
     ${
       summary.usage_scenario
         ? `- Usage Scenario: ${summary.usage_scenario}`
         : ''
     }
  
  2. **Category Modules Block (HOW it should visually appear)**
     - This includes:
       • Industry Category (대분류)
       • Form / Product Type (중분류)
       • Marketing Objective (소분류)
       • Style Option (Hero / Lifestyle / Detail)
     These modules determine the **visual tone, composition style, atmosphere, and marketing intention**.  
     **Category modules must override any default assumptions.**  
     If any instruction from the category modules conflicts with the Product Information Block, the **Category Modules take priority** in visual direction.
  
  ---
  
  ### OUTPUT REQUIREMENTS
  
  Generate a **single, vivid, highly specific visual description** suitable for AI image generation.
  
  Your description must contain:
  1. **Scene Composition**  
     - Environment, angle, layout, props, and context appropriate for the assigned category modules.
  
  2. **People or Objects**  
     - Who or what appears, their pose, expression, styling, or product placement.
  
  3. **Lighting & Colors**  
     - Use lighting and palette appropriate for the category modules (e.g., warm lifestyle, cool SaaS tech, high-contrast fitness, appetizing food tones).
  
  4. **Atmosphere & Emotion**  
     - The emotional tone should connect the product’s core value with the marketing objective.
  
  5. **Marketing Appeal**  
     - Make it look like a premium campaign asset, with mood, composition, and cues aligned to the INDUSTRY + FORM + GOAL module.
  
  ---
  
  ### STRICT RULES
  - Do **not** include any text, letters, logos, symbols, UI text, or readable characters.
  - Describe only the visuals — no meta commentary or explanation.
  - Only one final, contiguous visual description should be produced.
  - Always follow the Style Option (Hero / Lifestyle / Detail) as the final layer of direction.
  
  Begin the final description now.`;

  // 카테고리 모듈 조합
  if (category) {
    const categoryModules = getCategoryModules(category);
    if (categoryModules.trim() !== '') {
      return `${mainPrompt}\n\n${categoryModules}`;
    }
  }

  return mainPrompt;
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
export const getSuccessTextUserPrompt = (
  summary: {
    core_value?: string;
    customer_benefit?: string;
    feature_summary?: string;
    target_customer?: string;
    competitive_edge?: string;
  },
  category?: ProductCategory
): string => {
  const basePrompt = `Product: ${summary.core_value || '제품'}
Description: ${summary.customer_benefit || '제품 설명'}
Features: ${summary.feature_summary || '주요 기능'}
Target Users: ${summary.target_customer || '일반 사용자'}
Competitive Edge: ${summary.competitive_edge || '경쟁 우위'}`;

  // 카테고리 모듈 조합
  if (category) {
    const categoryModules = getCategoryModules(category);
    if (categoryModules.trim() !== '') {
      return `${basePrompt}\n\nCategory Context:\n${categoryModules}`;
    }
  }

  return basePrompt;
};
