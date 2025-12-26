import {
  INDUSTRY_LABELS,
  FORM_LABELS,
  PURPOSE_LABELS,
} from '../categories/templates';

/**
 * 제품 정보 요약을 위한 시스템 프롬프트
 */
export const getSummarySystemPrompt = (): string => {
  const industryOptions = Object.values(INDUSTRY_LABELS).join(', ');
  const formOptions = Object.values(FORM_LABELS).join(', ');
  const purposeOptions = Object.values(PURPOSE_LABELS).join(', ');

  return `You are a marketing copywriting assistant specialized in extracting structured product summaries.
You will receive extracted and preprocessed product information (text content from web pages).
Your task is to extract **7 key marketing summary elements** in Korean for generating promotional content later.

Follow these rules:
- Always output in JSON format (UTF-8).
- Each field must contain a concise, natural-sounding Korean sentence (under 40 words).
- If data is missing, leave the field empty (empty string "").
- Fill them only if sufficient information exists.
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
export const getSummaryUserPrompt = (preprocessedText: string): string => {
  return `
Analyze the following extracted product information and extract a structured marketing summary in JSON format.
Focus on the most relevant details for promotional content generation.

Important:
- Extract the **7 key marketing summary elements**.
- Each field must be a concise, natural-sounding Korean sentence (max 40 words per field).
- If information is missing, leave the field as an empty string "".
- Prioritize how customers perceive value over technical specifications.
- Ensure no field is skipped if sufficient info exists in the provided text.

Extracted Product Information:
${preprocessedText}
`;
};

