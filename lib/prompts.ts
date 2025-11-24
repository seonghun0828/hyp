import { Styles } from './store';
import {
  expressionStyles,
  getStyleLabel,
  getStyleOptionById,
  messageTypes,
  modelCompositions,
  toneMoods,
} from './styles';
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
export const getSummaryUserPrompt = (html: string): string => {
  // 1. HTML 길이 제한 보완: 긴 HTML은 핵심 텍스트 추출 후 앞뒤 균형 있게 전달
  const maxChars = 8000; // AI 모델이 처리 가능한 안전 범위
  let processedHtml = html;

  if (html.length > maxChars) {
    const half = Math.floor(maxChars / 2);
    processedHtml =
      html.substring(0, half) + '\n...\n' + html.substring(html.length - half);
  }

  // 2. 사용자 프롬프트
  return `
Analyze the following product information and extract a structured marketing summary in JSON format.
Focus on the most relevant details for promotional content generation.

Important:
- Extract the **7 key marketing summary elements**.
- Each field must be a concise, natural-sounding Korean sentence (max 40 words per field).
- If information is missing, leave the field as an empty string "".
- Prioritize how customers perceive value over technical specifications.
- Ensure no field is skipped if sufficient info exists in the HTML.

Product Information:
${processedHtml}
`;
};

export const getImagePrompt = (
  styles: Styles,
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
  return `[Core Concept Summary]
${summary.core_value}

[Product Context]
This product/service falls under the category of ${
    category?.industry
  }, with the product type of ${category?.form}.  
The advertising purpose is: ${category?.purpose}.

[Style Package]
Apply the following style package as a single unified direction:
– Message Type: ${messageTypes.find((m) => m.id === styles.messageType)!.label}
– Expression Style: ${
    expressionStyles.find((e) => e.id === styles.expressionStyle)!.label
  }
– Tone & Mood: ${toneMoods.find((t) => t.id === styles.toneMood)!.label}
– Model Composition: ${
    modelCompositions.find((m) => m.id === styles.modelComposition)!.label
  }

[Output Requirements]
Generate one high-quality SNS advertisement image.  
The image must contain **no text**, including on UI screens, devices, props, or backgrounds.  
Use a realistic, clear, visually appealing composition that reflects the advertising purpose.  
Avoid distortions, avoid artifacts, and maintain natural lighting.  
Aspect ratio should remain consistent with previous outputs.  
Focus solely on visually conveying the product’s core value and purpose through the selected style package.
`;
};

/**
 * SUCCESs 원칙 기반 홍보문구 생성을 위한 시스템 프롬프트
 */
export const getSuccessTextSystemPrompt = (
  principle: string,
  styles?: Styles
): string => {
  let styleDescription = '';
  if (styles) {
    const styleParts: string[] = [];

    if (styles.messageType) {
      const label = getStyleLabel('messages', styles.messageType);
      styleParts.push(`Message Type: ${label}`);
    }

    if (styles.expressionStyle) {
      const label = getStyleLabel('expressions', styles.expressionStyle);
      styleParts.push(`Expression: ${label}`);
    }

    if (styles.toneMood) {
      const label = getStyleLabel('tones-moods', styles.toneMood);
      styleParts.push(`Tone & Mood: ${label}`);
    }

    if (styles.modelComposition) {
      const label = getStyleLabel('models', styles.modelComposition);
      styleParts.push(`Model: ${label}`);
    }

    if (styleParts.length > 0) {
      styleDescription = `\n\nStyle Preferences:\n${styleParts.join('\n')}`;
    }
  }

  return `Generate a marketing copy based on SUCCESs principle "${principle}" in Korean.
The copy should be 2-3 lines.

Principle: ${principle}
- Simple: Clear and concise message
- Unexpected: Surprising or counterintuitive
- Concrete: Specific and tangible
- Credible: Trustworthy with proof
- Emotional: Appeals to feelings
- Story: Narrative-driven${styleDescription}

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
  category?: ProductCategory,
  styles?: Styles
): string => {
  let basePrompt = `Product: ${summary.core_value || '제품'}
Description: ${summary.customer_benefit || '제품 설명'}
Features: ${summary.feature_summary || '주요 기능'}
Target Users: ${summary.target_customer || '일반 사용자'}
Competitive Edge: ${summary.competitive_edge || '경쟁 우위'}`;

  // 스타일 정보 추가
  if (styles) {
    const styleParts: string[] = [];

    if (styles.messageType) {
      const option = getStyleOptionById('messages', styles.messageType);
      if (option) {
        styleParts.push(`${option.label}: ${option.description}`);
      }
    }

    if (styles.expressionStyle) {
      const option = getStyleOptionById('expressions', styles.expressionStyle);
      if (option) {
        styleParts.push(`${option.label}: ${option.description}`);
      }
    }

    if (styles.toneMood) {
      const option = getStyleOptionById('tones-moods', styles.toneMood);
      if (option) {
        styleParts.push(`${option.label}: ${option.description}`);
      }
    }

    if (styles.modelComposition) {
      const option = getStyleOptionById('models', styles.modelComposition);
      if (option) {
        styleParts.push(`${option.label}: ${option.description}`);
      }
    }

    if (styleParts.length > 0) {
      basePrompt += `\n\nStyle Context:\n${styleParts.join('\n')}`;
    }
  }

  // 카테고리 모듈 조합
  if (category) {
    const categoryModules = getCategoryModules(category);
    if (categoryModules.trim() !== '') {
      basePrompt += `\n\nCategory Context:\n${categoryModules}`;
    }
  }

  return basePrompt;
};
