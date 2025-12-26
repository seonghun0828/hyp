import { ProductCategory } from '../categories/types';

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

