import { Styles } from '../store';
import { visualStyles, messageTypes, toneMoods, models } from '../styles';
import { ProductCategory } from '../categories/types';

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
      models.find((m) => m.id === 'product-ui-only')?.aiPrompt ||
      'Show only the product or service interface. No people, no characters, no hands.',
    'hands-only':
      models.find((m) => m.id === 'hands-only')?.aiPrompt ||
      'Show hands interacting with the product. Do not show faces or full bodies.',
    person:
      models.find((m) => m.id === 'person')?.aiPrompt ||
      'Include a human person interacting with the product or service.',
    'character-mascot':
      models.find((m) => m.id === 'character-mascot')?.aiPrompt ||
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
