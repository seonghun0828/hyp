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

/**
 * Context(Category)와 Randomness에 따라 Visual Style Prompt를 동적으로 생성하는 함수
 */
const getDynamicVisualPrompt = (
  visualId: string,
  categoryIndustry?: string
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

  // 랜덤 선택 헬퍼 함수
  const pickRandom = (options: string[]) => {
    return options[Math.floor(Math.random() * options.length)];
  };

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
        'French Bandes Dessinées (Moebius style). Intricate ink lines, flat pastel colors, surreal and sci-fi atmosphere, detailed environments.',
        'Modern Flat Cartoon. Vector-like clean shapes, bold solid colors, minimalist character design, corporate illustration style.',
      ];
      return pickRandom(cartoonVariations);

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
        return pickRandom(techVariations);
      }
      // 그 외 일반적인 경우
      const illustrationVariations = [
        'Soft Watercolor Painting. Wet-on-wet textures, pastel colors, artistic brush strokes, dreamy atmosphere.', // Watercolor
        'Oil Painting Impasto. Visible thick brush strokes, rich texture, vibrant color blending, fine art aesthetic.', // Oil
        'Modern Vector Art. Clean curves, flat design, vibrant gradients, stylized composition.', // Vector
        'Hand-drawn Pencil Sketch with Color. Rough pencil textures, colored pencil shading, organic and warm feel.', // Colored Pencil
      ];
      return pickRandom(illustrationVariations);

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
        return 'Technical Blueprint Style. White lines on blueprint blue background, grid patterns, precise geometric lines, architectural feel.';
      }
      const lineVariations = [
        'Minimalist Continuous Line Art. Single fluid black line on white background, abstract and elegant.', // Continuous
        'Hand-drawn Doodle Style. Playful, loose scribbles, sketchy feel, casual and friendly.', // Doodle
        'Detailed Pen and Ink. Cross-hatching shading, intricate details, black ink on textured paper.', // Pen & Ink
      ];
      return pickRandom(lineVariations);

    default:
      return defaultPrompt;
  }
};

/**
 * Randomness에 따라 Tone & Mood Prompt를 동적으로 생성하는 함수
 */
const getDynamicTonePrompt = (toneId: string): string => {
  // 기본값 fallback
  const basePrompts: Record<string, string> = {
    'warm-comfortable':
      toneMoods.find((t) => t.id === 'warm-comfortable')?.aiPrompt || '',
    'trust-serious':
      toneMoods.find((t) => t.id === 'trust-serious')?.aiPrompt || '',
    'humor-light':
      toneMoods.find((t) => t.id === 'humor-light')?.aiPrompt || '',
    'premium-sophisticated':
      toneMoods.find((t) => t.id === 'premium-sophisticated')?.aiPrompt || '',
    'energetic-vibrant':
      toneMoods.find((t) => t.id === 'energetic-vibrant')?.aiPrompt || '',
  };

  const defaultPrompt = basePrompts[toneId] || '';

  // 랜덤 선택 헬퍼 함수
  const pickRandom = (options: string[]) => {
    return options[Math.floor(Math.random() * options.length)];
  };

  switch (toneId) {
    case 'warm-comfortable':
      const warmVariations = [
        'Golden Hour Lighting. Soft, warm sunlight coming from the side, long shadows, inviting and cozy atmosphere. Color palette: Amber, Gold, Soft Beige.', // Golden Hour
        'Cozy Indoor Lighting. Soft diffused light from a window or lamp, warm color temperature (3000K), comfortable and safe feeling. Color palette: Earth tones, Cream, Warm Brown.', // Hygge
        'Soft Morning Light. Fresh and gentle morning sunlight, low contrast, peaceful and calm mood. Color palette: Pastel Yellow, Soft White, Light Green.', // Morning
      ];
      return pickRandom(warmVariations);

    case 'trust-serious':
      const trustVariations = [
        'Professional Studio Lighting. Balanced and even lighting, cool color temperature (5000K), clean white or grey background, sharp details. Color palette: Navy Blue, White, Grey.', // Corporate
        'Modern Minimalist Lighting. Soft shadows, clean lines, uncluttered composition, calm and reliable atmosphere. Color palette: Cool Grey, Muted Blue, Slate.', // Minimal
        'Dramatic Professional. Slightly higher contrast, focused spotlight on the subject, deep shadows for weight and seriousness. Color palette: Deep Blue, Charcoal, Silver.', // Dramatic
      ];
      return pickRandom(trustVariations);

    case 'humor-light':
      const humorVariations = [
        'Vibrant Pop Style. High key lighting, bright and saturated colors, playful atmosphere, almost no shadows. Color palette: Primary Red, Yellow, Blue.', // Pop
        'Soft Pastel Lighting. Very soft and diffused light, low contrast, dreamy and cute atmosphere. Color palette: Mint, Baby Pink, Lemon Yellow.', // Pastel
        'Quirky High-Contrast. Hard lighting with distinct colorful shadows, energetic and fun mood. Color palette: Hot Pink, Electric Blue, Lime Green.', // Funky
      ];
      return pickRandom(humorVariations);

    case 'premium-sophisticated':
      const premiumVariations = [
        'Luxury Dark Mode. Low key lighting, rim lighting highlighting edges, dark background, mysterious and elegant. Color palette: Black, Gold, Deep Emerald.', // Dark Luxury
        'High-End Editorial. Soft but directional lighting, refined textures, elegant composition, expensive feel. Color palette: Champagne, Silk White, Bronze.', // Editorial
        'Modern Chic. Clean, bright, and airy, but with sharp contrast and high-quality materials. Color palette: Marble White, Matte Black, Metallic accents.', // Chic
      ];
      return pickRandom(premiumVariations);

    case 'energetic-vibrant':
      const energeticVariations = [
        'Neon Cyberpunk Lighting. Colorful neon lights (magenta and cyan), dark background, glowing effects, futuristic and intense. Color palette: Neon Purple, Cyan, Black.', // Cyberpunk
        'Active Sunlight. Bright, hard sunlight (high noon), strong cast shadows, saturated colors, dynamic and powerful. Color palette: Orange, Vivid Blue, White.', // Sports
        'Dynamic Studio Flash. High contrast colorful gels, motion blur suggestions, exciting and bold. Color palette: Electric Blue, Hot Pink, Vivid Purple.', // Studio Color
      ];
      return pickRandom(energeticVariations);

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

  // 동적 Visual Style Prompt 생성
  const visualPrompt = getDynamicVisualPrompt(
    styles.visualStyle,
    category?.industry
  );

  // 동적 Tone Prompt 생성
  const tonePrompt = getDynamicTonePrompt(styles.toneMood);

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
– Visual Style: ${visualPrompt}
– Tone & Mood: ${tonePrompt}
– Model Composition: ${modelPrompt}

[Output Requirements]
Generate one high-quality SNS advertisement image.  
The image must contain **no text**, including on UI screens, devices, props, or backgrounds.  
Use a realistic, clear, visually appealing composition that reflects the advertising purpose.  
Avoid distortions, avoid artifacts, and maintain natural lighting.  
Focus solely on visually conveying the product’s core value and purpose through the selected style package.
`;
};
