import {
  INDUSTRY_KEYS,
  FORM_KEYS,
  PURPOSE_KEYS,
} from '../categories/templates';

/**
 * 제품 정보 요약을 위한 시스템 프롬프트 (언어별)
 */
export const getSummarySystemPrompt = (locale: string = 'ko'): string => {
  const isKorean = locale === 'ko';
  
  const industryOptions = INDUSTRY_KEYS.join(', ');
  const formOptions = FORM_KEYS.join(', ');
  const purposeOptions = PURPOSE_KEYS.join(', ');

  if (isKorean) {
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
    "industry": "Must be one of: ${industryOptions}",
    "form": "Must be one of: ${formOptions}",
    "purpose": "Must be one of: ${purposeOptions}"
  }
}`;
  } else {
    return `You are a marketing copywriting assistant specialized in extracting structured product summaries.
You will receive extracted and preprocessed product information (text content from web pages).
Your task is to extract **7 key marketing summary elements** in English for generating promotional content later.

Follow these rules:
- Always output in JSON format (UTF-8).
- Each field must contain a concise, natural-sounding English sentence (under 40 words).
- If data is missing, leave the field empty (empty string "").
- Fill them only if sufficient information exists.
- Focus on how customers perceive value, not just product specs.

Required JSON structure:
{
  "title": "Product Name",
  "core_value": "Core Value",
  "target_customer": "Target Customer",
  "competitive_edge": "Competitive Edge",
  "customer_benefit": "Customer Benefit",
  "emotional_keyword": "Emotional Keyword",
  "feature_summary": "Feature Summary",
  "usage_scenario": "Usage Scenario",
  "category": {
    "industry": "Must be one of: ${industryOptions}",
    "form": "Must be one of: ${formOptions}",
    "purpose": "Must be one of: ${purposeOptions}"
  }
}`;
  }
};

/**
 * 제품 정보 요약을 위한 사용자 프롬프트 (언어별)
 */
export const getSummaryUserPrompt = (preprocessedText: string, locale: string = 'ko'): string => {
  const isKorean = locale === 'ko';
  
  if (isKorean) {
    return `
Analyze the following extracted product information and extract a structured marketing summary in JSON format.
Focus on the most relevant details for promotional content generation.

Important:
- Extract the **7 key marketing summary elements** in Korean.
- Each field must be a concise, natural-sounding Korean sentence (max 40 words per field).
- If information is missing, leave the field as an empty string "".
- Prioritize how customers perceive value over technical specifications.
- Ensure no field is skipped if sufficient info exists in the provided text.

Extracted Product Information:
${preprocessedText}
`;
  } else {
    return `
Analyze the following extracted product information and extract a structured marketing summary in JSON format.
Focus on the most relevant details for promotional content generation.

Important:
- Extract the **7 key marketing summary elements** in English.
- Each field must be a concise, natural-sounding English sentence (max 40 words per field).
- If information is missing, leave the field as an empty string "".
- Prioritize how customers perceive value over technical specifications.
- Ensure no field is skipped if sufficient info exists in the provided text.

Extracted Product Information:
${preprocessedText}
`;
  }
};
