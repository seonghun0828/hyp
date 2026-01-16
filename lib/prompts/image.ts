import { Styles } from '../store';
import { visualStyles, messageTypes, models } from '../styles';
import { ProductCategory } from '../categories/types';

/**
 * 배열에서 옵션을 선택하는 헬퍼 함수
 * index가 제공되면 해당 인덱스(modulo)의 아이템을 반환 (순차 선택)
 * randomSeed와 stride(7)를 적용하여 다양성 확보
 */
const selectOption = (
  options: string[],
  index?: number,
  randomSeed?: number
) => {
  if (typeof index === 'number') {
    // seed가 없으면 0
    const start = randomSeed || 0;
    // stride는 적당히 큰 소수 (예: 7) 사용
    // 배열 길이보다 크거나 서로소이면 좋음. 7 정도면 대부분의 짧은 배열에서 잘 섞임
    const stride = 7;

    const finalIndex = (start + index * stride) % options.length;
    return options[finalIndex];
  }
  return options[Math.floor(Math.random() * options.length)];
};

/**
 * Context(Category)에 따라 Model Prompt를 동적으로 생성하는 함수
 */
const getDynamicModelPrompt = (
  modelId: string,
  visualId: string,
  categoryForm?: string,
  categoryIndustry?: string,
  variationIndex?: number,
  randomSeed?: number
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

  // Visual Style에 따라 "Photography" 같은 용어를 중화시킴
  const isNonPhotorealistic = [
    'cartoon',
    'illustration',
    'line-drawing',
  ].includes(visualId);
  const shotTerm = isNonPhotorealistic ? 'depiction' : 'shot';
  const photoTerm = isNonPhotorealistic ? 'illustration' : 'photography';

  if (!categoryForm) return defaultPrompt;

  switch (modelId) {
    case 'product-ui-only':
      if (['app', 'web_service', 'digital_product'].includes(categoryForm)) {
        return `High-quality digital interface mockup. A sleek, bezel-less modern device (smartphone or laptop) displaying the screen clearly. Glowing UI elements, clean digital aesthetic. No hands, no people. Focus entirely on the digital content.`;
      }
      if (categoryForm === 'physical_product') {
        return `Professional product ${photoTerm}. Studio lighting, sharp focus on the product texture and details. Minimalist background to highlight the object. No people.`;
      }
      if (
        categoryForm === 'offline_service' ||
        categoryIndustry === 'travel_leisure'
      ) {
        return `Atmospheric interior or location ${shotTerm}. Focus on the space, architecture, and ambiance. Empty of people to emphasize the setting itself.`;
      }
      return `High-quality product ${shotTerm} or interface display, focusing solely on the object. No people.`;

    case 'hands-only':
      if (['app', 'web_service', 'digital_product'].includes(categoryForm)) {
        return `POV ${shotTerm}. Hands holding a smartphone or typing on a keyboard. Screen visible and in focus only when the front face of the device is facing the viewer. If the device back is visible, show only the back cover without any screen content. Technology-focused context. Clean, modern manicure or natural hands.`;
      }
      if (categoryForm === 'physical_product') {
        return `Close-up of hands holding or touching the product. Emphasizing tactile experience and material quality. Natural lighting. Hands are interacting naturally with the object.`;
      }
      return `Close-up of hands interacting with the subject. No faces visible. Focus on the action of using.`;

    case 'person':
      if (categoryIndustry === 'fashion_beauty') {
        return `A natural lifestyle portrait. A person using or wearing the product in a daily setting. Soft lighting, authentic expression. Beauty-focused but natural, not an exaggerated runway look.`;
      }
      if (['app', 'web_service', 'digital_product'].includes(categoryForm)) {
        return `Lifestyle ${shotTerm} of a user engaging with a device. Happy, focused expression while looking at the screen. Show screen content only when the device front face is visible to the viewer. If the device back is visible, show only the back cover without screen content. Modern environment. The person is clearly enjoying the digital experience.`;
      }
      if (
        [
          'business_productivity',
          'finance_real_estate_law',
          'education_self_development',
        ].includes(categoryIndustry || '')
      ) {
        return `Professional setting. A person working, consulting, or studying in a modern environment. Smart casual or business attire. Trustworthy and confident look.`;
      }
      return `A natural lifestyle scene featuring a person using the product/service. Authentic emotions and context. The person is the protagonist of the scene.`;

    case 'character-mascot':
      const mascotVariations = [
        // 로봇/기계형 캐릭터
        'A friendly robot character with expressive eyes and rounded, approachable design. Modern tech aesthetic with clean lines and friendly personality. Expressive poses, engaging directly with the viewer or the product element.',
        'A mechanical mascot with anthropomorphic features. Tech-inspired design with human-like expressions and gestures. The character should embody the brand personality.',

        // 동물 캐릭터 (다양한 동물)
        'A cute bear mascot with friendly expression and approachable pose. Soft, rounded design with warm personality. Expressive poses, engaging directly with the viewer or the product element.',
        'A playful cat character with expressive eyes and dynamic pose. Friendly and energetic design. The character should embody the brand personality.',
        'A cheerful dog mascot with happy expression. Approachable and trustworthy appearance. Expressive poses, engaging directly with the viewer or the product element.',
        'A wise owl character with intelligent expression. Professional yet friendly design. The character should embody the brand personality.',
        'A friendly rabbit mascot with energetic pose. Playful and approachable design. Expressive poses, engaging directly with the viewer or the product element.',
        'A cute penguin character with charming expression. Friendly and memorable design. The character should embody the brand personality.',

        // 추상/인간형 캐릭터
        'An abstract geometric character with simple shapes and expressive features. Modern, minimalist design with personality. Expressive poses, engaging directly with the viewer or the product element.',
        'A stylized humanoid character with exaggerated features and expressive poses. Friendly and approachable design. The character should embody the brand personality.',
      ];
      return selectOption(mascotVariations, variationIndex, randomSeed);

    default:
      return defaultPrompt;
  }
};

/**
 * Context(Category)와 Randomness에 따라 Visual Style Prompt를 동적으로 생성하는 함수
 */
const getDynamicVisualPrompt = (
  visualId: string,
  categoryIndustry?: string,
  variationIndex?: number,
  randomSeed?: number
): string => {
  // 기본값 (styles.ts에 정의된 값 사용을 위한 fallback)
  const basePrompts: Record<string, string> = {
    'photo-realistic':
      visualStyles.find((v) => v.id === 'photo-realistic')?.aiPrompt || '',
    'line-drawing':
      visualStyles.find((v) => v.id === 'line-drawing')?.aiPrompt || '',
    cartoon: visualStyles.find((v) => v.id === 'cartoon')?.aiPrompt || '',
    illustration:
      visualStyles.find((v) => v.id === 'illustration')?.aiPrompt || '',
  };

  const defaultPrompt = basePrompts[visualId] || '';

  switch (visualId) {
    case 'cartoon':
      const cartoonVariations = [
        // 3D Styles
        '3D Pixar/Disney-style animation. Soft lighting, rounded shapes, expressive characters, subsurface scattering, warm and charming atmosphere.',
        'Claymation Style (Aardman style). Stop-motion aesthetic, visible fingerprints, plasticine texture, quirky and handmade feel.',
        'Low Poly 3D Art. Geometric shapes, faceted surfaces, vibrant flat colors, modern digital art style.',
        'Stylized PBR 3D (Overwatch/Fortnite style). Hand-painted textures, bold silhouette, dynamic lighting, vibrant color palette.',

        // 2D Styles
        'Studio Ghibli Style. Hand-painted watercolor backgrounds, detailed nature, soft character lines, nostalgic and emotional atmosphere.',
        'Classic Japanese Anime (90s style). Cel-shading, distinct highlights, dramatic angles, vibrant colors.',
        'American Retro Cartoon (Rubber hose style). 1930s vintage animation, black and white or muted colors, rhythmic and bouncy character design.',
        'Modern Webtoon Style. Clean digital lines, trendy fashion, bright and saturated colors, polished finish.',
        'French Bandes Dessinées (Moebius style). Intricate ink lines, flat pastel colors.',
        'Modern Flat Cartoon. Vector-like clean shapes, bold solid colors, minimalist character design, corporate illustration style.',
      ];
      return selectOption(cartoonVariations, variationIndex, randomSeed);

    case 'illustration':
      // IT/SaaS 산업군은 테크니컬한 일러스트 선호
      if (
        ['electronics_it', 'business_productivity', 'web_service'].includes(
          categoryIndustry || ''
        )
      ) {
        const techVariations = [
          '3D Isometric Illustration. Clean geometric shapes, soft gradient lighting, floating elements, modern tech aesthetic.', // Isometric
          'Minimalist Abstract Tech Art. Fluid shapes, glowing data lines, deep blue and purple palette, futuristic feel.', // Abstract Tech
        ];
        return selectOption(techVariations, variationIndex, randomSeed);
      }
      // 그 외 일반적인 경우
      const illustrationVariations = [
        'Soft Watercolor Painting. Wet-on-wet textures, pastel colors, artistic brush strokes, dreamy atmosphere.', // Watercolor
        'Oil Painting Impasto. Visible thick brush strokes, rich texture, vibrant color blending, fine art aesthetic.', // Oil
        'Modern Vector Art. Clean curves, flat design, vibrant gradients, stylized composition.', // Vector
        'Hand-drawn Pencil Sketch with Color. Rough pencil textures, colored pencil shading, organic and warm feel.', // Colored Pencil
      ];
      return selectOption(illustrationVariations, variationIndex, randomSeed);

    case 'photo-realistic':
      if (
        ['food_beverage', 'fashion_beauty'].includes(categoryIndustry || '')
      ) {
        return 'Macro Photography. Extreme close-up, shallow depth of field (bokeh), sharp focus on textures and details. High-end commercial look.';
      }
      if (
        ['travel_leisure', 'automotive_mobility'].includes(
          categoryIndustry || ''
        )
      ) {
        return 'Cinematic Wide Angle. Dynamic composition, dramatic lighting, capturing the scale of the environment. High production value movie still.';
      }
      return 'High-End Commercial Photography. Perfect studio lighting, 8k resolution, ultra-realistic textures, balanced composition.';

    case 'line-drawing':
      if (
        ['electronics_it', 'automotive_mobility', 'construction'].includes(
          categoryIndustry || ''
        )
      ) {
        // 블루프린트는 파란색이라 제외하고, 기술적인 흑백 도면 스타일로 변경
        return 'Technical Schematic Style. Precision black lines on white background, exploded view or wireframe aesthetics, no colors, clean and technical.';
      }
      const lineVariations = [
        'Minimalist Continuous Line Art. Single fluid black line on pure white background, abstract and elegant, no shading.',
        'Simple Hand-drawn Doodle. Loose black ink sketch on white paper, playful and minimal, no fill colors.',
        'Clean Vector Line Art. Uniform black stroke weight, white background, iconographic style, no gradients or colors.',
      ];
      return selectOption(lineVariations, variationIndex, randomSeed);

    default:
      return defaultPrompt;
  }
};

/**
 * Randomness에 따라 Message Type Prompt를 동적으로 생성하는 함수
 */
const getDynamicMessagePrompt = (
  messageId: string,
  modelId: string,
  variationIndex?: number,
  randomSeed?: number
): string => {
  // 기본값 fallback
  const basePrompts: Record<string, string> = {
    'problem-solving':
      messageTypes.find((m) => m.id === 'problem-solving')?.aiPrompt || '',
    benefit: messageTypes.find((m) => m.id === 'benefit')?.aiPrompt || '',
    comparison: messageTypes.find((m) => m.id === 'comparison')?.aiPrompt || '',
    story: messageTypes.find((m) => m.id === 'story')?.aiPrompt || '',
  };

  const defaultPrompt = basePrompts[messageId] || '';

  // 사람 모델이 아닐 경우, 사람의 표정이나 감정을 묘사하는 변주를 제외해야 함
  const hasNoPerson = ['product-ui-only', 'hands-only'].includes(modelId);

  switch (messageId) {
    case 'comparison':
      const comparisonVariations = [
        'Split Screen Composition. The image is divided into two distinct sides. Left side shows a "before" or "problem" state (slightly desaturated), Right side shows "after" or "solution" state (bright and colorful). Clear visual contrast.', // Split
        'Visual Metaphor of Order. Chaos organizing into structure. One side has scattered elements, the other side has them perfectly aligned. Symbolizing organization and clarity.', // Chaos to Order
        'Side-by-Side Product Comparison. Two distinct options placed next to each other. One is clearly superior with better lighting or visual appeal. "A vs B" layout.', // A vs B
      ];
      return selectOption(comparisonVariations, variationIndex, randomSeed);

    case 'problem-solving':
      const problemVariations = [
        'The Ideal Result. A scene showing the perfect state achieved after using the product. Everything is organized, efficient, and working smoothly. A sense of completion and perfection.', // Ideal State
        'Stress-Free Environment. A calm, clean, and pleasant atmosphere where the "problem" is visibly absent. Focus on the positive outcome and the lack of friction or difficulty.', // Stress-free
      ];
      // 사람 표정 옵션은 사람이 있을 때만 추가
      if (!hasNoPerson) {
        problemVariations.push(
          'Expression of Pure Satisfaction. Close-up on a person looking genuinely happy and relieved because their problem is gone. Relaxed posture, smiling face. The product is the cause of this joy.'
        );
      }
      return selectOption(problemVariations, variationIndex, randomSeed);

    case 'benefit':
      const benefitVariations = [
        'Hero Shot Low Angle. The product is placed centrally, shot from a slightly low angle to make it look monumental and important. Rays of light or glow behind it.', // Hero
        'Visualizing the Intangible. Integrate abstract benefit symbols naturally into the scene as visual metaphors. These symbols should blend seamlessly with the composition, not appear as separate floating icons. No text, numbers, or readable labels on any symbols.', // Icons
        'Radiating Benefits. The product at the center with visual benefit elements organically flowing from it through natural connections (light rays, energy waves, or environmental elements). Represent benefits as abstract visual shapes and symbols integrated into the scene, not as separate icon elements. No text, numbers, or readable labels.', // Radiating
      ];
      // 라이프스타일 옵션은 사람이 있을 때 더 자연스러움 (없어도 가능은 하나 맥락상)
      if (!hasNoPerson) {
        benefitVariations.push(
          'Lifestyle Bliss. A wide shot showing the "ideal life" achieved through the product. Pure enjoyment, leisure, and lack of stress. The product is the subtle enabler.'
        );
      } else {
        benefitVariations.push(
          'Perfect Environment. The product is placed in an ideal, stress-free environment (e.g., a perfect desk setup, a sunny window). Symbolizing the result of using the product.'
        );
      }
      return selectOption(benefitVariations, variationIndex, randomSeed);

    case 'story':
      const storyVariations = [
        'Two-Panel Sequence. A diptych composition with 2 rectangular sections showing a natural progression through visuals only.', // Two-Panel
        'Two-Panel Sequence. A diptych composition with 2 circular sections showing a natural progression through visuals only.', // Two-Panel
        'Three-Panel Sequence. A triptych composition with 3 rectangular sections showing a natural progression through visuals only.', // Sequence
        'Three-Panel Sequence. A triptych composition with 3 circular sections showing a natural progression through visuals only.', // Sequence
      ];
      return selectOption(storyVariations, variationIndex, randomSeed);

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
  category?: ProductCategory,
  variationIndex?: number,
  randomSeed?: number
): string => {
  // 동적 Model Prompt 생성
  const modelPrompt = getDynamicModelPrompt(
    styles.model,
    styles.visualStyle,
    category?.form,
    category?.industry,
    variationIndex,
    randomSeed
  );

  // 동적 Visual Style Prompt 생성
  const visualPrompt = getDynamicVisualPrompt(
    styles.visualStyle,
    category?.industry,
    variationIndex,
    randomSeed
  );

  // 동적 Message Prompt 생성 (Model 유무 고려)
  const messagePrompt = getDynamicMessagePrompt(
    styles.messageType,
    styles.model,
    variationIndex,
    randomSeed
  );

  return `[Core Concept Summary]
${summary.core_value}

[Product Context]
This product/service falls under the category of ${category?.industry}, with the product type of ${category?.form}.  
The advertising purpose is: ${category?.purpose}.

[Style Package]
Apply the following style package as a single unified direction:
– Message Type: ${messagePrompt}
– Visual Style: ${visualPrompt}
– Model Composition: ${modelPrompt}

[Output Requirements]
Generate one high-quality SNS advertisement image.  
Avoid readable text. If text-like elements (UI labels, chart numbers) are necessary for the composition, represent them as abstract lines or illegible placeholders. Focus on visual symbols over written words.
Use a realistic, clear, visually appealing composition that reflects the advertising purpose.  
Avoid distortions, avoid artifacts, and maintain natural lighting.  
Focus solely on visually conveying the product's core value and purpose through the selected style package.

[Device Screen Display Rules]
When showing devices (smartphones, tablets, laptops, monitors), strictly follow these rules:
- If the front face of the device is visible, the screen content can be shown.
- If only the back of the device is visible, NO screen content should appear (only the device back cover, camera module, logo, etc.).
- If the device is held at an angle where the screen is partially visible, only show screen content on the visible portion.
- Never show screen content on the back of a device. This is physically impossible and creates an unrealistic image.
`;
};
