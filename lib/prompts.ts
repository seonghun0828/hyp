import { Styles } from './store';
import { visualStyles, messageTypes, toneMoods } from './styles';
import { ProductCategory } from './categories/types';
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

/**
 * Context(Category)에 따라 Model Prompt를 동적으로 생성하는 함수
 */
const getDynamicModelPrompt = (
  modelId: string,
  categoryForm?: string,
  categoryIndustry?: string
): string => {
  // 기본값 (styles.ts에 정의된 값 사용을 위한 fallback)
  const basePrompts: Record<string, string> = {
    'product-ui-only':
      'Show only the product or service interface. No people, no characters, no hands.',
    'hands-only':
      'Show hands interacting with the product. Do not show faces or full bodies.',
    person: 'Include a human person interacting with the product or service.',
    'character-mascot':
      'Include a character or mascot instead of a real human.',
  };

  const defaultPrompt = basePrompts[modelId] || '';

  if (!categoryForm) return defaultPrompt;

  switch (modelId) {
    case 'product-ui-only':
      if (['app', 'web_service', 'digital_product'].includes(categoryForm)) {
        return 'High-quality digital interface mockup. A sleek, bezel-less modern device (smartphone or laptop) displaying the screen clearly. Glowing UI elements, clean digital aesthetic. No hands, no people. Focus entirely on the digital content.';
      }
      if (categoryForm === 'physical_product') {
        return 'Professional product photography. Studio lighting, sharp focus on the product texture and details. Minimalist background to highlight the object. No people.';
      }
      if (
        categoryForm === 'offline_service' ||
        categoryIndustry === 'travel_leisure'
      ) {
        return 'Atmospheric interior or location shot. Focus on the space, architecture, and ambiance. Empty of people to emphasize the setting itself.';
      }
      return 'High-quality product shot or interface display, focusing solely on the object. No people.';

    case 'hands-only':
      if (['app', 'web_service', 'digital_product'].includes(categoryForm)) {
        return 'POV shot. Hands holding a smartphone or typing on a keyboard. Screen visible and in focus. Technology-focused context. Clean, modern manicure or natural hands.';
      }
      if (categoryForm === 'physical_product') {
        return 'Close-up of hands holding or touching the product. Emphasizing tactile experience and material quality. Natural lighting. Hands are interacting naturally with the object.';
      }
      return 'Close-up of hands interacting with the subject. No faces visible. Focus on the action of using.';

    case 'person':
      if (categoryIndustry === 'fashion_beauty') {
        return 'A natural lifestyle portrait. A person using or wearing the product in a daily setting. Soft lighting, authentic expression. Beauty-focused but natural, not an exaggerated runway look.';
      }
      if (['app', 'web_service', 'digital_product'].includes(categoryForm)) {
        return 'Lifestyle shot of a user engaging with a device. Happy, focused expression while looking at the screen. Modern environment. The person is clearly enjoying the digital experience.';
      }
      if (
        [
          'business_productivity',
          'finance_real_estate_law',
          'education_self_development',
        ].includes(categoryIndustry || '')
      ) {
        return 'Professional setting. A person working, consulting, or studying in a modern environment. Smart casual or business attire. Trustworthy and confident look.';
      }
      return 'A natural lifestyle scene featuring a person using the product/service. Authentic emotions and context. The person is the protagonist of the scene.';

    case 'character-mascot':
      return 'A stylized character or mascot representing the brand. Expressive poses, engaging directly with the viewer or the product element. The character should embody the brand personality.';

    default:
      return defaultPrompt;
  }
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
  // 동적 Model Prompt 생성
  const modelPrompt = getDynamicModelPrompt(
    styles.model,
    category?.form,
    category?.industry
  );

  return `[Core Concept Summary]
${summary.core_value}

[Product Context]
This product/service falls under the category of ${
    category?.industry
  }, with the product type of ${category?.form}.  
The advertising purpose is: ${category?.purpose}.

[Style Package]
Apply the following style package as a single unified direction:
– Message Type: ${
    messageTypes.find((m) => m.id === styles.messageType)!.aiPrompt
  }
– Visual Style: ${
    visualStyles.find((e) => e.id === styles.visualStyle)!.aiPrompt
  }
– Tone & Mood: ${toneMoods.find((t) => t.id === styles.toneMood)!.aiPrompt}
– Model Composition: ${modelPrompt}

[Output Requirements]
Generate one high-quality SNS advertisement image.  
The image must contain **no text**, including on UI screens, devices, props, or backgrounds.  
Use a realistic, clear, visually appealing composition that reflects the advertising purpose.  
Avoid distortions, avoid artifacts, and maintain natural lighting.  
Focus solely on visually conveying the product’s core value and purpose through the selected style package.
`;
};

/**
 * SUCCESs 원칙 기반 홍보문구 생성을 위한 시스템 프롬프트
 */
export const getSuccessTextSystemPrompt = (principle: string): string => {
  return `
You are a senior marketing copywriter at HYP. 
Your job is to create extremely concise, high-conversion Korean promotional copy (2–3 lines) for solo founders and side-project makers.

Your writing must strictly follow the SUCCESs framework.  
Focus on applying the selected SUCCESs principle as the dominant structure of the copy.

Target SUCCESs Principle: "${principle}"

SUCCESs Structure Templates (use the template matching the selected principle):
- Simple: Line1 = core benefit. Line2 = clarifying hook.
- Unexpected: Line1 = surprise/pattern-break. Line2 = value proposition.
- Concrete: Line1 = concrete scene. Line2 = precise action or number.
- Credible: Line1 = claim. Line2 = proof/narrow detail.
- Emotional: Line1 = emotion trigger. Line2 = comforting/aspirational payoff.
- Story: Line1 = situation. Line2 = turning action. Line3 = result.

STRICT Output Rules:
1. Length:  
   - 2–3 lines total  
   - Each line must be short, punchy, scannable  
   2. Language:  
   - Korean only 
   - Ensure every line reads naturally in conversational Korean.  
3. Punctuation:  
   - Use only necessary Korean punctuation (. , ? !)  
   - DO NOT use long dashes, special separators, or Western-style symbols  
4. Output Format:  
   - ONLY the final 2–3 line marketing copy  
   - No explanations, no lists, no markdown, no JSON
`.trim();
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
  let prompt = `
--- ESSENTIAL CORE MESSAGE ---
[PAIN POINT SOLVED]: ${summary.customer_benefit || '고객 문제와 해결 혜택'}
[CORE VALUE]: ${summary.core_value || '제품의 핵심 가치'}
[DIFFERENTIATOR]: ${summary.competitive_edge || '경쟁 제품 대비 차별점'}
`;

  prompt += `\n--- REFERENCE DATA ---\n`;
  prompt += `Target Audience: ${summary.target_customer || '일반 사용자'}\n`;

  if (summary.feature_summary) {
    prompt += `Key Features (optional): ${summary.feature_summary}\n`;
  }

  if (category) {
    prompt += `Industry: ${category.industry}\n`;
    prompt += `Product Form: ${category.form}\n`;
    prompt += `Purpose: ${category.purpose}\n`;
  }

  return prompt.trim();
};
